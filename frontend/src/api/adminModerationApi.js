import { http } from "./http";

export const fetchAdminPostDetail = async (postId) =>
    (await http.get(`/api/admin/posts/${postId}`)).data;

export const fetchAdminPostComments = async (postId, { page=1, size=50 } = {}) =>
    (await http.get(`/api/admin/posts/${postId}/comments`, { params: { page, size } })).data;

export const deleteAdminComment = async (postId, commentId) =>
    (await http.delete(`/api/admin/posts/${postId}/comments/${commentId}`)).data;