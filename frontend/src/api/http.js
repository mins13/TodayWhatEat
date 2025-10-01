// src/api/http.js
import axios from "axios";

export const http = axios.create({
    baseURL: "http://localhost:8080", // 프록시 안 쓰면 이대로
    withCredentials: false,           // JWT는 헤더로만
});
http.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (!config.headers["Content-Type"]) config.headers["Content-Type"] = "application/json";
    return config;
});
