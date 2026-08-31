import { apiFetch } from "@/services/api";
import type { RoadQueryInput, QueryResponse } from "@/types/road";

export async function executeRoadQuery(
  request: RoadQueryInput
): Promise<QueryResponse> {
  const formData = new FormData();

  formData.append("query", request.query);
  formData.append("method", request.method);

  if (request.file) {
    formData.append("file", {
      uri: request.file.uri,
      name: request.file.name,
      type: request.file.mimeType ?? "application/octet-stream",
    } as any);
  }
  
  const response = await apiFetch("/query/", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}