import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useDeferredValue,
    useTransition,
} from "react";
import { useNavigate } from "react-router-dom";

import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import CustomSelect from "../../components/Recipe/CustomSelect";
import searchIcon from "../../assets/Icon.jpg";
import "./RecipeRecommendPage.css";

import {
    fetchAllRecipes,
    fetchFridgeIngredients,
    fetchFilteredRecipes,
} from "../../api/recipeViewApi";
import { getSorter } from "../../utils/sorters";

export default function RecipeRecommendPage() {
    // ---------------- state ----------------
    const [recipes, setRecipes] = useState([]);
    const [fridgeIngredients, setFridgeIngredients] = useState([]);

    const [searchInput, setSearchInput] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const deferredKeyword = useDeferredValue(searchKeyword);
    const [isPending, startTransition] = useTransition();

    const [sortOption, setSortOption] = useState("popular");

    const [isTagExpanded, setIsTagExpanded] = useState(false);
    const [selectedCount, setSelectedCount] = useState(null);
    const [tempSelectedCount, setTempSelectedCount] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tempSelectedTags, setTempSelectedTags] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);

    const navigate = useNavigate();
    const didRun = useRef(false);

    // ---------------- constants ----------------
    const postsPerPage = 5;
    const pageLimit = 5;
    const allTags = [
        "#혼밥",
        "#간단",
        "#건강식",
        "#채소요리",
        "#국물요리",
        "#고기요리",
        "#면요리",
        "#밥요리",
        "#명절음식",
        "#야식",
        "#도시락",
        "#밑반찬",
        "#디저트",
        "#음료",
    ];

    const sortOptions = [
        { value: "popular", label: "인기순", tooltip: "다른 사람들이 많이 본 순" },
        { value: "views", label: "조회순", tooltip: "조회수가 높은 순" },
        { value: "match", label: "내 재료 우선", tooltip: "냉장고 재료 포함 많은 순" },
    ];

    // ---------------- helpers ----------------
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

    const STORAGE_RECIPES = "recipes:all:v1";
    const STORAGE_FRIDGE_PREFIX = "fridge:user:"; // + userId + :v1

    const toggleTag = (tag) =>
        setTempSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );

    // ---------------- pre-hydration (recipes & fridge) ----------------
    useEffect(() => {
        // 레시피 캐시
        const cachedRecipes = sessionStorage.getItem(STORAGE_RECIPES);
        if (cachedRecipes) {
            try {
                setRecipes(normalizeList(JSON.parse(cachedRecipes)));
            } catch {}
        }

        // 냉장고 캐시
        const userId = localStorage.getItem("userId");
        if (userId) {
            const cachedFridge = sessionStorage.getItem(
                `${STORAGE_FRIDGE_PREFIX}${userId}:v1`
            );
            if (cachedFridge) {
                try {
                    const arr = JSON.parse(cachedFridge);
                    const ingredients = Array.isArray(arr)
                        ? arr
                            .filter((f) => Number(f.quantity) > 0)
                            .map((f) => f.ingredientName)
                        : [];
                    setFridgeIngredients(ingredients);
                } catch {}
            }
        }
    }, []);

    // ---------------- background revalidation ----------------
    useEffect(() => {
        const load = async () => {
            if (didRun.current) return;
            didRun.current = true;

            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            if (!token || !userId) {
                alert("로그인이 필요합니다!");
                navigate("/login");
                return;
            }

            // 레시피: 정렬에 따라 서버 캐시에서 바로 받기
            const recipeData = await fetchAllRecipes({ sort: sortOption });
            setRecipes(normalizeList(recipeData));
            sessionStorage.setItem(STORAGE_RECIPES, JSON.stringify(recipeData));

            // 냉장고
            const fridgeData = await fetchFridgeIngredients(userId);
            const ingredients = Array.isArray(fridgeData)
                ? fridgeData
                    .filter((f) => Number(f.quantity) > 0)
                    .map((f) => f.ingredientName)
                : [];
            setFridgeIngredients(ingredients);
            sessionStorage.setItem(
                `${STORAGE_FRIDGE_PREFIX}${userId}:v1`,
                JSON.stringify(fridgeData || [])
            );
        };

        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortOption]); // 정렬 바뀌면 레시피만 갱신됨

    // ---------------- filtering & sorting ----------------
    const filtered = useMemo(() => {
        const kw = (deferredKeyword || "").replace(/\s/g, "").toLowerCase();

        let list = recipes
            .map((r) => {
                const matchCount = fridgeIngredients.filter((ing) =>
                    (r.ingredients || []).includes(ing)
                ).length;

                const normalizedTitle = (r.title || "")
                    .replace(/\s/g, "")
                    .toLowerCase();

                const keywordMatch = normalizedTitle.includes(kw);
                const countMatch = selectedCount ? matchCount >= selectedCount : true;
                const tagMatch =
                    selectedTags.length > 0
                        ? selectedTags.some((tag) =>
                            (r.tags || []).includes(tag.replace("#", ""))
                        )
                        : true;

                return {
                    ...r,
                    matchCount,
                    _visible: keywordMatch && countMatch && tagMatch,
                };
            })
            .filter((r) => r._visible);

        if (sortOption === "match") {
            list = [...list].sort((a, b) => {
                if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
                return getSorter("popular")(a, b); // 동률이면 인기순 보조정렬
            });
        } else {
            list = [...list].sort(getSorter(sortOption));
        }
        return list;
    }, [
        recipes,
        fridgeIngredients,
        deferredKeyword,
        selectedCount,
        selectedTags,
        sortOption,
    ]);

    const recommended = useMemo(() => {
        // 현재 필터에서 탈락한 애들 중 냉장고 1개 이상 포함 → 인기순 상위 3개
        const kw = (deferredKeyword || "").replace(/\s/g, "").toLowerCase();

        return recipes
            .map((r) => {
                const matchCount = fridgeIngredients.filter((ing) =>
                    (r.ingredients || []).includes(ing)
                ).length;

                const normalizedTitle = (r.title || "")
                    .replace(/\s/g, "")
                    .toLowerCase();

                const keywordMatch = normalizedTitle.includes(kw);
                const countMatch = selectedCount ? matchCount >= selectedCount : true;
                const tagMatch =
                    selectedTags.length > 0
                        ? selectedTags.some((tag) =>
                            (r.tags || []).includes(tag.replace("#", ""))
                        )
                        : true;

                return { ...r, matchCount, _visible: keywordMatch && countMatch && tagMatch };
            })
            .filter((r) => !r._visible) // 현재 필터에 걸리지 않은 애들만
            .filter((r) => r.matchCount >= 1)
            .sort(getSorter("popular"))
            .slice(0, 3);
    }, [
        recipes,
        fridgeIngredients,
        deferredKeyword,
        selectedCount,
        selectedTags,
    ]);

    // ---------------- pagination (memo) ----------------
    const { currentList, totalPages, pageNumbers, startPage, endPage } = useMemo(() => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / postsPerPage));
        const indexOfLast = currentPage * postsPerPage;
        const indexOfFirst = indexOfLast - postsPerPage;
        const currentList = filtered.slice(indexOfFirst, indexOfLast);

        const currentGroup = Math.floor((currentPage - 1) / pageLimit);
        const startPage = currentGroup * pageLimit + 1;
        const endPage = Math.min(startPage + pageLimit - 1, totalPages);
        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

        return { currentList, totalPages, pageNumbers, startPage, endPage };
    }, [filtered, currentPage]);

    // ---------------- UI ----------------
    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <RecipeSidebar />
                </div>

                <div className="right-panel">
                    <h2 className="recommend-recipe-title">레시피 추천</h2>

                    {/* 검색 */}
                    <div className="recommend-searchbar-top">
                        <div className="recommend-searchbox">
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

                    {/* 필터 */}
                    <div className="recommend-filterbar">
                        <div className="filter-section">
                            <span className="filter-label">냉장고 속 재료 포함</span>
                            {[1, 2, 3, 4].map((n) => (
                                <button
                                    key={n}
                                    className={tempSelectedCount === n ? "active-filter" : ""}
                                    onClick={() =>
                                        setTempSelectedCount(
                                            tempSelectedCount === n ? null : n
                                        )
                                    }
                                >
                                    {n}개 이상
                                </button>
                            ))}
                        </div>

                        <div className="filter-section">
                            <span className="filter-label">태그</span>
                            <div className="tag-wrapper">
                                <div className={`tag-container ${isTagExpanded ? "expanded" : ""}`}>
                                    {(isTagExpanded ? allTags : allTags.slice(0, 5)).map((tag) => (
                                        <button
                                            key={tag}
                                            className={`tag-button ${
                                                tempSelectedTags.includes(tag) ? "active-filter" : ""
                                            }`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                {allTags.length > 5 && (
                                    <button
                                        className="tag-toggle-button"
                                        onClick={() => setIsTagExpanded((prev) => !prev)}
                                        aria-label="태그 더보기"
                                    >
                                        {isTagExpanded ? "▲" : "▼"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="filter-action-buttons">
                            <button
                                className="reset-filter-button"
                                onClick={() => {
                                    setTempSelectedCount(null);
                                    setTempSelectedTags([]);
                                    setSelectedCount(null);
                                    setSelectedTags([]);
                                    setCurrentPage(1);
                                }}
                            >
                                초기화
                            </button>

                            <button
                                className="apply-filter-button"
                                onClick={async () => {
                                    setSelectedCount(tempSelectedCount);
                                    setSelectedTags(tempSelectedTags);
                                    setCurrentPage(1);

                                    // 서버 필터(minCount)를 쓰는 경우(선택)
                                    if (tempSelectedCount) {
                                        const filtered = await fetchFilteredRecipes(tempSelectedCount);
                                        setRecipes(normalizeList(filtered));
                                    } else {
                                        const all = await fetchAllRecipes({ sort: sortOption });
                                        setRecipes(normalizeList(all));
                                        sessionStorage.setItem(
                                            STORAGE_RECIPES,
                                            JSON.stringify(all)
                                        );
                                    }
                                }}
                            >
                                적용
                            </button>
                        </div>
                    </div>

                    {/* 정렬 */}
                    <div className="recommend-sortbar">
                        <label htmlFor="custom-sort">정렬: </label>
                        <CustomSelect
                            id="custom-sort"
                            value={sortOption}
                            options={sortOptions}
                            onChange={(v) => {
                                setSortOption(v);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {/* 결과 리스트 */}
                    {filtered.length > 0 ? (
                        <>
                            <div className="recommend-recipe-list" aria-busy={isPending}>
                                {currentList.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        className="recommend-recipe-card"
                                        onClick={() => navigate(`/recipe/${recipe.id}`)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") navigate(`/recipe/${recipe.id}`);
                                        }}
                                    >
                                        <div className="recommend-recipe-name">{recipe.title}</div>
                                        <div className="recommend-recipe-ingredients">
                                            재료:{" "}
                                            {(recipe.ingredients || []).map((ing, i) => (
                                                <span
                                                    key={i}
                                                    className={
                                                        fridgeIngredients.includes(ing) ? "highlight" : ""
                                                    }
                                                >
                          {ing}
                                                    {i < (recipe.ingredients || []).length - 1
                                                        ? ", "
                                                        : " ……"}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 페이지네이션 */}
                            <div className="recommend-recipe-pagination">
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
                        </>
                    ) : (
                        <>
                            <p className="no-match-text">🔍 일치하는 레시피가 없습니다.</p>
                            <h4 className="alt-title">이런 레시피도 있어요!</h4>
                            <div className="recommend-recipe-list">
                                {recommended.map((recipe) => (
                                    <div key={recipe.id} className="recommend-recipe-card">
                                        <div className="recommend-recipe-name">{recipe.title}</div>
                                        <div className="recommend-recipe-ingredients">
                                            재료:{" "}
                                            {(recipe.ingredients || []).map((ing, i) => (
                                                <span
                                                    key={i}
                                                    className={
                                                        fridgeIngredients.includes(ing) ? "highlight" : ""
                                                    }
                                                >
                          {ing}
                                                    {i < (recipe.ingredients || []).length - 1
                                                        ? ", "
                                                        : " ……"}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
