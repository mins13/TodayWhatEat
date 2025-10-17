import { http } from "./http";

export async function fetchMyRecipes(page=0, size=10){
    return (await http.get(`/api/my-recipes`, { params: { page, size } })).data;
}
export async function getMyRecipe(id){
    return (await http.get(`/api/my-recipes/${id}`)).data;
}
export async function createMyRecipe(payload){
    return (await http.post(`/api/my-recipes`, payload)).data;
}
export async function updateMyRecipe(id, payload){
    return (await http.put(`/api/my-recipes/${id}`, payload)).data;
}
export async function deleteMyRecipe(id){
    return (await http.delete(`/api/my-recipes/${id}`)).data;
}

export async function requestMyRecipeApproval(id) {
    // 엔드포인트는 서버에 맞게 변경하세요.
    // 예시: POST /api/my-recipes/{id}/approval
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8080/api/my-recipes/${id}/approval`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
    });
    if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(err || "승인 신청 실패");
    }
    // 바디 없을 수도 있으므로 방어
    try { return await res.json(); } catch { return {}; }
}