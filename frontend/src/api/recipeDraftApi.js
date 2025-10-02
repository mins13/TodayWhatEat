// src/api/recipeDraftApi.js
import axios from "axios";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export async function createDraft(payload){
    return (await axios.post("/api/drafts", payload, { headers: auth() })).data;
}
export async function updateDraft(id, payload){
    return (await axios.put(`/api/drafts/${id}`, payload, { headers: auth() })).data;
}
export async function submitDraft(id){
    return (await axios.post(`/api/drafts/${id}/submit`, null, { headers: auth() })).data;
}
export async function fetchMyDrafts(page=0,size=10){
    return (await axios.get(`/api/drafts/my?page=${page}&size=${size}`, { headers: auth() })).data;
}
