// src/api/adminRecipeMgmtApi.js
import { authHttp as http } from "./http";

export async function fetchAdminRecipes({ page = 0, size = 10, query = "" }) {
    return (
        await http.get(`/api/admin/recipes`, { params: { page, size, query } })
    ).data;
}
export async function fetchRecipeDetail(id) {
    return (await http.get(`/api/recipes/${id}`)).data;
}
export async function createRecipe(payload) {
    return (await http.post(`/api/admin/recipes`, payload)).data;
}
export async function updateRecipe(id, payload) {
    return (await http.put(`/api/admin/recipes/${id}`, payload)).data;
}
export async function deleteRecipe(id) {
    return (await http.delete(`/api/admin/recipes/${id}`)).data;
}
export async function fetchIngredients(recipeId) {
    return (await http.get(`/api/admin/recipes/${recipeId}/ingredients`)).data;
}
export async function saveIngredients(recipeId, items) {
    return (
        await http.put(`/api/admin/recipes/${recipeId}/ingredients`, items)
    ).data;
}
export async function fetchTags(recipeId) {
    return (await http.get(`/api/admin/recipes/${recipeId}/tags`)).data;
}
export async function saveTags(recipeId, tags) {
    return (await http.put(`/api/admin/recipes/${recipeId}/tags`, tags)).data;
}
