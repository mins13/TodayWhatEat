// src/api/memoApi.js
import { authHttp as http } from "./http";

/** 현재 로그인한 사용자 메모 가져오기 */
export async function getUserMemo() {
    const { data } = await http.get("/api/memo");
    return data;
}

/** 현재 로그인한 사용자 메모 저장(덮어쓰기) */
export async function saveUserMemo(content) {
    const { data } = await http.put("/api/memo", { content });
    return data;
}
