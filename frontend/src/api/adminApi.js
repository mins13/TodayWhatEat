
import { authHttp as http } from "./http";

export const fetchAdminSummary = async () =>
    (await http.get("/api/admin/summary")).data;

export const fetchAdminUsers = async ({ page = 1, size = 10, q = "" } = {}) =>
    (await http.get("/api/admin/users", { params: { page, size, q } })).data;

export const setUserRole = async (id, role) =>
    (await http.patch(`/api/admin/users/${id}/role`, { role })).data;

export const setUserBanned = async (id, banned) =>
    (await http.patch(`/api/admin/users/${id}/ban`, { banned })).data;

export const fetchAdminPosts = async ({ page = 1, size = 10, q = "" } = {}) =>
    (await http.get("/api/admin/posts", { params: { page, size, q } })).data;

export const deleteAdminPost = async (id) =>
    (await http.delete(`/api/admin/posts/${id}`)).data;

/** 미니 대시보드 지표 */
export async function fetchAdminMini() {
    const res = await http.get("/api/admin/mini");
    return res.data;
}

/** 최근 공지 n개: [{id, title, createdAt}] */
export async function fetchRecentNotices(limit = 5) {
    const res = await http.get("/api/admin/notices/recent", { params: { limit } });
    return res.data;
}
