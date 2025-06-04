// src/api/userApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/users";

// 회원가입 요청
export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/register`, userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// 로그인 요청
export const loginUser = async (loginData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, loginData);
        return response.data;
    } catch (error) {
        throw error.response.data || error;
    }
};
