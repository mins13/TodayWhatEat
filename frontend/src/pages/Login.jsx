import React from 'react';
import './Login.css';
import { useNavigate } from "react-router-dom";


function Login() {
    const navigate = useNavigate();

    const handleSignup = () => {
        navigate("/signup");
    };
    return (
        <div className="main-container">
            <div className="content-wrapper">

            <div className="login-container">

                <div className="login-box">

                    <h2>로그인</h2>
                    <input type="text" placeholder="아이디를 입력해주세요" />
                    <input type="password" placeholder="비밀번호를 입력해주세요" />
                    <button className="login-btn">로그인</button>
                    <button className="signup-btn" onClick={handleSignup}>회원가입</button>
                </div>
            </div>

        </div>
        </div>
    );
}

export default Login;
