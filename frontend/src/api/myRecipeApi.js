// src/api/myRecipeApi.js
import { authHttp as http } from "./http";

/** 나만의 레시피 목록 (초안 목록) */
export async function fetchMyRecipes(page = 0, size = 10) {
    const res = await http.get("/api/my-recipes", { params: { page, size } });
    return res.data;
}

/** 나만의 레시피 단건 조회 (DraftRecipeRes) */
export async function getMyRecipe(id) {
    const res = await http.get(`/api/my-recipes/${id}`);
    return res.data;
}

/** 나만의 레시피 생성 */
export async function createMyRecipe(payload) {
    const res = await http.post("/api/my-recipes", payload);
    return res.data;
}

/** 나만의 레시피 수정 */
export async function updateMyRecipe(id, payload) {
    const res = await http.put(`/api/my-recipes/${id}`, payload);
    return res.data;
}

/** 나만의 레시피 삭제 */
export async function deleteMyRecipe(id) {
    const res = await http.delete(`/api/my-recipes/${id}`);
    return res.data;
}

/** 승인 신청 */
export async function requestMyRecipeApproval(id) {
    const res = await http.post(`/api/my-recipes/${id}/approval`, {});
    return res.data ?? {};
}

/** ✅ MyRecipe의 승인 상태 조회 */
export async function getMyRecipeApprovalStatus(myRecipeId) {
    const res = await http.get(`/api/my-recipes/${myRecipeId}/approval-status`);
    return res.data; // { status, rejectionReason, draftId, updatedAt }
}
