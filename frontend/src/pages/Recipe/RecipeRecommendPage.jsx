import React, {useEffect, useRef, useState} from "react";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import searchIcon from "../../assets/Icon.jpg";
import "./RecipeRecommendPage.css";
import CustomSelect from "../../components/Recipe/CustomSelect";
import { useNavigate } from "react-router-dom";
import { fetchAllRecipes, fetchFridgeIngredients, fetchFilteredRecipes } from "../../api/recipeViewApi"; // 🔁 연동 추가
import { fetchRecipesSorted } from "../../api/recipeEngageApi";



export default function RecipeRecommendPage() {
    const [recipes, setRecipes] = useState([]);
    const [fridgeIngredients, setFridgeIngredients] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [sortOption, setSortOption] = useState("popular");
    const [isTagExpanded, setIsTagExpanded] = useState(false);
    const [selectedCount, setSelectedCount] = useState(null);
    const [tempSelectedCount, setTempSelectedCount] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [tempSelectedTags, setTempSelectedTags] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();
    const didRun = useRef(false);

    useEffect(() => {
        const load = async () => {
            if (didRun.current) return; // 이미 실행됐으면 return
            didRun.current = true;

            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");

            if (!token || !userId) {
                alert("로그인이 필요합니다!");
                navigate("/login");
                return;
            }

            try {
                const recipeData = await fetchAllRecipes();
                const fridgeData = await fetchFridgeIngredients(userId);

                setRecipes(recipeData);

                if (Array.isArray(fridgeData)) {
                    const ingredients = fridgeData
                        .filter(f => Number(f.quantity) > 0)   // 수량 0 제외
                        .map(f => f.ingredientName);
                    setFridgeIngredients(ingredients);
                } else {
                    console.warn("❗ 냉장고 데이터가 배열이 아닙니다:", fridgeData);
                    setFridgeIngredients([]);
                }
            } catch (e) {
                console.error("❌ 데이터 로딩 실패", e);
            }
        };

        load();
    }, []);
    // 정렬 옵션이 바뀔 때마다 호출
    useEffect(() => {
        (async () => {
            try {
                const list = await fetchRecipesSorted(sortOption); // "popular" | "view" | default
                setRecipes(list);
                setCurrentPage(1);
            } catch (e) {
                console.error(e);
                alert("레시피 목록을 불러오지 못했습니다.");
            }
        })();
    }, [sortOption]);


    const postsPerPage = 5;
    const pageLimit = 5;

    const allTags = ["#혼밥", "#간단", "#건강식", "#채소요리", "#국물요리", "#고기요리", "#면요리", "#밥요리", "#명절음식", "#야식","#도시락", "#밑반찬", "#디저트","#음료"];

    const toggleTag = (tag) => {
        setTempSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const sortOptions = [
        { value: "popular", label: "인기순", tooltip: "다른 사람들이 많이 본 인기 레시피 순서로 보여줍니다" },
        { value: "view", label: "조회순", tooltip: "다른 사람들이 자주 본 레시피 순으로 정렬합니다", },
        { value: "match", label: "내 재료 우선", tooltip: "냉장고 속 재료가 많이 들어간 레시피 순서로 보여줍니다" },
    ];



    // ✅ 추천 필터링 처리
    let filtered = recipes
        .map((r) => {
            const matchCount = fridgeIngredients.filter(ing =>
                (r.ingredients || []).includes(ing)
            ).length;
            return { ...r, matchCount };
        })
        .filter((r) => {
            const normalizedTitle = r.title.replace(/\s/g, "").toLowerCase();
            const normalizedKeyword = searchKeyword.replace(/\s/g, "").toLowerCase();

            const keywordMatch = normalizedTitle.includes(normalizedKeyword);
            const countMatch = selectedCount ? r.matchCount >= selectedCount : true;
            const tagMatch = selectedTags.length > 0
                ? selectedTags.some(tag => (r.tags || []).includes(tag.replace("#", "")))
                : true;

            return keywordMatch && countMatch && tagMatch;
        });

    if (sortOption === "match") {
        filtered.sort((a, b) => b.matchCount - a.matchCount);
    } else if (sortOption === "popular") {
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    const recommended = recipes
        .map(r => {
            const matchCount = fridgeIngredients.filter(ing => (r.ingredients || []).includes(ing)).length;
            return { ...r, matchCount };
        })
        .filter(r => {
            const keywordMatch = r.title.includes(searchKeyword);
            const countMatch = selectedCount ? r.matchCount >= selectedCount : true;
            const tagMatch = selectedTags.length > 0
                ? selectedTags.some(tag => (r.tags || []).includes(tag))
                : true;

            return !(keywordMatch && countMatch && tagMatch);
        })
        .filter(r => r.matchCount >= 1)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 3);

    const totalPages = Math.ceil(filtered.length / postsPerPage);
    const indexOfLast = currentPage * postsPerPage;
    const indexOfFirst = indexOfLast - postsPerPage;
    const currentList = filtered.slice(indexOfFirst, indexOfLast);

    const currentGroup = Math.floor((currentPage - 1) / pageLimit);
    const startPage = currentGroup * pageLimit + 1;
    const endPage = Math.min(startPage + pageLimit - 1, totalPages);
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel"><RecipeSidebar /></div>
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
                                        setSearchKeyword(searchInput);
                                        setCurrentPage(1);
                                    }
                                }}
                            />
                            <button
                                className="search-button"
                                onClick={() => {
                                    setSearchKeyword(searchInput);
                                    setCurrentPage(1);
                                }}
                            >
                                <img src={searchIcon} alt="검색" />
                            </button>
                        </div>
                    </div>

                    {/* 필터 */}
                    <div className="recommend-filterbar">
                        <div className="filter-section">
                            <span className="filter-label">냉장고 속 재료 포함</span>
                            {[1, 2, 3, 4].map(n => (
                                <button
                                    key={n}
                                    className={tempSelectedCount === n ? "active-filter" : ""}
                                    onClick={() => setTempSelectedCount(tempSelectedCount === n ? null : n)}
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
                                            className={`tag-button ${tempSelectedTags.includes(tag) ? "active-filter" : ""}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                {allTags.length > 5 && (
                                    <button
                                        className="tag-toggle-button"
                                        onClick={() => setIsTagExpanded(prev => !prev)}
                                    >
                                        {isTagExpanded ? "▲" : "▼"}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="filter-action-buttons">
                            <button className="reset-filter-button" onClick={() => {
                                setTempSelectedCount(null);
                                setTempSelectedTags([]);
                                setSelectedCount(null);
                                setSelectedTags([]);
                                setCurrentPage(1);
                            }}>초기화</button>
                            <button className="apply-filter-button" onClick={async() => {
                                setSelectedCount(tempSelectedCount);
                                setSelectedTags(tempSelectedTags);
                                setCurrentPage(1);

                                if (tempSelectedCount) {
                                    const filtered = await fetchFilteredRecipes(tempSelectedCount);
                                    setRecipes(filtered);
                                } else {
                                    const all = await fetchAllRecipes();
                                    setRecipes(all);
                                }

                            }}>적용</button>
                        </div>
                    </div>

                    {/* 정렬 */}
                    <div className="recommend-sortbar">
                        <label htmlFor="custom-sort">정렬: </label>
                        <CustomSelect
                            value={sortOption}
                            options={sortOptions}
                            onChange={setSortOption}
                        />
                    </div>

                    {/* 결과 */}
                    {filtered.length > 0 ? (
                        <>
                            <div className="recommend-recipe-list">
                                {currentList.map(recipe => (
                                    <div key={recipe.id}
                                         className="recommend-recipe-card"
                                         onClick={() => navigate(`/recipe/${recipe.id}`)}
                                    >
                                        <div className="recommend-recipe-name">{recipe.title}</div>
                                        <div className="recommend-recipe-ingredients">
                                            재료:{" "}
                                            {(recipe.ingredients || []).map((ing, i) => (
                                                <span key={i} className={fridgeIngredients.includes(ing) ? "highlight" : ""}>
                                                    {ing}
                                                    {i < recipe.ingredients.length - 1 ? ", " : " ……"}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 페이지네이션 */}
                            <div className="recommend-recipe-pagination">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>《</button>
                                <button onClick={() => setCurrentPage(startPage - 1)} disabled={startPage === 1}>〈</button>
                                {pageNumbers.map(num => (
                                    <span key={num} className={num === currentPage ? "active" : ""} onClick={() => setCurrentPage(num)}>
                                        {num}
                                    </span>
                                ))}
                                <button onClick={() => setCurrentPage(endPage + 1)} disabled={endPage >= totalPages}>〉</button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>》</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="no-match-text">🔍 일치하는 레시피가 없습니다.</p>
                            <h4 className="alt-title">이런 레시피도 있어요!</h4>
                            <div className="recommend-recipe-list">
                                {recommended.map(recipe => (
                                    <div key={recipe.id} className="recommend-recipe-card">
                                        <div className="recommend-recipe-name">{recipe.title}</div>
                                        <div className="recommend-recipe-ingredients">
                                            재료:{" "}
                                            {(recipe.ingredients || []).map((ing, i) => (
                                                <span key={i} className={fridgeIngredients.includes(ing) ? "highlight" : ""}>
                                                    {ing}
                                                    {i < recipe.ingredients.length - 1 ? ", " : " ……"}
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
