// src/api/recipeViewApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/recipes";

// Page든 배열이든 → 항상 배열로
const toList = (data) =>
    Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);

export const fetchAllRecipes = async ({ sort = "popular" } = {}) => {
    try {
        // 재료까지 포함된 전체 목록 엔드포인트
        const { data } = await axios.get(`${API_BASE_URL}/all`, { params: { sort } });
        return toList(data);
    } catch (e) {
        console.error("레시피 가져오기 실패:", e);
        return [];
    }
};

export const fetchFridgeIngredients = async (userId) => {
    try {
        const { data } = await axios.get(`http://localhost:8080/fridge/user/${userId}`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("❌ 냉장고 데이터 불러오기 실패", error);
        return [];
    }
};

export const fetchFilteredRecipes = async (minCount) => {
    try {
        const userId = localStorage.getItem("userId");
        const { data } = await axios.get(`${API_BASE_URL}/filter`, {
            params: { userId, minCount },
        });
        // 이 API가 배열을 내려주더라도 toList로 방어 (혹시 Page로 바뀌어도 안전)
        return toList(data);
    } catch (e) {
        console.error("필터 레시피 실패:", e);
        return [];
    }
};
