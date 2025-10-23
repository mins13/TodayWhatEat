// src/api/userApi.js
import { http } from "./http";

const BASE = "/api/users";

// 회원가입
export const registerUser = async (userData) => {
    const { data } = await http.post(`${BASE}/register`, userData);
    return data;
};

// 로그인
export const loginUser = async (loginData) => {
    const { data } = await http.post(`${BASE}/login`, loginData);
    return data;
};

// 내 정보 조회
export const fetchMe = async () => {
    const { data } = await http.get(`${BASE}/me`);
    // 기대 응답: { id, email, username, nickname }
    return data;
};

// 닉네임 변경
export const updateNickname = async (nickname) => {
    const { data } = await http.put(`${BASE}/me`, { nickname });
    return data; // { id, email, username, nickname }
};

// 비밀번호 변경 (현재 비번 확인 + 새 비번)
export const changePassword = async (currentPassword, newPassword) => {
    const { data } = await http.put(`${BASE}/me/password`, {
        currentPassword,
        newPassword,
    });
    return data; // { ok: true }
};

// 탈퇴
export const deleteAccount = async () => {
    const { data } = await http.delete(`${BASE}/me`);
    return data; // { ok: true }
};
