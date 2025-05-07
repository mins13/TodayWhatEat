import React from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/Community/CommunityLayout";
import searchIcon from "../../assets/Icon.jpg";
import "./InfoPage.css";

export default function InfoPage() {
    const navigate = useNavigate();

    const infoList = [
        {
            id: 1,
            title: "식재료 보관법 총정리",
            content: "채소, 육류, 생선 등 각 식재료의 보관 방법을 정리해봤어요!",
            author: "정보꾼",
        },
        {
            id: 2,
            title: "유통기한과 소비기한의 차이",
            content: "헷갈리는 개념! 쉽게 설명해드립니다.",
            author: "민영",
        },
        {
            id: 3,
            title: "냉장고 정리 꿀팁!",
            content: "냉장고 정리 잘하면 음식물 쓰레기도 줄어요~",
            author: "살림왕",
        },
    ];

    const handleSearch = () => {
        alert("검색 실행");
    };

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel">
                    <button
                        className="info-write-btn"
                        onClick={() => navigate("/community/write")}
                    >
                        글쓰기
                    </button>

                    <div className="info-header">
                        <h2>정보게시판</h2>
                        <div className="info-bar" />
                    </div>

                    <div className="info-search">
                        <input type="text" placeholder="검색어를 입력하세요" />
                        <button className="search-button" onClick={handleSearch}>
                            <img src={searchIcon} alt="검색" />
                        </button>
                    </div>

                    <div className="info-list">
                        {infoList.map((info) => (
                            <div
                                className="info-item"
                                key={info.id}
                                onClick={() => navigate(`/community/${info.id}`)}
                            >
                                <div className="info-left">
                                    <div className="info-title">{info.title}</div>
                                    <div className="info-content">{info.content}</div>
                                </div>
                                <div className="info-right">
                                    작성자: {info.author}
                                    <div className="actions">
                                        <span onClick={(e) => { e.stopPropagation(); alert("수정!"); }}>수정</span>
                                        <span onClick={(e) => { e.stopPropagation(); alert("삭제!"); }}>삭제</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="info-pagination">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
