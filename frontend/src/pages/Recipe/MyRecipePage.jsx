// src/pages/Recipe/MyRecipePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import { fetchMyRecipes } from "../../api/myRecipeApi";
import "./MyRecipePage.css";
import searchIcon from "../../assets/Icon.jpg";
import useRequireAuth from "../../hooks/useRequireAuth";

/** Wrapper: 여기서만 인증을 확인하고, 통과되면 Inner를 렌더 */
export default function MyRecipePage() {
    const ready = useRequireAuth({ alert: true });
    // ✅ 훅은 항상 동일하게 호출됨. 렌더 결과만 달라짐.
    if (!ready) return null; // 스피너 넣고 싶으면 여기에 간단한 로딩 UI 가능
    return <MyRecipePageInner />;
}

/** 실제 페이지 로직은 여기서 — 훅을 마음껏 사용해도 OK */
function MyRecipePageInner() {
    const navigate = useNavigate();

    // 서버 데이터 & 페이지네이션
    const [data, setData] = useState(null); // Page DTO (content, totalPages...)
    const [currentPage, setCurrentPage] = useState(1); // 1-based UI 페이지
    const pageSize = 10;

    // 검색 상태
    const [searchInput, setSearchInput] = useState(""); // 입력창
    const [searchKeyword, setSearchKeyword] = useState(""); // 실제 필터 키워드

    const [loading, setLoading] = useState(false);

    // 서버에서 내 초안 목록 가져오기 (정렬/상태 없음)
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchMyRecipes(currentPage - 1, pageSize); // 서버는 0-based
                setData(res);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentPage]);

    // 로컬 검색(제목/재료명)
    const items = useMemo(() => {
        const list = data?.content ?? [];
        const kw = searchKeyword.trim().toLowerCase();
        if (!kw) return list;
        return list.filter((d) => {
            const inTitle = (d.title || "").toLowerCase().includes(kw);
            const inIngs = (d.ingredients || []).some((g) =>
                (g.name || "").toLowerCase().includes(kw)
            );
            return inTitle || inIngs;
        });
    }, [data, searchKeyword]);

    // 검색 실행
    const runSearch = () => {
        setSearchKeyword(searchInput);
        setCurrentPage(1);
    };

    // 페이지 이동 유틸
    const totalPages = data?.totalPages ?? 1;
    const goFirst = () => setCurrentPage(1);
    const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
    const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
    const goLast = () => setCurrentPage(totalPages);

    return (
        <div className="main-container">
            <div className="community-wrapper">
                {/* 왼쪽 사이드바 */}
                <div className="left-panel">
                    <RecipeSidebar />
                </div>

                {/* 오른쪽 본문 */}
                <div className="right-panel myrecipes">
                    <h2 className="main-recipe-title">나만의 레시피</h2>

                    {/* 검색 + 작성 버튼 (정렬 없음) */}
                    <div className="main-recipe-searchbar">
                        <div className="main-recipe-searchbox">
                            <input
                                type="text"
                                placeholder="검색어를 입력하세요"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") runSearch();
                                }}
                            />
                            <button className="search-button" onClick={runSearch}>
                                <img src={searchIcon} alt="검색" />
                            </button>
                        </div>

                        <button
                            className="write-button"
                            onClick={() => navigate("/recipe/my/new")}
                        >
                            레시피 작성
                        </button>
                    </div>

                    {/* 목록 */}
                    {loading && <div className="empty">로딩...</div>}
                    {!loading && items.length === 0 && (
                        <div className="empty">레시피가 없습니다.</div>
                    )}

                    <div className="myrecipes-list">
                        {items.map((d) => (
                            <div
                                key={d.id}
                                className="myrecipes-card"
                                onClick={() => navigate(`/recipe/my/${d.id}`)}
                            >
                                <div className="title">{d.title || "(제목 없음)"}</div>
                                <div className="subtitle">
                                    재료: {(d.ingredients || [])
                                    .slice(0, 6)
                                    .map((g) => g.name)
                                    .filter(Boolean)
                                    .join(", ")}
                                    {(d.ingredients || []).length > 6 ? " …" : ""}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 페이지네이션 */}
                    {data && (
                        <div className="pagination">
                            <button onClick={goFirst} disabled={currentPage <= 1}>
                                «
                            </button>
                            <button onClick={goPrev} disabled={currentPage <= 1}>
                                ‹
                            </button>
                            <span className="page-num">{currentPage}</span>
                            <button onClick={goNext} disabled={currentPage >= totalPages}>
                                ›
                            </button>
                            <button onClick={goLast} disabled={currentPage >= totalPages}>
                                »
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
