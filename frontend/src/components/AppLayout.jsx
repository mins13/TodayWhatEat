// src/components/AppLayout.jsx
import React from 'react';
import Header from './Header';
import Footer from './Footer';

const AppLayout = ({ children, isLoggedIn, setIsLoggedIn }) => {
    return (
        <div className="app-layout">
            <div className="content-wrapper">
                <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
                <main className="main-container">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default AppLayout;
