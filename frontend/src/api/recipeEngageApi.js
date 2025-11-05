// src/api/recipeEngageApi.js
import { authHttp as http } from "./http";

/** 정렬 목록 (popular | view | default 등) */
export async function fetchRecipesSorted(sort = "popular") {
    const { data } = await http.get("/api/recipes", {
        params: { sort },
    });
    return data;
}

/** 좋아요 상태 조회 */
export async function fetchLikeStatus(recipeId) {
    const { data } = await http.get(`/api/recipes/${recipeId}/like/status`);
    return data; // { liked, likes }
}

/** 좋아요 토글 */
export async function toggleLike(recipeId) {
    const { data } = await http.post(
        `/api/recipes/${recipeId}/like/toggle`,
        {}
    );
    return data; // { liked, likes }
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
