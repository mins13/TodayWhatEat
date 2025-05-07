import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Community/CommunityLayout";
import searchIcon from "../../assets/Icon.jpg";
import "./FreePage.css";

export default function FreePage() {
    const navigate = useNavigate();

    const postList = [
        {
            id: 1,
            title: "오늘 날씨 너무 좋네요!",
            content: "벚꽃이 활짝 폈어요~ 다들 산책하세요 🌸",
            author: "민영",
        },
        {
            id: 2,
            title: "간단한 요리 추천해주세요",
            content: "냉장고에 계란이랑 치즈밖에 없어요 ㅠㅠ",
            author: "요리초보",
        },
        {
            id: 3,
            title: "좋은 하루 되세요 :)",
            content: "여러분의 하루가 따뜻했으면 좋겠어요",
            author: "응원러",
        },
    ];

    const handleSearch = () => {
        alert("검색 실행"); // 추후 기능 연결
    };

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel">
                    <button
                        className="free-write-btn"
                        onClick={() => navigate("/community/write")}
                    >
                        글쓰기
                    </button>

                    <div className="free-header">
                        <h2>자유게시판</h2>
                        <div className="free-bar" />
                    </div>

                    <div className="free-search">
                        <input type="text" placeholder="검색어를 입력하세요" />
                        <button className="search-button" onClick={handleSearch}>
                            <img src={searchIcon} alt="검색" />
                        </button>
                    </div>

                    <div className="free-list">
                        {postList.map((post) => (
                            <div
                                className="free-item"
                                key={post.id}
                                onClick={() => navigate(`/community/${post.id}`)}
                            >
                                <div className="free-left">
                                    <div className="free-title">{post.title}</div>
                                    <div className="free-content">{post.content}</div>
                                </div>
                                <div className="free-right">
                                    작성자: {post.author}
                                    <div className="actions">
                                        <span onClick={(e) => { e.stopPropagation(); alert("수정!"); }}>수정</span>
                                        <span onClick={(e) => { e.stopPropagation(); alert("삭제!"); }}>삭제</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="free-pagination">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
