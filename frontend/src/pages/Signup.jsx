import React, { useState } from 'react';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/userApi';

function Signup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        username: '',
        nickname: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: ''
        }));
    };

    const handleRegister = async () => {
        const newErrors = {};

        if (!formData.email.trim()) newErrors.email = '이메일을 입력해주세요.';
        if (!formData.username.trim()) newErrors.username = '아이디를 입력해주세요.';
        if (!formData.nickname.trim()) newErrors.nickname = '닉네임을 입력해주세요.';
        if (!formData.password) newErrors.password = '비밀번호를 입력해주세요.';
        if (!formData.confirmPassword) newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // 🔥 userData를 여기서 정확히 정의해줘야 함!!
        const userData = {
            email: formData.email,
            username: formData.username,
            nickname: formData.nickname,
            password: formData.password
        };

        try {
            await registerUser(userData);
            alert("회원가입이 완료되었습니다!");
            navigate("/login");

        } catch (error) {
            console.error("❗ 전체 오류:", error);
            const errorData = error?.response?.data;

            // 🔍 에러가 객체인 경우 처리
            if (errorData && typeof errorData === 'object') {
                setErrors(errorData);
            } else {
                alert("알 수 없는 오류가 발생했습니다.");
            }
        }
    };

    return (
        <div className="main-container">
            <div className="content-wrapper">
                <div className="signup-container">
                    <div className="signup-box">
                        <h2>회원가입</h2>

                        <div className="input-group">
                            <input
                                type="email"
                                name="email"
                                placeholder="이메일"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {errors.email && <p className="signup-error">{errors.email}</p>}
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                name="username"
                                placeholder="아이디"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            {errors.username && <p className="signup-error">{errors.username}</p>}
                        </div>

                        <div className="input-group">
                            <input
                                type="text"
                                name="nickname"
                                placeholder="닉네임"
                                value={formData.nickname}
                                onChange={handleChange}
                            />
                            {errors.nickname && <p className="signup-error">{errors.nickname}</p>}
                        </div>

                        <div className="input-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="비밀번호"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {errors.password && <p className="signup-error">{errors.password}</p>}
                        </div>

                        <div className="input-group">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="비밀번호 확인"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            {errors.confirmPassword && <p className="signup-error">{errors.confirmPassword}</p>}
                        </div>

                        <button className="signup-btn" onClick={handleRegister}>
                            회원가입
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;
