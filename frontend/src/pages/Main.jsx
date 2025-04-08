import React from 'react';
import './Main.css';
import Header from '../components/Header';
import InfoCard from '../components/InfoCard';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';
import useScrollFadeIn from "../hooks/useScrollFadeIn.js";

function Main() {
    const feadIn1=useScrollFadeIn('up',0.8);
    const feadIn2=useScrollFadeIn('up',0.8);
    const feadIn3=useScrollFadeIn('up',0.8);

    return (
        <div className="main-container">
            <div className="content-wrapper">
                <Header />
                <section className="main-carousel">
                    {/* 슬라이드 */}
                    <Carousel />
                </section>



                {/* 소개 카드 */}
                <section className="info-section">
                    <div {...feadIn1} >
                        <InfoCard text={"Easy food\nmanagement"} imgSrc="/sample4.jpg" />
                    </div>
                    <div {...feadIn2} >
                        <InfoCard text={"Recommended\ncooking service"} imgSrc="/sample5.jpg" reverse />
                    </div>
                    <div {...feadIn3} >
                        <InfoCard text={"Sharing various\ninformation"} imgSrc="/sample6.jpg" />
                    </div>


                </section>

                <Footer />
            </div>
        </div>
    );
}

export default Main;
