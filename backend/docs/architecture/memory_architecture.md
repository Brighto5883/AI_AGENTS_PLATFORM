# Memory Architecture

## Overview

This document describes how conversation memory actually works today, and explicitly why two
originally-proposed backends (a standalone vector database and the LangGraph checkpointer) are
**not** part of the current design, so nobody re-adds them under a misunderstanding of what they
solve.

Memory is prepared *before* an agent is invoked, not fetched by the agent itself mid-reasoning.
This guarantees history is always present, rather than depending on the LLM's discretion to call
a tool for it.

```
WhatsAppService.receive_message()
        |
        v
MemoryService.prepare_context(conversation_id, session)
        |
        v
AgentService.ask(context={"conversation_id": ..., "history": [...]})
        |
        v
BaseAgent.invoke()  →  seeds `history` into graph state, sets `agent_context`
```

---

## 1. Source of Truth: PostgreSQL

`app/memory/postgres.py` — `fetch_recent_messages(conversation_id, session, limit=10)` — queries
`WhatsAppMessage`, ordered oldest-first, shaped into role/content dicts ready to seed graph state.

**This is deliberately the source of truth, not a fallback.** `WhatsAppMessage` rows are only ever
created in two places:

1. On inbound receipt (`receive_message`) — the raw customer message.
2. On actual send (`send_approved_draft`) — using `draft.edited_content or draft.draft_content`.

Because of (2), Postgres history is **already correctly filtered by construction**: if a human
reviewer edited a draft before approving it, the edited version — not the AI's original — is what
gets stored and later fed back to the agent as its own prior turn. Rejected drafts never produce a
row at all. The agent's memory of "what I said" always matches what the customer actually
received.

### Fetch-before-insert ordering

`MemoryService.prepare_context()` **must** be called before the current inbound message is
inserted into `WhatsAppMessage`. If called after, the just-inserted message would appear twice —
once in `history`, once as the explicit current-turn query — since `session.flush()` makes it
queryable within the same transaction.

---

## 2. Cache: Redis

`app/memory/redis.py` wraps `fetch_recent_messages` in a cache-aside pattern:

```python
async def prepare_context(self, conversation_id, session):
    cached = await get_cached_history(conversation_id)
    if cached is not None:
        return {"history": cached}
    history = await fetch_recent_messages(conversation_id, session, limit=self.history_limit)
    await set_cached_history(conversation_id, history)
    return {"history": history}
```

**What the cache is actually for.** Within a single agent turn, the flow always
invalidates-then-refetches (a new message is always written immediately before or after an agent
call), so the cache is rarely hit by the agent's own back-to-back turns. Its real value is for
**concurrent reads that happen between agent invocations** — the draft review frontend polling
`GET /drafts/` every ~8s, or a reviewer opening a conversation thread — which hit a cache that's
still warm from the last write.

**TTL vs. invalidation.** `CACHE_TTL_SECONDS = 300` is a **safety net**, not the primary freshness
mechanism. Explicit invalidation (`invalidate_history(conversation_id)`, called immediately after
any new `WhatsAppMessage` is written) is what actually keeps the cache correct in the normal case.
The TTL exists so that if a crash happens between a Postgres write and the invalidation call, the
stale cache self-heals within 5 minutes regardless.

**Fail-open, everywhere.** Every function in `redis.py` calls `get_redis_client()` fresh (not a
module-level singleton captured at import time) and returns/no-ops silently if the client is
`None` or if any Redis operation raises. Redis being down must never take down message processing
— callers (`MemoryService`, `wait_for_rate_limit_slot`) fall through to Postgres or proceed
unthrottled, exactly as `app/cache.py`'s LiteLLM cache configuration already does.

This is a **separate Redis usage** from `app/cache.py`. `cache.py` configures LiteLLM's own
response cache (caching LLM completions to avoid paying for identical prompts twice) —
`memory/redis.py` uses its own connection (`get_redis_client()`, also in `app/cache.py`) for
conversation-history caching. Same underlying Redis instance, two unrelated cached datasets.

---

## 3. Why there is no standalone vector database here

The original proposal conflated two different concepts under "vector database":

- **Conversation memory** ("what did this customer say 5 messages ago") — solved by Postgres +
  Redis above. This is retrieval of *exact* prior turns, not semantic search.
- **Knowledge retrieval** ("what does our return policy say") — this is RAG over business
  documents, a *different* concept, and the platform already has a full implementation of it
  (`app/knowledge/indexing`, `app/knowledge/retrieval`, FAISS-backed, hybrid + vectorless RAG)
  built for the Road Design agent.

When WhatsApp (or any future agent) needs semantic search over business documents/policies, it
should reuse `app/knowledge/`, not fork a second, parallel vector store. No new vector
infrastructure is needed until there is an actual document corpus to index for a given agent.

---

## 4. Why the LangGraph Checkpointer is not wired into memory

`app/memory/checkpoint.py` exists as a placeholder file, deliberately unimplemented. Reasoning:

A LangGraph checkpointer persists **graph execution state** — useful for resuming a run that was
interrupted mid-execution (e.g. a crashed tool call). It has **no visibility into anything that
happens after a graph run completes** — specifically, the human review layer (`DraftReply`
approve / edit / reject) happens entirely outside any graph execution.

If the checkpointer's own stored messages were used as the source of seeded history instead of
Postgres, the agent's memory would silently drift from reality: an edited draft would be
misremembered as sent verbatim, and a rejected draft — never sent at all — might still appear as
part of the agent's own conversation history. Postgres does not have this problem, because
`WhatsAppMessage` rows are only ever written from the actual delivered content.

**Where the checkpointer would genuinely help, if adopted later:** resuming a graph mid-reasoning
after a crash, or implementing LangGraph's native `interrupt()`/resume pattern for cases where the
*agent itself* needs to pause and ask a clarifying question before it can finish reasoning (e.g.
"is this order #1234 or #1235?"). That is a different problem from the `DraftReply` review gate,
which is a content/compliance checkpoint sitting *outside* the agent's cognition, not a pause
inside it — see the design note in `checkpoint.py` itself for the full reasoning on why
`DraftReply` is the better fit for approve/reject/send, not a placeholder for something "more
proper."

---

## 5. Extension Points

- **History windowing/summarization** — not yet implemented. Currently fetches the last 10 raw
  messages; long-running conversations will eventually need older turns summarized rather than
  dropped or fetched in full.
- **Cross-conversation memory** — not yet implemented. Everything above scopes to a single
  `conversation_id`. A customer-level profile store (preferences, history across channels) is a
  distinct, later feature, not an extension of this module.
- **Other agents** — Road Design and Email do not currently have `MemoryService` wired in. The
  same pattern (fetch history before invoke, seed into `context["history"]`) applies unchanged
  whenever they need it.
