// recipeEngageApi.js
const BASE = "http://localhost:8080"; // 끝에 슬래시 X

function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// 공통 요청 헬퍼: 상태코드별 에러 메시지
async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, options);
    if (!res.ok) {
        // 401은 별도 분기(UX 위해)
        if (res.status === 401) {
            const msg = "로그인이 필요합니다.";
            throw Object.assign(new Error(msg), { status: 401 });
        }
        let detail;
        try { detail = await res.json(); } catch { /* ignore */ }
        const msg = detail?.message || `요청 실패 (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.detail = detail;
        throw err;
    }
    // 204 등도 있을 수 있으니 방어
    const text = await res.text();
    return text ? JSON.parse(text) : {};
}

/** 정렬 목록 (popular | view | default) */
export function fetchRecipesSorted(sort = "popular") {
    return request(`/api/recipes?sort=${encodeURIComponent(sort)}`, {
        headers: { ...authHeaders() },
    });
}

/** 좋아요 상태 조회 */
export function fetchLikeStatus(recipeId) {
    return request(`/api/recipes/${recipeId}/like/status`, {
        headers: { ...authHeaders() },
    }); // -> { liked, likes }
}

/** 좋아요 토글 */
export function toggleLike(recipeId) {
    return request(`/api/recipes/${recipeId}/like/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
    }); // -> { liked, likes }
}

/** 조회수 +1 : 프론트에서 1회성 판단 후 호출 */
export function addView(recipeId) {
    // (선택) 중복방지용 키를 서버에 주고 싶으면 X-View-Key 헤더 추가
    const viewKey = localStorage.getItem("vw-key") || crypto.randomUUID?.() || String(Date.now());
    localStorage.setItem("vw-key", viewKey);

    return request(`/api/recipes/${recipeId}/view`, {
        method: "POST",
        headers: { "X-View-Key": viewKey, ...authHeaders() },
    }); // -> { views }
}
