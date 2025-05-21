import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Community/CommunityLayout";
import searchIcon from "../../assets/Icon.jpg";
import "./InfoPage.css";

export default function InfoPage() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 5;
    const pageLimit = 5;

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
        ...Array.from({ length: 10 }, (_, i) => ({
            id: i + 4,
            title: `냉장고 정보 ${i + 4}`,
            content: `${i + 4}번 정보게시글 내용입니다...`,
            author: `작성자${i + 4}`,
        }))
    ];

    const totalPages = Math.ceil(infoList.length / postsPerPage);
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = infoList.slice(indexOfFirstPost, indexOfLastPost);

    const currentGroup = Math.floor((currentPage - 1) / pageLimit);
    const startPage = currentGroup * pageLimit + 1;
    const endPage = Math.min(startPage + pageLimit - 1, totalPages);

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

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
                        {currentPosts.map((info) => (
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

                    {totalPages >= 1 && (
                        <div className="info-pagination">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                《
                            </button>
                            <button
                                onClick={() => setCurrentPage(startPage - 1)}
                                disabled={startPage === 1}
                            >
                                〈
                            </button>

                            {pageNumbers.map((page) => (
                                <span
                                    key={page}
                                    className={page === currentPage ? "active-page" : ""}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </span>
                            ))}

                            <button
                                onClick={() => setCurrentPage(endPage + 1)}
                                disabled={endPage === totalPages}
                            >
                                〉
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                》
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
