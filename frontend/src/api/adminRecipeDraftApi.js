// src/api/adminRecipeDraftApi.js
import { http } from "./http";

export async function fetchPendingDrafts(page = 0, size = 20) {
    const res = await http.get("/api/admin/recipe-drafts/pending", { params: { page, size } });
    return res.data;
}

export async function fetchDraftById(id) {
    const res = await http.get(`/api/admin/recipe-drafts/${id}`);
    return res.data;
}

export async function approveDraft(id) {
    const res = await http.post(`/api/admin/recipe-drafts/${id}/approve`, {});
    return res.data;
}

export async function rejectDraft(id, reason = "형식 미흡") {
    const res = await http.post(`/api/admin/recipe-drafts/${id}/reject`, { reason });
    return res.data;
}
