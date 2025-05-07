import React from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/Community/CommunityLayout";
import searchIcon from "../../assets/Icon.jpg";
import "./NoticePage.css";

export default function NoticePage() {
    const navigate = useNavigate();

    const noticeList = [
        {
            id: 1,
            title: "업데이트 안내",
            content: "2025-03 업데이트 완료! 이번 업데이트 내용은 새로운 기능이 추가되었으며...",
            author: "관리자",
        },
        {
            id: 2,
            title: "이용 수칙 안내",
            content: "커뮤니티 이용 시 다음과 같은 수칙을 지켜주세요...",
            author: "관리자",
        },
        {
            id: 3,
            title: "정기 점검 일정",
            content: "서버 점검이 2025년 5월 10일 02:00 ~ 05:00 에 예정되어 있습니다.",
            author: "관리자",
        },
    ];

    const handleSearch = () => {
        alert("검색 실행"); // 나중에 검색 기능 추가 가능
    };

    return (
        <div className="main-container">

            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel">
                    <button
                        className="notice-write-btn"
                        onClick={() => navigate("/community/write")}
                    >
                        글쓰기
                    </button>
                    <div className="notice-header">
                        <h2>공지사항</h2>

                        <div className="notice-bar" />
                    </div>

                    <div className="notice-search">
                        <input type="text" placeholder="검색어를 입력하세요" />
                        <button className="search-button" onClick={handleSearch}>
                            <img src={searchIcon} alt="검색" />
                        </button>
                    </div>



                    <div className="notice-list">
                        {noticeList.map((notice) => (
                            <div
                                className="notice-item"
                                key={notice.id}
                                onClick={() => navigate(`/community/${notice.id}`)}
                            >
                                <div className="notice-left">
                                    <div className="notice-title">{notice.title}</div>
                                    <div className="notice-content">{notice.content}</div>
                                </div>
                                <div className="notice-right">
                                    작성자: {notice.author}
                                    <div className="actions">
                                        <span onClick={(e) => { e.stopPropagation(); alert("수정!"); }}>수정</span>
                                        <span onClick={(e) => { e.stopPropagation(); alert("삭제!"); }}>삭제</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="notice-pagination">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                    </div>
                </div>
            </div>

        </div>
    );
}
