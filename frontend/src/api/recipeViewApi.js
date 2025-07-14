import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/recipes";

export const fetchAllRecipes = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    } catch (error) {
        console.error("레시피 가져오기 실패:", error);
        return [];
    }
};

export const fetchFridgeIngredients = async (userId) => {
    try {
        const response = await axios.get(`http://localhost:8080/fridge/user/${userId}`);
        console.log("✅ 냉장고 응답:", response.data);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("❌ 냉장고 데이터 불러오기 실패", error);
        return [];
    }
};

export const fetchFilteredRecipes = async (minCount) => {
    const userId = localStorage.getItem("userId");
    const response = await axios.get(`${API_BASE_URL}/filter`, {
        params: {
            userId,
            minCount
        }
    });
    return response.data;
};

