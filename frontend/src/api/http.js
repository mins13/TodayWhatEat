// src/api/http.js
import axios from "axios";

export const http = axios.create({
    baseURL: "http://localhost:8080", // 배포 시 실제 주소로
    withCredentials: true,            // ✅ refreshToken 쿠키 보내려면 true
});

/** 요청 인터셉터: accessToken 헤더에 붙이기 */
http.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
    }
    return config;
});

/** 응답 인터셉터: 401 → /users/refresh 한 번만 시도 */
let isRefreshing = false;

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const { response } = error;

        // 네트워크 에러 등
        if (!response) {
            return Promise.reject(error);
        }

        // 401 아니면 그냥 통과
        if (response.status !== 401) {
            return Promise.reject(error);
        }

        // 🔥 새 탭/새 세션이면 자동 재발급 안 함
        const isLoggedIn = sessionStorage.getItem("isLoggedIn");
        if (!isLoggedIn) {
            return Promise.reject(error);
        }

        // 이미 이 요청에서 한 번 재시도했다면 더 안 함
        if (originalRequest._retry) {
            sessionStorage.clear();
            window.location.href = "/login";
            return Promise.reject(error);
        }

        // 이미 다른 요청이 refresh 중이면 기다렸다가 다시 시도
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                const check = setInterval(() => {
                    const newToken = sessionStorage.getItem("accessToken");
                    if (!isRefreshing) {
                        clearInterval(check);
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            originalRequest._retry = true;
                            resolve(http(originalRequest));
                        } else {
                            reject(error);
                        }
                    }
                }, 200);
            });
        }

        // 여기서 실제 /refresh 호출
        isRefreshing = true;
        try {
            const res = await http.post("/api/users/refresh");
            const newAccessToken = res.data.accessToken;

            sessionStorage.setItem("accessToken", newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            originalRequest._retry = true;

            return http(originalRequest);
        } catch (e) {
            // refresh 실패 → 완전 로그아웃
            sessionStorage.clear();
            window.location.href = "/login";
            return Promise.reject(e);
        } finally {
            isRefreshing = false;
        }
    }
);
