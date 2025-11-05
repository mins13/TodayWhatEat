// src/api/recipeEngageApi.js
import { authHttp as http } from "./http";

/** 정렬 목록 */
export async function fetchRecipesSorted(sort = "popular") {
    const { data } = await http.get("/api/recipes", { params: { sort } });
    return data;
}

/** ✅ 레시피 상세 */
export async function fetchRecipeDetail(recipeId) {
    const { data } = await http.get(`/api/recipes/${recipeId}`);
    return data;
}

/** ✅ 레시피 추천 목록 */
export async function fetchRecipeRecommendations(recipeId, limit = 3) {
    const { data } = await http.get(
        `/api/recipes/${recipeId}/recommendations`,
        { params: { limit } }
    );
    return Array.isArray(data) ? data : [];
}

/** 좋아요 상태 */
export async function fetchLikeStatus(recipeId) {
    const { data } = await http.get(`/api/recipes/${recipeId}/like/status`);
    return data;
}

/** 좋아요 토글 */
export async function toggleLike(recipeId) {
    const { data } = await http.post(`/api/recipes/${recipeId}/like/toggle`, {});
    return data;
}

/** 조회수 +1 */
export async function addView(recipeId) {
    const viewKey =
        localStorage.getItem("vw-key") ||
        crypto.randomUUID?.() ||
        String(Date.now());
    localStorage.setItem("vw-key", viewKey);

    const { data } = await http.post(
        `/api/recipes/${recipeId}/view`,
        {},
        { headers: { "X-View-Key": viewKey } }
    );
    return data; // { views }
}
