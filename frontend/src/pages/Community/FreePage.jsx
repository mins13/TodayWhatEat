// src/pages/community/FreePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Community/CommunityLayout";
import searchIcon from "../../assets/Icon.jpg";
import "./FreePage.css";
import { fetchPosts } from "../../api/communityApi"; // ✅ 백엔드 연동 유틸

export default function FreePage() {
    const navigate = useNavigate();

    // 검색/정렬/페이지 상태
    const [query, setQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [sort, setSort] = useState("latest"); // latest | views | likes
    const [currentPage, setCurrentPage] = useState(1);

    // 데이터
    const [posts, setPosts] = useState([]);
    const [total, setTotal] = useState(0);

    // 페이지네이션 설정
    const postsPerPage = 5;
    const pageLimit = 5;

    useEffect(() => {
        (async () => {
            try {
                const { items, total } = await fetchPosts("free", {
                    query,
                    sort,
                    page: currentPage,
                    size: postsPerPage,
                });
                setPosts(items);
                setTotal(total);
            } catch (e) {
                console.error(e);
                alert("게시글을 불러오지 못했습니다.");
            }
        })();
    }, [query, sort, currentPage]);

    const totalPages = Math.max(1, Math.ceil(total / postsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageLimit);
    const startPage = currentGroup * pageLimit + 1;
    const endPage = Math.min(startPage + pageLimit - 1, totalPages);
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    const handleSearch = () => {
        setQuery(searchInput);
        setCurrentPage(1);
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
                        <input
                            type="text"
                            placeholder="검색어를 입력하세요"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                            }}
                        />
                        <button className="search-button" onClick={handleSearch}>
                            <img src={searchIcon} alt="검색" />
                        </button>
                    </div>

                    <div className="free-list">
                        {posts.length === 0 ? (
                            <div className="free-item" style={{ justifyContent: "center" }}>
                                검색 결과가 없습니다.
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div
                                    className="free-item"
                                    key={post.id}
                                    onClick={() => navigate(`/community/free/${post.id}`)}
                                >
                                    <div className="free-left">
                                        <div className="free-title">{post.title}</div>
                                        <div className="free-content">{post.content}</div>
                                    </div>
                                    <div className="free-right">
                                        작성자: {post.author}

                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages >= 1 && (
                        <div className="free-pagination">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                                《
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.max(1, startPage - 1))}
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
                                onClick={() => setCurrentPage(Math.min(totalPages, endPage + 1))}
                                disabled={endPage >= totalPages}
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
