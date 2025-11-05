// src/api/recipeDraftApi.js
import { authHttp as http } from "./http";

export async function createDraft(payload) {
    return (await http.post("/api/drafts", payload)).data;
}

export async function updateDraft(id, payload) {
    return (await http.put(`/api/drafts/${id}`, payload)).data;
}

export async function submitDraft(id) {
    return (await http.post(`/api/drafts/${id}/submit`)).data;
}

export async function fetchMyDrafts(page = 0, size = 10) {
    return (
        await http.get(`/api/drafts/my`, { params: { page, size } })
    ).data;
}

// ✅ 추가: 단건 조회
export async function getDraft(id) {
    return (await http.get(`/api/drafts/${id}`)).data;
}

export async function uploadDraftImage(file) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await http.post("/api/drafts/upload", fd);
    return typeof data === "string" ? data : data?.url;
}
