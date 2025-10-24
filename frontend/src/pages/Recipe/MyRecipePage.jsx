import React, {
    useEffect,
    useMemo,
    useState,
    useDeferredValue,
    useTransition,
} from "react";
import { useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import { fetchMyRecipes, deleteMyRecipe } from "../../api/myRecipeApi";
import "./MyRecipePage.css";
import searchIcon from "../../assets/Icon.jpg";
import useRequireAuth from "../../hooks/useRequireAuth";

/** Wrapper: 인증 확인 후 내부 컴포넌트 렌더 */
export default function MyRecipePage() {
    const ready = useRequireAuth({ alert: true });
    if (!ready) return null;
    return <MyRecipePageInner />;
}

function MyRecipePageInner() {
    const navigate = useNavigate();

    // 서버 데이터 & 페이지네이션
    const [data, setData] = useState(null); // Page DTO (content, totalPages ...)
    const [currentPage, setCurrentPage] = useState(1); // 1-based
    const pageSize = 10;

    // 검색 상태
    const [searchInput, setSearchInput] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const deferredKeyword = useDeferredValue(searchKeyword);
    const [isPending, startTransition] = useTransition();

    const [loading, setLoading] = useState(false);

    const userId = localStorage.getItem("userId") || "guest";
    const CACHE_PREFIX = `myrecipes:${userId}:v1`;
    const pageKey = (p) => `${CACHE_PREFIX}:p${p}`;

    // ① 프리하이드레이션: 페이지 바뀔 때마다 캐시에서 즉시 반영
    useEffect(() => {
        const cached = sessionStorage.getItem(pageKey(currentPage));
        if (cached) {
            try {
                setData(JSON.parse(cached));
            } catch {}
        }
    }, [currentPage]);

    // ② 백그라운드 재검증: 서버 최신 데이터로 갱신 + 캐시 저장
    useEffect(() => {
        let aborted = false;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchMyRecipes(currentPage - 1, pageSize); // 서버 0-based
                if (aborted) return;
                setData(res);
                sessionStorage.setItem(pageKey(currentPage), JSON.stringify(res));
            } finally {
                if (!aborted) setLoading(false);
            }
        };
        load();
        return () => {
            aborted = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // 새로고침 유틸(서버 → 상태/캐시 갱신)
    const refresh = async (page = currentPage) => {
        const res = await fetchMyRecipes(page - 1, pageSize);
        setData(res);
        sessionStorage.setItem(pageKey(page), JSON.stringify(res));
    };

    // 삭제
    const onDelete = async (id) => {
        if (!window.confirm("이 레시피를 삭제할까요? 되돌릴 수 없어요.")) return;
        try {
            await deleteMyRecipe(id);
            // 관련 캐시 전부 무효화
            Object.keys(sessionStorage).forEach((k) => {
                if (k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
            });
            await refresh(); // 현재 페이지 재조회
            alert("삭제되었습니다.");
        } catch (e) {
            alert(e?.message || "삭제에 실패했습니다.");
        }
    };

    // 로컬 검색(제목/재료명) – 메모이제 + 입력 지연
    const items = useMemo(() => {
        const list = data?.content ?? [];
        const kw = (deferredKeyword || "").trim().toLowerCase();
        if (!kw) return list;
        return list.filter((d) => {
            const inTitle = (d.title || "").toLowerCase().includes(kw);
            const inIngs = (d.ingredients || []).some((g) =>
                (g.name || "").toLowerCase().includes(kw)
            );
            return inTitle || inIngs;
        });
    }, [data, deferredKeyword]);

    // 검색 실행
    const runSearch = () => {
        startTransition(() => setSearchKeyword(searchInput));
        setCurrentPage(1);
    };

    // 페이지 유틸
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
                <div className="right-panel myrecipes" aria-busy={isPending || loading}>
                    <h2 className="main-recipe-title">나만의 레시피</h2>

                    {/* 검색 + 작성 버튼 */}
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
                                aria-label="내 레시피 검색"
                            />
                            <button className="search-button" onClick={runSearch} title="검색">
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
                    {loading && !data && <div className="empty">로딩...</div>}
                    {!loading && items.length === 0 && (
                        <div className="empty">레시피가 없습니다.</div>
                    )}

                    <div className="myrecipes-list">
                        {items.map((d) => (
                            <div
                                key={d.id}
                                className="myrecipes-card"
                                onClick={() => navigate(`/recipe/my/${d.id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") navigate(`/recipe/my/${d.id}`);
                                }}
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

                                {/* 카드 삭제 버튼 (카드 클릭 방지) */}
                                <button
                                    className="card-del"
                                    title="삭제"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(d.id);
                                    }}
                                >
                                    삭제
                                </button>
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
