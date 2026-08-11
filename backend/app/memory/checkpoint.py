"""
Deliberately not wired in yet.

LangGraph's checkpointer persists *graph execution state* — useful for
resuming an interrupted mid-run (e.g. a crashed tool call), not for
cross-turn conversation memory. It has no visibility into what happens
after a graph run ends — specifically, this platform's human review
layer (DraftReply approve/edit/reject) all happens outside any graph
execution.

If wired in naively as the source of seeded history, the agent's memory
of "what I said" would drift from what was actually delivered — an
edited or rejected draft would be misremembered as sent verbatim.

Postgres (via memory/postgres.py) remains the correct source of cross-turn
history, since WhatsAppMessage rows are only ever created from
draft.edited_content or draft.draft_content at actual send time — already
correctly filtered by construction.

Future direction: replace the DraftReply state machine with LangGraph's
native interrupt()/resume pattern, which is what checkpointing is
actually built for. That's a redesign of the review workflow itself,
not an addition to memory — a separate phase.
"""