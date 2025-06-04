import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ isLoggedIn, setIsLoggedIn }) {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState('');

    useEffect(() => {
        if (isLoggedIn) {
            const storedNickname = localStorage.getItem('nickname');
            setNickname(storedNickname);
        }
    }, [isLoggedIn]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("nickname");
        setIsLoggedIn(false);
        alert("로그아웃 되었습니다!");
        navigate("/");
    };

    return (
        <header className="header-container">
            <Link to="/" className="logo">오늘 뭐 먹지?</Link>
            <div className="nav-wrapper">
                <div className="nav-divider-up"></div>
                <nav className="nav-bar">
                    <div className="nav-menu-center">
                        <Link to="/calendar">calendar</Link>
                        <Link to="/recipe">recipe</Link>
                        <Link to="/community">community</Link>
                    </div>

                    <div className="auth-links">
                        {isLoggedIn ? (
                            <>
                                <span className="welcome-text">{nickname}님 안녕하세요!</span>
                                <span className="nav-link" onClick={handleLogout}>로그아웃</span>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link">로그인</Link>
                                <span> | </span>
                                <Link to="/signup" className="nav-link">회원가입</Link>
                            </>
                        )}
                    </div>
                </nav>
                <div className="nav-divider"></div>
            </div>
        </header>
    );
}

export default Header;
