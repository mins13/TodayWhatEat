// src/pages/community/NoticePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Community/CommunityLayout";
import searchIcon from "../../assets/Icon.jpg";
import "./NoticePage.css";
import { fetchPosts } from "../../api/communityApi"; // ✅ 백엔드 연동 유틸

export default function NoticePage() {
    const navigate = useNavigate();

    // 검색/정렬/페이지 상태
    const [query, setQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [sort, setSort] = useState("latest"); // latest | views | likes
    const [currentPage, setCurrentPage] = useState(1);

    // 데이터
    const [posts, setPosts] = useState([]); // items
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // 페이지네이션 설정
    const postsPerPage = 5;
    const pageLimit = 5;

    // 🔑 캐시 키 (질의/정렬/페이지 조합)
    const CACHE_VER = "v1";
    const cacheKey = useMemo(
        () =>
            `notice:${CACHE_VER}:q=${encodeURIComponent(query)}:s=${sort}:p=${currentPage}:size=${postsPerPage}`,
        [query, sort, currentPage]
    );

    // ① 프리하이드레이션: 캐시가 있으면 즉시 반영(블로킹 없이 바로 그림)
    useEffect(() => {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setPosts(Array.isArray(parsed.items) ? parsed.items : []);
                setTotal(Number.isFinite(parsed.total) ? parsed.total : 0);
            } catch {}
        }
        // 캐시가 없으면 기존 상태 유지 → 아래 재검증에서 채워짐
    }, [cacheKey]);

    // ② 백그라운드 재검증: 서버 최신으로 갱신 + 캐시에 저장
    useEffect(() => {
        let aborted = false;
        (async () => {
            setLoading(true);
            try {
                const { items, total } = await fetchPosts("notice", {
                    query,
                    sort,
                    page: currentPage,
                    size: postsPerPage,
                });
                if (aborted) return;
                setPosts(items || []);
                setTotal(total || 0);
                sessionStorage.setItem(cacheKey, JSON.stringify({ items, total, at: Date.now() }));
            } catch (e) {
                console.error(e);
                // 캐시가 전혀 없고 네트워크도 실패했을 때만 안내
                const hadCache = !!sessionStorage.getItem(cacheKey);
                if (!hadCache) alert("공지사항을 불러오지 못했습니다.");
            } finally {
                if (!aborted) setLoading(false);
            }
        })();
        return () => {
            aborted = true;
        };
    }, [cacheKey]); // query/sort/page가 바뀌면 자동 재검증

    // 페이지네이션 계산
    const totalPages = Math.max(1, Math.ceil((total || 0) / postsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageLimit);
    const startPage = currentGroup * pageLimit + 1;
    const endPage = Math.min(startPage + pageLimit - 1, totalPages);
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    const handleSearch = () => {
        setQuery(searchInput.trim());
        setCurrentPage(1);
    };

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <Sidebar />
                </div>

                <div className="right-panel" aria-busy={loading}>
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

                        {/* 선택: 정렬 드롭다운(원한다면 UI 추가) */}
                        {/*
            <select value={sort} onChange={(e) => { setSort(e.target.value); setCurrentPage(1); }}>
              <option value="latest">최신순</option>
              <option value="views">조회순</option>
              <option value="likes">좋아요순</option>
            </select>
            */}
                    </div>

                    <div className="notice-list">
                        {(posts || []).length === 0 ? (
                            <div className="notice-item" style={{ justifyContent: "center" }}>
                                검색 결과가 없습니다.
                            </div>
                        ) : (
                            posts.map((notice) => (
                                <div
                                    className="notice-item"
                                    key={notice.id}
                                    onClick={() => navigate(`/community/notice/${notice.id}`)}
                                >
                                    <div className="notice-left">
                                        <div className="notice-title">
                                            {notice.pinned && (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        marginRight: 8,
                                                        padding: "2px 8px",
                                                        borderRadius: 12,
                                                        fontSize: 12,
                                                        background: "#fff3bf",
                                                        border: "1px solid #ffd43b",
                                                    }}
                                                >
                          고정
                        </span>
                                            )}
                                            {notice.title}
                                        </div>
                                        <div className="notice-content">{notice.content}</div>
                                    </div>
                                    <div className="notice-right">
                                        작성자: {notice.authorName ?? notice.author ?? "관리자"}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages >= 1 && (
                        <div className="notice-pagination">
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
