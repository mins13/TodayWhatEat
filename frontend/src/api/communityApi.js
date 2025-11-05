// src/api/communityApi.js
import { authHttp as http } from "./http";

/* ---------------------------
   게시글 목록 (비인증 가능)
----------------------------*/
export async function fetchPosts(
    board,
    { query = "", sort = "latest", page = 1, size = 10 }
) {
    const { data } = await http.get(`/api/community/${board}`, {
        params: { query, sort, page, size },
    });
    return data;
}

/* ---------------------------
   게시글 상세 (조회수 +1)
----------------------------*/
export async function fetchPostDetail(board, id) {
    const { data } = await http.get(`/api/community/${board}/${id}`);
    return data;
}

/* ---------------------------
   게시글 작성 (JSON)
   ✅ 인증 필요
----------------------------*/
export async function createPost(board, { title, content, authorName }) {
    const { data } = await http.post(`/api/community/${board}`, {
        title,
        content,
        authorName,
    });
    return data; // { id }
}

/* ---------------------------
   게시글 작성 (Multipart)
----------------------------*/
export async function createPostMultipart(
    board,
    { title, content, authorName, files = [], recipeId = null }
) {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    if (authorName) fd.append("authorName", authorName);
    if (recipeId != null) fd.append("recipeId", String(recipeId));
    (files || []).forEach((f) => fd.append("files", f));

    const { data } = await http.post(`/api/community/${board}`, fd);
    return data; // { id }
}

/* ---------------------------
   좋아요 토글  ✅ 인증 필요
----------------------------*/
export async function togglePostLike(board, id) {
    const { data } = await http.post(`/api/community/${board}/${id}/like`, {});
    return data; // { liked, count }
}

/* ---------------------------
   댓글 목록 (비인증 가능)
----------------------------*/
export async function fetchComments(
    board,
    id,
    { page = 1, size = 20 } = {}
) {
    const { data } = await http.get(`/api/community/${board}/${id}/comments`, {
        params: { page, size },
    });
    return Array.isArray(data) ? { items: data, total: data.length } : data;
}

/* ---------------------------
   댓글 작성  ✅ 인증 필요
----------------------------*/
export async function addComment(board, id, { content, authorName }) {
    const { data } = await http.post(
        `/api/community/${board}/${id}/comments`,
        { content, authorName }
    );
    return data; // { id }
}

/* ---------------------------
   댓글 수정  ✅ 인증 필요
----------------------------*/
export async function updateComment(
    board,
    id,
    commentId,
    { content }
) {
    const { data } = await http.patch(
        `/api/community/${board}/${id}/comments/${commentId}`,
        { content }
    );
    return data || {};
}

/* ---------------------------
   댓글 삭제  ✅ 인증 필요
----------------------------*/
export async function deleteComment(board, id, commentId) {
    await http.delete(`/api/community/${board}/${id}/comments/${commentId}`);
}

/* ---------------------------
   게시글 수정  ✅ 인증 필요
----------------------------*/
export async function updatePost(board, id, dto) {
    const { data } = await http.put(`/api/community/${board}/${id}`, dto);
    return data;
}

/* ---------------------------
   게시글 삭제  ✅ 인증 필요
----------------------------*/
export async function deletePost(board, id) {
    const { data } = await http.delete(`/api/community/${board}/${id}`);
    return data;
}

/* ---------------------------
   나만의 레시피 요약 목록 (작성 시 모달용)
----------------------------*/
export async function fetchMyRecipeSummaries() {
    const { data } = await http.get(`/api/my/recipes/summaries`);
    return data;
}
