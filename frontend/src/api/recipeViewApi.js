// src/api/recipeViewApi.js
import { authHttp as http } from "./http";

// Page든 배열이든 → 항상 배열로
const toList = (data) =>
    Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
            ? data.content
            : [];

/** 재료 포함 전체 레시피 목록 */
export const fetchAllRecipes = async ({ sort = "popular" } = {}) => {
    try {
        const { data } = await http.get("/api/recipes/all", {
            params: { sort },
        });
        return toList(data);
    } catch (e) {
        console.error("레시피 가져오기 실패:", e);
        return [];
    }
};

export const fetchFridgeIngredients = async (userId) => {
    try {
        const { data } = await http.get(`/fridge/user/${userId}`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("❌ 냉장고 데이터 불러오기 실패", error);
        return [];
    }
};

export const fetchFilteredRecipes = async (minCount) => {
    try {
        const userId = localStorage.getItem("userId");
        const { data } = await http.get(`/api/recipes/filter`, {
            params: { userId, minCount },
        });
        return toList(data);
    } catch (e) {
        console.error("필터 레시피 실패:", e);
        return [];
    }
};
