import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './Carousel.css';

function Carousel() {
    return (
        <div className="carousel-container">
            <Swiper
                modules={[Pagination, Autoplay]}
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000 }}
                loop={true}
                spaceBetween={30}
                slidesPerView={1}
            >
                <SwiperSlide>
                    <img src="/sample1.jpg" alt="슬라이드1" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="/sample2.jpg" alt="슬라이드2" />
                </SwiperSlide>
                <SwiperSlide>
                    <img src="/sample3.jpg" alt="슬라이드3" />
                </SwiperSlide>
            </Swiper>
        </div>
    );
}

export default Carousel;
