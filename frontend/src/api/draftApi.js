// src/api/draftApi.js
import { authHttp as http } from "./http";

/** 내가 제출한 초안 목록만 (DRAFT 제외) */
export async function fetchMySubmittedDrafts(page = 0, size = 10) {
    const res = await http.get("/api/my-recipes/approvals", {
        params: { page, size },
    });
    return res.data;
}

/** (옵션) 제출 취소: PENDING -> DRAFT */
export async function cancelMySubmission(draftId) {
    const res = await http.post(`/api/drafts/${draftId}/cancel`);
    return res.data;
}
