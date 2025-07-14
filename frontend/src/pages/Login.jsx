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
            const response = await loginUser(form);

            localStorage.setItem("token", response.token);
            localStorage.setItem("nickname", response.nickname);
            localStorage.setItem("userId", response.username);
            console.log("✅ 유저아이디:", response.username); // 이게 null로 뜨는지 확인
            localStorage.setItem("userId", response.username);
            setIsLoggedIn(true);
            navigate("/");
        } catch (error) {
            console.error("로그인 실패:", error);
            setError("아이디 또는 비밀번호가 틀렸습니다."); // 🔴 에러 표시
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
