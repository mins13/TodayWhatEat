import React from 'react';
import './Main.css';
import Header from '../components/Header';
import InfoCard from '../components/InfoCard';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';

function Main() {
    return (
        <div className="main-container">
            {/* 이 div가 진짜 중요! → 가운데 정렬용 */}
            <div className="content-wrapper">
                <Header />

                {/* 슬라이드 */}
                <Carousel />

                {/* 소개 카드 */}
                <section className="info-section">
                    <InfoCard text={"Easy food\nmanagement"} imgSrc="/sample4.jpg" />
                    <InfoCard text={"Recommended\ncooking service"} imgSrc="/sample5.jpg" reverse />
                    <InfoCard text={"Sharing various\ninformation"} imgSrc="/sample6.jpg" />
                </section>

                <Footer />
            </div>
        </div>
    );
}

export default Main;
