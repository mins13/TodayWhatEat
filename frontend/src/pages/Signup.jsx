import React from 'react';
import './Signup.css';


function Signup() {
    return (
        <div className="main-container">
            <div className="content-wrapper">

            <div className="signup-container">
                <div className="signup-box">
                    <h2>회원가입</h2>
                    <input type="email" placeholder="이메일" />
                    <input type="text" placeholder="아이디" />
                    <input type="text" placeholder="닉네임" />
                    <input type="password" placeholder="비밀번호" />
                    <input type="password" placeholder="비밀번호 확인" />
                    <button className="signup-btn">회원가입</button>
                </div>
            </div>

        </div>
        </div>
    );
}

export default Signup;
