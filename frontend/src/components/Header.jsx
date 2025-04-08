import React from 'react';
import './Header.css';
import { Link } from 'react-router-dom';

function Header() {
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
                        <Link to="/login">로그인</Link>
                        <span>|</span>
                        <Link to="/signup">회원가입</Link>
                    </div>
                </nav>
                <div className="nav-divider"></div>
            </div>
        </header>
    );
}

export default Header;
