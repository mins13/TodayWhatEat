// src/api/adminRecipeDraftApi.js
import { authHttp as http } from "./http";

/**
 * @param {{page?:number, size?:number, signal?:AbortSignal}} opts
 */
export async function fetchPendingDrafts(opts = {}) {
    const { page = 0, size = 20, signal } = opts;
    const res = await http.get("/api/admin/recipe-drafts/pending", {
        params: { page, size },
        signal,
    });
    return res.data;
}

export async function fetchDraftById(id, { signal } = {}) {
    const res = await http.get(`/api/admin/recipe-drafts/${id}`, { signal });
    return res.data;
}

export async function approveDraft(id, { signal } = {}) {
    const res = await http.post(
        `/api/admin/recipe-drafts/${id}/approve`,
        {},
        { signal }
    );
    return res.data;
}

export async function rejectDraft(id, reason = "형식 미흡", { signal } = {}) {
    const res = await http.post(
        `/api/admin/recipe-drafts/${id}/reject`,
        { reason },
        { signal }
    );
    return res.data;
}
