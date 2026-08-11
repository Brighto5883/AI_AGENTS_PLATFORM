# WhatsApp Agent Execution Flow

## Overview

This document describes the actual, current end-to-end path of a WhatsApp message: from Meta's
webhook, through persistence, agent reasoning, human review, and back out to the customer. It
supersedes the original draft version of this document, which described an earlier, simpler
design before rate limiting, memory, multimodal input, and the draft-review UI existed.

---

## End-to-End Flow

```
Customer (WhatsApp)
      |
      v
Meta Webhook  →  POST /webhooks/whatsapp/
      |
      v
receive_webhook()  — parses payload, branches on message type, ACKs Meta fast
      |
      v
background_tasks.add_task(process_inbound_message)   ← Meta already got its 200 OK
      |
      v
wait_for_rate_limit_slot(customer_phone)              ← per-phone throttle, fail-open
      |
      v
WhatsAppService.receive_message()
      |
      +--- dedupe check (whatsapp_message_id, handles Meta's webhook retries)
      +--- get-or-create WhatsAppConversation
      +--- MemoryService.prepare_context()             ← fetched BEFORE inserting the new message
      +--- persist inbound WhatsAppMessage
      +--- invalidate Redis history cache
      |
      v
AgentService.ask(context={conversation_id, history})
      |
      v
AgentRouter  →  WhatsAppAssistant.invoke()
      |
      v
LangGraph execution (tool calls scoped to whats_biz only)
      |
      v
DraftService.create_draft()  →  DraftReply(status=pending)
      |
      v
[ Human review, via DraftReview.jsx ]
      |
      +--- Approve (as-is or edited)  →  DraftStatus.APPROVED / EDITED
      +--- Reject                     →  DraftStatus.REJECTED, nothing sent
      |
      v
DraftService.send()  →  WhatsAppService.send_approved_draft()
      |
      v
WhatsAppClient.send_text_message()  →  Meta Graph API
      |
      v
Persist outbound WhatsAppMessage, invalidate cache, DraftStatus.SENT
      |
      v
Customer receives the reply
```

---

## 1. Inbound Webhook

`GET /webhooks/whatsapp/` handles Meta's one-time verification handshake (`hub.challenge` /
`hub.verify_token`).

`POST /webhooks/whatsapp/` is the real inbound path. It:

1. Parses Meta's payload (`entry[0].changes[0].value`), extracting sender phone, message ID,
   sender name, and message type (`text` / `audio`).
2. For `text`, reads `message["text"]["body"]` directly.
3. For `audio`, resolves the voice note synchronously, in the foreground, *before* acknowledging
   Meta: `WhatsAppClient.get_media_url()` → `download_media()` → `TranscriptionClient.transcribe()`
   (Groq Whisper). The resulting transcript becomes `content`, identical in shape to a text
   message from this point on. Everything downstream — the agent, drafts, the review UI — never
   knows a message originated as audio; `message_type` on `WhatsAppMessage` records provenance
   only.
4. Any other message type (e.g. image) is currently ignored (`{"status": "ignored"}`) — reserved
   for a future phase.
5. Hands off the rest of processing to `background_tasks.add_task(process_inbound_message, ...)`
   and returns `{"status": "received"}` **immediately** — this is what lets the webhook
   acknowledge Meta fast regardless of how long agent reasoning takes, so Meta has no reason to
   retry due to slowness.

Malformed/unexpected payloads (missing keys, no messages) are swallowed with `{"status":
"ignored"}` rather than raised — a webhook 500 on a payload type this route doesn't care about
(e.g. delivery/read receipts) would just cause Meta to retry pointlessly.

---

## 2. Background Processing

`process_inbound_message` runs *after* the HTTP response has already gone out. It owns its own DB
session (`get_session_context()`), since the request-scoped session no longer exists by this
point.

