import { http } from "./http";

// 목록
export async function fetchPosts(board, { query="", sort="latest", page=1, size=10 }) {
    const { data } = await http.get(`/api/community/${board}`, { params: { query, sort, page, size }});
    return data;
}

// 상세 (조회수 +1 반영)
export async function fetchPostDetail(board, id) {
    const { data } = await http.get(`/api/community/${board}/${id}`);
    return data;
}

// 작성
export async function createPost(board, { title, content, authorName }) {
    const { data } = await http.post(`/api/community/${board}`, { title, content, authorName });
    return data;
}

// ✅ 좋아요 토글: 백엔드 경로가 "/like"인지 "/likes"인지 확인 후 일치시켜!
//    지금은 "/like"로 호출 중이니, 컨트롤러도 "/like"여야 함.
export async function togglePostLike(board, id) {
    const { data } = await http.post(`/api/community/${board}/${id}/like`);
    return data; // { liked: boolean, count? }
}

// 댓글 목록
export async function fetchComments(board, id, { page=1, size=20 } = {}) {
    const { data } = await http.get(`/api/community/${board}/${id}/comments`, { params: { page, size }});
    return Array.isArray(data) ? { items: data, total: data.length } : data;
}

// 댓글 작성 (DTO가 content+authorName 이므로 그대로 보냄)
export async function addComment(board, id, { content, authorName }) {
    const { data } = await http.post(`/api/community/${board}/${id}/comments`, { content, authorName });
    return data; // { id, content, authorName, ... }
}

export async function updateComment(board, id, commentId, { content }) {
    const { data } = await http.patch(`/api/community/${board}/${id}/comments/${commentId}`, { content });
    return data || {};
}
export async function deleteComment(board, id, commentId) {
    await http.delete(`/api/community/${board}/${id}/comments/${commentId}`);
}
