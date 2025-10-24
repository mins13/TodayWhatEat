// src/api/communityApi.js
import { http } from "./http";


/* ---------------------------
   게시글 목록 (비인증)
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
   ✅ 인증 헤더 → mine/liked 판단 가능
----------------------------*/
export async function fetchPostDetail(board, id) {
    const { data } = await http.get(`/api/community/${board}/${id}`, {
        headers: { ...authHeaders() },
    });
    return data;
}

/* ---------------------------
   게시글 작성 (JSON, 기존 방식 유지)
   ✅ 인증 필요
----------------------------*/
export async function createPost(board, { title, content, authorName }) {
    const { data } = await http.post(
        `/api/community/${board}`,
        { title, content, authorName },
        { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );
    return data; // { id }
}

/* ---------------------------
   게시글 작성 (Multipart, 새로 추가)
   - 이미지 여러 장(files[])
   - 나만의 레시피 첨부(recipeId)
   ✅ 인증 필요
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

    const { data } = await http.post(`/api/community/${board}`, fd, {
        headers: { ...authHeaders() },
    });
    return data; // { id }
}

/* ---------------------------
   좋아요 토글  ✅ 인증 필요
----------------------------*/
export async function togglePostLike(board, id) {
    const { data } = await http.post(
        `/api/community/${board}/${id}/like`,
        {},
        { headers: { ...authHeaders() } }
    );
    return data; // { liked, count }
}

/* ---------------------------
   댓글 목록 (비인증)
----------------------------*/
export async function fetchComments(board, id, { page = 1, size = 20 } = {}) {
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
        { content, authorName },
        { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );
    return data; // { id }
}

/* ---------------------------
   댓글 수정  ✅ 인증 필요
----------------------------*/
export async function updateComment(board, id, commentId, { content }) {
    const { data } = await http.patch(
        `/api/community/${board}/${id}/comments/${commentId}`,
        { content },
        { headers: { "Content-Type": "application/json", ...authHeaders() } }
    );
    return data || {};
}

/* ---------------------------
   댓글 삭제  ✅ 인증 필요
----------------------------*/
export async function deleteComment(board, id, commentId) {
    await http.delete(`/api/community/${board}/${id}/comments/${commentId}`, {
        headers: { ...authHeaders() },
    });
}

/* ---------------------------
   게시글 수정  ✅ 인증 필요
----------------------------*/
export async function updatePost(board, id, dto) {
    const { data } = await http.put(`/api/community/${board}/${id}`, dto, {
        headers: { "Content-Type": "application/json", ...authHeaders() },
    });
    return data;
}

/* ---------------------------
   게시글 삭제  ✅ 인증 필요
----------------------------*/
export async function deletePost(board, id) {
    const { data } = await http.delete(`/api/community/${board}/${id}`, {
        headers: { ...authHeaders() },
    });
    return data; // { ok: true } or void
}

/* ---------------------------
   [NEW] 나만의 레시피 요약 목록 (작성 시 모달용)
   - 예상 응답: [{ id, title, mainImageUrl, likeCount, viewCount }, ...]
   ✅ 인증 필요
----------------------------*/


// 1) 여러 키에서 토큰을 시도해서 읽는다
function readToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("Authorization") ||
        ""
    );
}

// 2) 'Bearer ' 유무 상관없이 Authorization 헤더로 세팅
function authHeaders() {
    const raw = readToken();
    if (!raw) return {};
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    return { Authorization: `Bearer ${token}` };
}

// [디버깅용] 실제 붙는 헤더 한번만 로그
let _logged = false;
function logAuthOnce() {
    if (_logged) return;
    const h = authHeaders();
    console.log("[authHeaders]", h);
    _logged = true;
}

// ─ fetchMyRecipeSummaries에 로그 한번 찍기
export async function fetchMyRecipeSummaries() {
    logAuthOnce();
    const { data } = await http.get(`/api/my/recipes/summaries`, {
        headers: { ...authHeaders() },
    });
    return data;
}