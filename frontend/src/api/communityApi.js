// src/api/communityApi.js
import { http } from "./http";

// 공통 Authorization 헤더
function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// 목록 (비인증)
export async function fetchPosts(board, { query = "", sort = "latest", page = 1, size = 10 }) {
    const { data } = await http.get(`/api/community/${board}`, {
        params: { query, sort, page, size },
    });
    return data;
}

// 상세 (조회수 +1)  ✅ 인증 헤더 추가 → mine/liked 계산됨
export async function fetchPostDetail(board, id) {
    const { data } = await http.get(`/api/community/${board}/${id}`, {
        headers: { ...authHeaders() },
    });
    return data;
}

// 작성  ✅ 인증 필요
export async function createPost(board, { title, content, authorName }) {
    const { data } = await http.post(
        `/api/community/${board}`,
        { title, content, authorName },
        { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );
    return data; // { id }
}

// 좋아요 토글  ✅ 인증 필요
export async function togglePostLike(board, id) {
    const { data } = await http.post(
        `/api/community/${board}/${id}/like`,
        {},
        { headers: { ...authHeaders() } }
    );
    return data; // { liked, count }
}

// 댓글 목록 (비인증)
export async function fetchComments(board, id, { page = 1, size = 20 } = {}) {
    const { data } = await http.get(`/api/community/${board}/${id}/comments`, {
        params: { page, size },
    });
    return Array.isArray(data) ? { items: data, total: data.length } : data;
}

// 댓글 작성  ✅ 인증 필요
export async function addComment(board, id, { content, authorName }) {
    const { data } = await http.post(
        `/api/community/${board}/${id}/comments`,
        { content, authorName },
        { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );
    return data; // { id }
}

// 댓글 수정  ✅ 인증 필요
export async function updateComment(board, id, commentId, { content }) {
    const { data } = await http.patch(
        `/api/community/${board}/${id}/comments/${commentId}`,
        { content },
        { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );
    return data || {};
}

// 댓글 삭제  ✅ 인증 필요
export async function deleteComment(board, id, commentId) {
    await http.delete(`/api/community/${board}/${id}/comments/${commentId}`, {
        headers: { ...authHeaders() },
    });
}

// 게시글 수정  ✅ 인증 필요
export async function updatePost(board, id, dto) {
    const { data } = await http.put(`/api/community/${board}/${id}`, dto, {
        headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    return data;
}

// 게시글 삭제  ✅ 인증 필요
export async function deletePost(board, id) {
    const { data } = await http.delete(`/api/community/${board}/${id}`, {
        headers: { ...authHeaders() },
    });
    return data; // { ok: true } or void
}
