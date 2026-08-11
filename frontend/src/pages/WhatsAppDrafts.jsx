import { useState, useEffect, useCallback, useRef } from "react";
import { getDrafts, getDraftThread, approveDraft, rejectDraft, sendDraft } from "../services/drafts";
import "../styling/WhatsAppDraft.css";

const POLL_INTERVAL_MS = 8000;

export default function WhatsAppDrafts() {
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [thread, setThread] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const data = await getDrafts("pending");
      setDrafts(data);
    } catch (error){
      setError(error.response?.data?.detail || error.message || "Couldn't load drafts.");
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
    const interval = setInterval(fetchDrafts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDrafts]);

  const selectDraft = async (draft) => {
    setSelectedDraft(draft);
    setEditedText(draft.draft_content);
    setError(null);
    setThread(null);
    try {
      const threadData = await getDraftThread(draft.id);
      setThread(threadData);
    } catch {
      setError(error.response?.data?.detail || error.message || "Couldn't load conversation history.");
    }
    // autofocus + place caret at the end, mimicking tapping into a real WhatsApp reply box
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 0);
  };

  const autoGrow = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleConfirmSend = async () => {
    if (!selectedDraft) return;
    setBusy(true);
    setError(null);
    try {
      const wasEdited = editedText.trim() !== selectedDraft.draft_content.trim();
      await approveDraft(selectedDraft.id, wasEdited ? editedText : null);
      await sendDraft(selectedDraft.id);

      setDrafts((prev) => prev.filter((d) => d.id !== selectedDraft.id));
      setSelectedDraft(null);
      setThread(null);
      setEditedText("");
    } catch {
      setError("Failed to send. The draft may need review again.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDraft) return;
    setBusy(true);
    setError(null);
    try {
      await rejectDraft(selectedDraft.id);
      setDrafts((prev) => prev.filter((d) => d.id !== selectedDraft.id));
      setSelectedDraft(null);
      setThread(null);
      setEditedText("");
    } catch {
      setError("Failed to reject.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="draft-review-layout">
      <aside className="draft-list">
        <h2>Pending Replies</h2>
        {drafts.length === 0 && <p className="draft-list-empty">Nothing waiting for review.</p>}
        {drafts.map((draft) => (
          <button
            key={draft.id}
            className={`draft-list-item ${selectedDraft?.id === draft.id ? "active" : ""}`}
            onClick={() => selectDraft(draft)}
          >
            <span className="draft-preview">{draft.draft_content.slice(0, 60)}</span>
            <span className="draft-timestamp">
              {new Date(draft.created_at).toLocaleTimeString()}
            </span>
          </button>
        ))}
      </aside>

      <main className="draft-panel">
        {!selectedDraft ? (
          <div className="draft-panel-empty">Select a draft to review</div>
        ) : (
          <>
            {thread && (
              <div className="thread-header">
                <strong>{thread.customer_name || thread.customer_phone}</strong>
                <span className="thread-phone">{thread.customer_phone}</span>
              </div>
            )}

            <div className="thread-scroll">
              {thread?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`thread-bubble ${msg.direction === "inbound" ? "inbound" : "outbound"}`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {error && <p className="draft-error">{error}</p>}

            <div className="compose-bar">
              <textarea
                ref={textareaRef}
                className="compose-textarea"
                value={editedText}
                onChange={(e) => {
                  setEditedText(e.target.value);
                  autoGrow(e);
                }}
                disabled={busy}
                rows={1}
                placeholder="Edit reply before sending..."
              />
              <div className="compose-actions">
                <button className="btn-reject" onClick={handleReject} disabled={busy}>
                  Reject
                </button>
                <button
                  className="btn-confirm-send"
                  onClick={handleConfirmSend}
                  disabled={busy || editedText.trim().length === 0}
                >
                  {busy ? "Sending..." : "Confirm & Send"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
