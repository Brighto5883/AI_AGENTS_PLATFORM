import api from "../api/axios";

export const getDrafts = async (status = "pending") => {
  const response = await api.get("/drafts/", { params: { status } });
  return response.data;
};

export const getDraft = async (draftId) => {
  const response = await api.get(`/drafts/${draftId}`);
  return response.data;
};

export const approveDraft = async (draftId, editedContent = null) => {
  const response = await api.post(`/drafts/${draftId}/approve`, {
    edited_content: editedContent,
  });
  return response.data;
};

export const rejectDraft = async (draftId, reason = null) => {
  const response = await api.post(`/drafts/${draftId}/reject`, { reason });
  return response.data;
};

export const sendDraft = async (draftId) => {
  const response = await api.post(`/drafts/${draftId}/send`);
  return response.data;
};

export const getDraftThread = async (draftId) => {
  const response = await api.get(`/drafts/${draftId}/thread`);
  return response.data;
};