// src/api/memoApi.js
import { http } from "./http";

/** 현재 로그인한 사용자 메모 가져오기 */
export async function getUserMemo() {
    const { data } = await http.get("/api/memo");
    // 서버에서 { content, updatedAt } 형태로 온다고 가정
    return data;
}

/** 현재 로그인한 사용자 메모 저장(덮어쓰기) */
export async function saveUserMemo(content) {
    const { data } = await http.put("/api/memo", { content });
    return data;
}
