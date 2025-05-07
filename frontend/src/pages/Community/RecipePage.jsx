import React from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/Community/CommunityLayout";
import searchIcon from "../../assets/Icon.jpg";
import "./RecipePage.css";

export default function RecipePage() {
    const navigate = useNavigate();

    const recipePosts = [
        {
            id: 1,
            title: "간단한 계란볶음밥 🍳",
            content: "집에 있는 재료로 계란, 밥, 간장만 있으면 만들 수 있어요!",
            author: "요리초보",
        },
        {
            id: 2,
            title: "김치찌개 맛있게 끓이는 꿀팁",
            content: "묵은지를 써야 감칠맛이 배가됩니다. 돼지고기도 꼭 넣어요~",
            author: "밥도둑",
        },
        {
            id: 3,
            title: "닭가슴살 샐러드 레시피 🥗",
            content: "다이어트 중인데도 맛있게 먹고 싶을 때 강추!",
            author: "헬스보이",
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
                        className="recipe-write-btn"
                        onClick={() => navigate("/community/write")}
                    >
                        글쓰기
                    </button>
                    <div className="recipe-header">
                        <h2>레시피 게시판</h2>
                        <div className="recipe-bar" />
                    </div>

                    <div className="recipe-search">
                        <input type="text" placeholder="검색어를 입력하세요" />
                        <button className="search-button" onClick={handleSearch}>
                            <img src={searchIcon} alt="검색" />
                        </button>
                    </div>

                    <div className="recipe-list">
                        {recipePosts.map((post) => (
                            <div
                                className="recipe-item"
                                key={post.id}
                                onClick={() => navigate(`/community/${post.id}`)}
                            >
                                <div className="recipe-left">
                                    <div className="recipe-title">{post.title}</div>
                                    <div className="recipe-content">{post.content}</div>
                                </div>
                                <div className="recipe-right">
                                    작성자: {post.author}
                                    <div className="actions">
                                        <span onClick={(e) => { e.stopPropagation(); alert("수정!"); }}>수정</span>
                                        <span onClick={(e) => { e.stopPropagation(); alert("삭제!"); }}>삭제</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="recipe-pagination">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
