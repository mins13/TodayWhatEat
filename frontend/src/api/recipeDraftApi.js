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
// ✅ 추가: 단건 조회
export async function getDraft(id){
    return (await axios.get(`/api/drafts/${id}`, { headers: auth() })).data;
}
export async function uploadDraftImage(file){
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axios.post("/api/drafts/upload", fd, {
        headers: { ...auth(), "Content-Type": "multipart/form-data" },
    });
    // 서버가 {url:"..."} 또는 문자열을 리턴한다고 가정
    return typeof data === "string" ? data : data?.url;
}
