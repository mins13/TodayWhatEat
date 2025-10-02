// src/api/adminRecipeMgmtApi.js
import axios from "axios";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

// 목록 & 검색
export async function fetchAdminRecipes({page=0,size=10,query=""}) {
    const { data } = await axios.get(`/api/admin/recipes`, {
        params: { page, size, query },
        headers: auth()
    });
    return data; // Page<RecipeLiteDto>
}

// 단건 조회
export async function fetchRecipeDetail(id){
    const { data } = await axios.get(`/api/admin/recipes/${id}`, { headers: auth() });
    return data;
}

// 생성/수정/삭제
export async function createRecipe(payload){
    const { data } = await axios.post(`/api/admin/recipes`, payload, { headers: auth() });
    return data;
}
export async function updateRecipe(id, payload){
    const { data } = await axios.put(`/api/admin/recipes/${id}`, payload, { headers: auth() });
    return data;
}
export async function deleteRecipe(id){
    await axios.delete(`/api/admin/recipes/${id}`, { headers: auth() });
}

// 재료 전체 조회/저장
export async function fetchIngredients(recipeId){
    const { data } = await axios.get(`/api/admin/recipes/${recipeId}/ingredients`, { headers: auth() });
    return data; // [{id,name,quantity,unit,sortOrder}]
}
export async function saveIngredients(recipeId, items){
    const { data } = await axios.put(`/api/admin/recipes/${recipeId}/ingredients`, items, { headers: auth() });
    return data;
}
