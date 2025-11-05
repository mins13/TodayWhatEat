// src/components/Carousel.jsx (경로는 프로젝트 구조에 맞게 조정)
// 인기 레시피 API는 src/api/homeApi.js 의 fetchRecipesSorted 사용

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "./Carousel.css";

import { fetchRecipesSorted } from "../api/homeApi"; // ✅ 경로 확인해서 맞게 수정!

function Carousel() {
    const navigate = useNavigate();

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    // 인기 레시피 상위 3개 로드
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                // homeApi.js 기준: sort, page, size
                const list = await fetchRecipesSorted("popular", 1, 3);

                if (!cancelled && Array.isArray(list)) {
                    // 혹시 더 많이 와도 3개로 제한
                    setRecipes(list.slice(0, 3));
                }
            } catch (e) {
                console.error("인기 레시피 불러오기 실패:", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // 동적으로 들어오는 레시피 → 슬라이드용 데이터로 변환
    const hasDynamic = recipes && recipes.length > 0;

    const dynamicSlides = hasDynamic
        ? recipes.map((r, idx) => ({
            id: `recipe-${r.id ?? idx}`, // 슬라이드 key 용
            realId: r.id,                // 실제 레시피 id (상세 페이지 이동용)
            title: r.name || "인기 레시피",
            imageUrl: r.thumbnailUrl || "/sample1.jpg",
        }))
        : [];

    // API 실패/데이터 없음 폴백
    const fallbackSlides = [
        { id: "sample-1", realId: null, title: "샘플 1", imageUrl: "/sample1.jpg" },
        { id: "sample-2", realId: null, title: "샘플 2", imageUrl: "/sample2.jpg" },
        { id: "sample-3", realId: null, title: "샘플 3", imageUrl: "/sample3.jpg" },
    ];

    const slides = hasDynamic ? dynamicSlides : fallbackSlides;

    const handleClickSlide = (slide) => {
        // realId 가 있을 때만 상세 페이지로 이동
        if (!slide.realId) return;
        // ✅ 여기 경로를 네 상세 페이지에 맞게 조정해도 됨
        navigate(`/recipe/${slide.realId}`);
    };

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
                {slides.map((slide) => (
                    <SwiperSlide
                        key={slide.id}
                        onClick={() => handleClickSlide(slide)}
                    >
                        <div
                            className="carousel-slide-inner"
                            style={{
                                cursor: slide.realId ? "pointer" : "default",
                            }}
                        >
                            <img
                                src={slide.imageUrl}
                                alt={slide.title}
                                onError={(e) => {
                                    // 이미지 깨지면 기본 이미지로 대체
                                    e.currentTarget.src = "/sample1.jpg";
                                }}
                            />
                            {/* 필요하면 제목 오버레이도 가능
                            <div className="carousel-caption">
                                {slide.title}
                            </div>
                            */}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

export default Carousel;