**Rate limiting** happens first, keyed by `customer_phone` (not a platform user — Meta's webhook
carries no authenticated user). `wait_for_rate_limit_slot` retries in short increments for up to
45s rather than dropping the message outright on the first over-limit hit — a normal customer
sending a quick burst of messages gets all of them processed, just slightly delayed; only a
sender still over the limit after the full wait is dropped (and logged). Any Redis failure during
this check fails open — infrastructure trouble must never silently discard a customer's message.

---

## 3. `WhatsAppService.receive_message()`

- **Dedup check**: if `whatsapp_message_id` already exists in `WhatsAppMessage`, returns `None`
  immediately — handles Meta's webhook retries without creating duplicate drafts.
- **Get-or-create conversation**: looked up by `customer_phone`.
- **Memory fetch happens before the new message is inserted** — see
  `memory_architecture.md` for why this ordering is required (otherwise the current message would
  be duplicated in the agent's own input).
- **Persist inbound message**, then **invalidate the Redis history cache** for this conversation —
  any read after this point (agent, or the review UI) must see the new message, not a stale
  cached version.
- **Call the agent** via `AgentService.ask(context={"conversation_id": ..., "history": ...})`.
- **Create the draft** via `DraftService.create_draft(...)` — `WhatsAppService` does not construct
  `DraftReply` directly; draft lifecycle (create, approve, reject, send) is entirely owned by
  `DraftService`. This keeps `WhatsAppService` responsible only for WhatsApp-specific mechanics
  (Meta API calls, conversation/message persistence), so the same pattern is directly reusable
  when an Email channel is added later.

---

## 4. Human Review

`DraftReply` rows are surfaced via `GET /drafts/?status=pending`, reviewed in `DraftReview.jsx` —
a WhatsApp-style compose UI showing the real conversation thread (`GET /drafts/{id}/thread`)
above an editable, auto-focused reply box.

- **Approve (as-is)** → `DraftStatus.APPROVED`.
- **Approve (edited)** → `edited_content` is set, status becomes `DraftStatus.EDITED`.
- **Reject** → `DraftStatus.REJECTED`, `rejection_reason` optionally recorded. Nothing is ever
  sent for a rejected draft.

All transitions are guarded in `DraftService` — a draft can only be approved/rejected once
(`_ensure_pending`), and can only be sent once it's in `APPROVED` or `EDITED` state.

---

## 5. Outbound Send

`DraftService.send()` delegates to `WhatsAppService.send_approved_draft()`, which:

1. Reads `draft.edited_content or draft.draft_content` — the edited version wins if present.
2. Calls `WhatsAppClient.send_text_message()` — a real Meta Graph API call.
3. Persists a new outbound `WhatsAppMessage` with that exact content — this is what guarantees
   Postgres-sourced conversation history always reflects what was *actually delivered*, edits
   included, rejections excluded.
4. `DraftReply.status` becomes `SENT`.

---

## 6. Tool Access During Agent Reasoning

`WhatsAppAssistant` declares `mcp_server_names = ["whats_biz"]`, so `MCPClient.get_tools()` loads
**only** tools from that server — no agent can call another domain's tools, by construction (see
`agent_lifecycle.md`).

`get_conversation_context` (the primary WhatsApp tool) no longer returns conversation history —
that responsibility moved to `MemoryService`, seeded into state before invocation. The tool now
returns only customer profile, business FAQs, and writing-style guidance — content genuinely
appropriate for on-demand, LLM-discretionary retrieval, unlike history, which must always be
present.

---

## 7. Cost & Reliability Layers (cross-cutting, not WhatsApp-specific)

- **LLM Gateway** (`app/llm/gateway.py`): every agent's LLM calls carry an automatic cross-provider
  fallback chain (Groq → OpenAI → Anthropic) and a cost-logging callback keyed to
  `agent_context` — see `agent_lifecycle.md`.
- **Rate limiting**: two independent limiters exist — `enforce_rate_limit` (per authenticated
  platform user, used on dashboard-facing routes) and `wait_for_rate_limit_slot` (per WhatsApp
  phone number, used on the unauthenticated webhook path). Both fail open on Redis failure.
