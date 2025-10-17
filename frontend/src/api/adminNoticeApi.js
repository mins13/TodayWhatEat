import { http } from "./http";

export async function fetchNotices({ page = 0, size = 10, query = "" }) {
    return (await http.get(`/api/admin/notices`, { params: { page, size, query } })).data;
}

export async function fetchNoticeDetail(id) {
    return (await http.get(`/api/admin/notices/${id}`)).data;
}

export async function createNotice(payload) {
    // payload: { title, content, pinned }
    return (await http.post(`/api/admin/notices`, payload)).data;
}

export async function updateNotice(id, payload) {
    // payload: { title, content, pinned }
    return (await http.put(`/api/admin/notices/${id}`, payload)).data;
}

export async function deleteNotice(id) {
    return (await http.delete(`/api/admin/notices/${id}`)).data;
}
