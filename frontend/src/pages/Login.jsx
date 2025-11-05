import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/userApi";

function Login({ setIsLoggedIn }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState(""); // 🔴 에러 메시지 상태

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(""); // 입력 중이면 에러 초기화
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const res = await loginUser(form);
            // loginUser 가 반환하는 body
            // { accessToken, nickname, username, role, userId(=PK) }

            const accessToken = res.accessToken;
            const nickname    = res.nickname;
            const username    = res.username;
            const role        = res.role;

            // ===============================
            // ① 예전 코드 호환용 (localStorage)
            // ===============================
            // 옛날에는 token 이라는 이름을 많이 썼으니까 그대로 맞춰 줘
            localStorage.setItem("token", accessToken);
            localStorage.setItem("accessToken", accessToken);

            // header, 캘린더 등에서 쓰는 값들
            localStorage.setItem("nickname", nickname);
            localStorage.setItem("username", username);
            localStorage.setItem("userId", username);   // ❗ 기존 요구사항 유지: userId = username
            localStorage.setItem("role", role);

            // ===============================
            // ② 새 로직용 (sessionStorage)
            // ===============================
            sessionStorage.setItem("accessToken", accessToken);
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("nickname", nickname);
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("userId", username); // 여기서도 동일하게
            sessionStorage.setItem("role", role);

            setIsLoggedIn(true);
            navigate("/");
        } catch (error) {
            console.error("로그인 실패:", error);
            setError("아이디 또는 비밀번호가 틀렸습니다.");
        }
    };


    const handleSignup = () => {
        navigate("/signup");
    };

    return (
        <div className="main-container">
            <div className="content-wrapper">
                <div className="login-container">
                    <div className="login-box">
                        <h2>로그인</h2>
                        <form onSubmit={handleLogin}>
                            <input
                                name="username"
                                type="text"
                                placeholder="아이디"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />
                            <input
                                name="password"
                                type="password"
                                placeholder="비밀번호"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />

                            {/* 🔴 에러 메시지 출력 */}
                            {error && <p className="login-error">{error}</p>}

                            <button type="submit" className="login-btn">로그인</button>
                            <button type="button" className="signup-btn" onClick={handleSignup}>회원가입</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
