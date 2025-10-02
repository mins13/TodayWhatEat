import axios from "axios";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export async function fetchPendingDrafts(page=0,size=20){
    return (await axios.get(`/api/admin/recipe-drafts/pending?page=${page}&size=${size}`, { headers: auth() })).data;
}
export async function approveDraft(id){
    return (await axios.post(`/api/admin/recipe-drafts/${id}/approve`, null, { headers: auth() })).data;
}
export async function rejectDraft(id, reason){
    return (await axios.post(`/api/admin/recipe-drafts/${id}/reject`, { reason }, { headers: auth() })).data;
}