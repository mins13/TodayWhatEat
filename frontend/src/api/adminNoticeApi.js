// src/api/adminNoticeApi.js
import axios from "axios";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export async function fetchNotices({page=0,size=10,query=""}){
    const { data } = await axios.get(`/api/admin/notices`, { params:{page,size,query}, headers: auth() });
    return data; // Page<NoticeDto>
}
export async function createNotice(payload){
    const { data } = await axios.post(`/api/admin/notices`, payload, { headers: auth() });
    return data;
}
export async function updateNotice(id, payload){
    const { data } = await axios.put(`/api/admin/notices/${id}`, payload, { headers: auth() });
    return data;
}
export async function deleteNotice(id){
    await axios.delete(`/api/admin/notices/${id}`, { headers: auth() });
}
