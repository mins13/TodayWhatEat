import React, {
    useEffect,
    useMemo,
    useState,
    useDeferredValue,
    useTransition,
} from "react";
import { useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import CustomSelect from "../../components/Recipe/CustomSelect";
import searchIcon from "../../assets/Icon.jpg";
import "./RecipeListPage.css";

import { fetchAllRecipes } from "../../api/recipeViewApi";
import { getSorter } from "../../utils/sorters";

export default function RecipePage() {
    const [recipes, setRecipes] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [sortOption, setSortOption] = useState("popular");
    const [currentPage, setCurrentPage] = useState(1);

    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();
    const deferredKeyword = useDeferredValue(searchKeyword); // 검색 키워드 지연

    // 보여줄 옵션들
    const sortOptions = [
        { value: "popular", label: "인기순", tooltip: "다른 사람들이 많이 본 순" },
        { value: "views", label: "조회순", tooltip: "조회수가 높은 순" },
    ];

    // 서버/캐시 간 포맷 차이를 흡수
    const normalizeList = (list = []) =>
        list.map((r) => ({
            ...r,
            likes: Number(
                r.likes ??
                r.likeCount ??
                r.likesCount ??
                r.like_count ??
                r.popularity ??
                0
            ),
            views: Number(r.views ?? r.viewCount ?? r.view_count ?? 0),
            title: r.title ?? "",
            tags: r.tags ?? [],
            // ["양파"] 또는 [{name:"양파"} | {ingredientName:"양파"}] 모두 처리
            ingredients: (r.ingredients ?? [])
                .map((it) =>
                    typeof it === "string" ? it : it?.name ?? it?.ingredientName ?? ""
                )
                .filter(Boolean),
        }));

    // 세션 캐시 키 (구조 바뀌면 v2, v3…)
    const STORAGE_KEY = "recipes:all:v1";

    // ① 캐시 프리하이드레이션: 즉시 그려주기
    useEffect(() => {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setRecipes(normalizeList(parsed));
            } catch {
                // 캐시 깨졌으면 무시
            }
        }
    }, []);

    // ② 백그라운드 재검증: 서버 최신 데이터로 교체(+캐시에 저장)
    useEffect(() => {
        let aborted = false;
        (async () => {
            const data = await fetchAllRecipes({ sort: sortOption });
            if (aborted) return;
            setRecipes(normalizeList(data));
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setCurrentPage(1);
        })();
        return () => {
            aborted = true;
        };
    }, [sortOption]);

    // 🔎 필터 + 정렬(보조) — 메모이제
    const filteredList = useMemo(() => {
        const kw = (deferredKeyword || "").replace(/\s/g, "").toLowerCase();
        return (recipes || [])
            .map((r) => ({
                ...r,
                matchesSearch: (r.title || "").replace(/\s/g, "").toLowerCase().includes(kw),
            }))
            .filter((r) => r.matchesSearch)
            .sort(getSorter(sortOption));
    }, [recipes, deferredKeyword, sortOption]);

    // 페이지네이션 계산 — 메모이제
    const { currentRecipes, totalPages, pageNumbers, startPage, endPage } =
        useMemo(() => {
            const postsPerPage = 5;
            const pageLimit = 5;

            const totalPages = Math.max(1, Math.ceil(filteredList.length / postsPerPage));
            const indexOfLast = currentPage * postsPerPage;
            const indexOfFirst = indexOfLast - postsPerPage;
            const currentRecipes = filteredList.slice(indexOfFirst, indexOfLast);

            const currentGroup = Math.floor((currentPage - 1) / pageLimit);
            const startPage = currentGroup * pageLimit + 1;
            const endPage = Math.min(startPage + pageLimit - 1, totalPages);
            const pageNumbers = [];
            for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

            return { currentRecipes, totalPages, pageNumbers, startPage, endPage };
        }, [filteredList, currentPage]);

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <RecipeSidebar />
                </div>

                <div className="right-panel">
                    <h2 className="main-recipe-title">전체 레시피</h2>

                    {/* 검색 */}
                    <div className="main-recipe-searchbar">
                        <div className="main-recipe-searchbox">
                            <input
                                type="text"
                                placeholder="검색어를 입력하세요"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        startTransition(() => setSearchKeyword(searchInput));
                                        setCurrentPage(1);
                                    }
                                }}
                                aria-label="레시피 검색"
                            />
                            <button
                                className="search-button"
                                onClick={() => {
                                    startTransition(() => setSearchKeyword(searchInput));
                                    setCurrentPage(1);
                                }}
                                aria-label="검색"
                                title="검색"
                            >
                                <img src={searchIcon} alt="검색" />
                            </button>
                        </div>
                    </div>

                    {/* 정렬 */}
                    <div className="recommend-sortbar">
                        <label htmlFor="sort-select">정렬: </label>
                        <CustomSelect
                            id="sort-select"
                            value={sortOption}
                            options={sortOptions}
                            onChange={setSortOption}
                        />
                    </div>

                    {/* 목록 */}
                    <div className="main-recipe-list" aria-busy={isPending}>
                        {currentRecipes.map((recipe) => (
                            <div
                                key={recipe.id}
                                className="main-recipe-card"
                                onClick={() => navigate(`/recipe/${recipe.id}`)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") navigate(`/recipe/${recipe.id}`);
                                }}
                            >
                                <div className="main-recipe-name">{recipe.title}</div>
                                <div className="main-recipe-ingredients">
                                    재료:{" "}
                                    {(recipe.ingredients || []).slice(0, 5).map((item, index) => (
                                        <span key={index}>
                      {item}
                                            {index <
                                            Math.min((recipe.ingredients || []).length, 5) - 1
                                                ? ", "
                                                : ""}
                    </span>
                                    ))}
                                    {(recipe.ingredients || []).length > 5 && " …"}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 페이지네이션 */}
                    <div className="main-recipe-pagination">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                            《
                        </button>
                        <button
                            onClick={() => setCurrentPage(startPage - 1)}
                            disabled={startPage === 1}
                        >
                            〈
                        </button>
                        {pageNumbers.map((num) => (
                            <span
                                key={num}
                                className={num === currentPage ? "active" : ""}
                                onClick={() => setCurrentPage(num)}
                            >
                {num}
              </span>
                        ))}
                        <button
                            onClick={() => setCurrentPage(endPage + 1)}
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
                </div>
            </div>
        </div>
    );
}
