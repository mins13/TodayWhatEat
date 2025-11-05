// src/api/adminNoticeApi.js
import { http } from "./http";

// 👉 여기 signal 옵션만 추가
export async function fetchNotices({ page = 0, size = 10, query = "", signal } = {}) {
    return (
        await http.get(`/api/admin/notices`, {
            params: { page, size, query },
            signal,   // <-- AbortController용
        })
    ).data;
}

// 👉 여기도 signal 옵션 추가
export async function fetchNoticeDetail(id, { signal } = {}) {
    return (await http.get(`/api/admin/notices/${id}`, { signal })).data;
}

/**
 * payload:
 *  - JSON 작성/수정: { title, content, pinned }
 *  - 파일 첨부 작성/수정: FormData (title, content, pinned, files...)
 */
function buildConfig(payload) {
    // FormData면 Content-Type은 건드리지 않는다
    if (payload instanceof FormData) {
        return {
            headers: {
                // 인터셉터에서 보고 "아 이건 내가 건드리지 말아야겠다" 판단용
                "X-IS-FORM-DATA": "true",
            },
        };
    }
    // 기본(JSON) 요청
    return {};
}

export async function createNotice(payload) {
    const config = buildConfig(payload);
    return (await http.post(`/api/admin/notices`, payload, config)).data;
}

export async function updateNotice(id, payload) {
    const config = buildConfig(payload);
    return (await http.put(`/api/admin/notices/${id}`, payload, config)).data;
}

export async function deleteNotice(id) {
    return (await http.delete(`/api/admin/notices/${id}`)).data;
}
export async function deleteNoticeAttachment(postId, fileId) {
    return (
        await http.delete(`/api/admin/notices/${postId}/attachments/${fileId}`)
    ).data;
}