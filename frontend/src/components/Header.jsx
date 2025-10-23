import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

function Header({ isLoggedIn, setIsLoggedIn }) {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState('');
    const [role, setRole] = useState('');

    useEffect(() => {
        const storedNickname = localStorage.getItem('nickname') || '';
         const storedRole = localStorage.getItem('role') || '';
         setNickname(storedNickname);
         setRole(storedRole);
        }, [isLoggedIn]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("nickname");
        localStorage.removeItem("role");
        setIsLoggedIn(false);
        alert("로그아웃 되었습니다!");
        navigate("/");
    };

    return (
        <header className="header-container">
            <div className="top-utility">
                {isLoggedIn && role === 'ADMIN' && (
                    <Link to="/admin" className="admin-pill">관리자 페이지</Link>
                )}
            </div>
            <Link to="/" className="logo">오늘 뭐 먹지?</Link>

            <div className="nav-wrapper">

                {/* 상단 가느다란 구분선 */}
                <div className="nav-divider-up" />

                {/* 메인 내비게이션 */}
                <nav className="nav-bar">
                    <div className="nav-menu-center">
                        <Link to="/calendar">calendar</Link>
                        <Link to="/recipe">recipe</Link>
                        <Link to="/community">community</Link>
                    </div>

                    {/* 로그인/로그아웃, 인사말 */}
                    <div className="auth-links">
                        {isLoggedIn ? (
                            <>
      <span className="welcome-text">
        <Link to="/account" className="nav-link underline">{nickname}님 안녕하세요!</Link>
      </span>
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

                {/* 하단 가느다란 구분선 */}
                <div className="nav-divider" />
            </div>
        </header>
    );
}

export default Header;
