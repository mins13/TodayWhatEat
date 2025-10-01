import axios from "axios";

export const http = axios.create({
    baseURL: "http://localhost:8080",
    withCredentials: true,
});

// 매 요청마다 로컬스토리지 토큰을 Bearer 로 붙임
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
