// src/api/http.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/** 1) 공개용 클라이언트 (쿠키 X, 토큰 X) */
export const openHttp = axios.create({
    baseURL,
    withCredentials: false,   // ❌ 쿠키 안 보냄
});

/** 2) 인증이 필요한 요청용 클라이언트 (쿠키 O, 토큰 O) */
export const authHttp = axios.create({
    baseURL,
    withCredentials: true,    // ✅ refreshToken 쿠키 보내려면 true
});

/** 👉 옛 코드 호환용: http = authHttp */
export const http = authHttp;

/** --- authHttp 에만 인터셉터 달기 --- */

// 요청 인터셉터: accessToken 헤더에 붙이기
authHttp.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const isFormData = config.data instanceof FormData;
    if (!isFormData && !config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
    }

    return config;
});

// 응답 인터셉터: 401 → /users/refresh 한 번만 시도
let isRefreshing = false;

authHttp.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const { response } = error;

        if (!response) return Promise.reject(error);
        if (response.status !== 401) return Promise.reject(error);

        const isLoggedIn = sessionStorage.getItem("isLoggedIn");
        if (!isLoggedIn) return Promise.reject(error);

        if (originalRequest._retry) {
            sessionStorage.clear();
            window.location.href = "/login";
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                const check = setInterval(() => {
                    const newToken = sessionStorage.getItem("accessToken");
                    if (!isRefreshing) {
                        clearInterval(check);
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            originalRequest._retry = true;
                            resolve(authHttp(originalRequest));
                        } else {
                            reject(error);
                        }
                    }
                }, 200);
            });
        }

        isRefreshing = true;
        try {
            const res = await authHttp.post("/api/users/refresh");
            const newAccessToken = res.data.accessToken;

            sessionStorage.setItem("accessToken", newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            originalRequest._retry = true;

            return authHttp(originalRequest);
        } catch (e) {
            sessionStorage.clear();
            window.location.href = "/login";
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);
