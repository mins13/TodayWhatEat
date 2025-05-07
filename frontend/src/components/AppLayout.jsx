import React from 'react';
import Header from './Header';
import Footer from './Footer';

const AppLayout = ({ children }) => {
    return (
        <div className="app-layout">
            <div className= "content-wrapper">
            <Header />
            </div>
            <main className="main-container">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default AppLayout;
