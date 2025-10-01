import { http } from "./http"; // ✅ 방금 만든 인스턴스

export async function fetchPosts(board, { query="", sort="latest", page=1, size=10 }) {
    const { data } = await http.get(`/api/community/${board}`, { params: { query, sort, page, size }});
    return data; // { items, total }
}

export async function fetchPostDetail(board, id) {
    const { data } = await http.get(`/api/community/${board}/${id}`);
    return data; // PostDetailDto (조회수 +1 반영)
}

export async function createPost(board, { title, content, authorName }) {
    const { data } = await http.post(`/api/community/${board}`, { title, content, authorName });
    return data; // { id }
}

export async function togglePostLike(board, id) {
    const { data } = await http.post(`/api/community/${board}/${id}/like`);
    return data; // { liked: boolean }
}

export async function fetchComments(board, id, { page=1, size=20 } = {}) {
    const { data } = await http.get(`/api/community/${board}/${id}/comments`, { params: { page, size }});
    return data; // { items, total }
}

export async function addComment(board, id, { content, authorName }) {
    const { data } = await http.post(`/api/community/${board}/${id}/comments`, { content, authorName });
    return data; // { id }
}
