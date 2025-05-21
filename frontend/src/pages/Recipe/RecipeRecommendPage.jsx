import React, { useState } from "react";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import searchIcon from "../../assets/Icon.jpg";
import "./RecipeRecommendPage.css";
import CustomSelect from "../../components/Recipe/CustomSelect";
import { useNavigate } from "react-router-dom";

export default function RecipeRecommendPage() {
    /*useEffect(() => {
        fetch("/api/fridge") // 또는 props로 받기
            .then(res => res.json())
            .then(data => setFridgeIngredients(data));
    }, []);*/
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchInput, setSearchInput] = useState(""); // 입력창에 보여질 값
    const [sortOption, setSortOption] = useState("popular"); // "match" or "popular"
    const [isTagExpanded, setIsTagExpanded] = useState(false);


    const navigate = useNavigate();

    // 실제 적용된 필터

    const [selectedCount, setSelectedCount] = useState(null);

    // 임시 선택된 필터

    const [tempSelectedCount, setTempSelectedCount] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);


    const allTags = ["#간단", "#건강", "#국물", "#혼밥", "#유용함", "#자취", "#매콤", "#단백", "#고단백", "#브런치"];
    // 임시 선택된 태그들
    const [tempSelectedTags, setTempSelectedTags] = useState([]);
// 실제 적용된 태그들
    const [selectedTags, setSelectedTags] = useState([]);


    const toggleTag = (tag) => {
        setTempSelectedTags((prev) =>
            prev.includes(tag)
                ? prev.filter((t) => t !== tag) // 제거
                : [...prev, tag] // 추가
        );
    };




    const sortOptions = [
        {
            value: "match",
            label: "내 재료 우선",
            tooltip: "냉장고 속 재료가 많이 들어간 레시피 순서로 보여줍니다",
        },
        {
            value: "popular",
            label: "인기순",
            tooltip: "다른 사람들이 많이 본 인기 레시피 순서로 보여줍니다",
        },
    ];



    const recipes = [
        {
            id: 1,
            title: "애호박 찌개",
            ingredients: ["애호박", "마늘", "고추장", "대파", "양파"],
            tags: ["#간단", "#국물"],
            popularity: 60,
        },
        {
            id: 2,
            title: "콩나물 불고기",
            ingredients: ["대패삼겹살", "콩나물", "양파", "마늘", "간장", "고추장", "미림"],
            tags: ["#건강", "#볶음"],
            popularity: 90,
        },
    ];
    const [fridgeIngredients,setFridgeIngredients] = useState(["애호박", "양파", "계란"]); // 나중에 DB에서 불러오게 됨



    const postsPerPage = 5;
    const pageLimit = 5;

    let filtered = recipes
        .map((r) => {
            const matchCount = fridgeIngredients.filter(ing =>
                r.ingredients.includes(ing)
            ).length;
            return { ...r, matchCount };
        })
        .filter((r) => {
            const normalizedTitle = r.title.replace(/\s/g, "").toLowerCase();
            const normalizedKeyword = searchKeyword.replace(/\s/g, "").toLowerCase();

            const keywordMatch = normalizedTitle.includes(normalizedKeyword);
            const countMatch = selectedCount ? r.matchCount >= selectedCount : true;
            const tagMatch =
                selectedTags.length > 0
                    ? selectedTags.some((tag) => r.tags.includes(tag))
                    : true;

            return keywordMatch && countMatch && tagMatch;
        });



    if (sortOption === "match") {
        filtered.sort((a, b) => b.matchCount - a.matchCount); // 많이 포함된 순
    } else if (sortOption === "popular") {
        filtered.sort((a, b) => b.popularity - a.popularity); // 인기순
    }



    const recommended = recipes
        .map(r => {
            const matchCount = fridgeIngredients.filter(ing => r.ingredients.includes(ing)).length;
            return { ...r, matchCount };
        })
        .filter(r => {
            const keywordMatch = r.title.includes(searchKeyword);
            const countMatch = selectedCount ? r.matchCount >= selectedCount : true;

            // ✅ 이거 수정 필요!
            const tagMatch = selectedTags.length > 0
                ? selectedTags.some(tag => r.tags.includes(tag))
                : true;

            return !(keywordMatch && countMatch && tagMatch); // filtered에 포함되지 않는 애들
        })
        .filter(r => r.matchCount >= 1) // 냉장고 재료 1개 이상 포함
        .sort((a, b) => b.popularity - a.popularity)
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
                <div className="left-panel">
                    <RecipeSidebar />
                </div>
                <div className="right-panel">
                    <h2 className="recommend-recipe-title">레시피 추천</h2>

                    {/* 검색창 */}
                    <div className="recommend-searchbar-top">
                        <select className="recommend-category-select">
                            <option>카테고리</option>
                            <option>찌개</option>
                            <option>볶음</option>
                            <option>국물</option>
                            <option>건강</option>
                        </select>
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
                                    setSearchKeyword(searchInput); // 버튼 클릭 시만 적용
                                    setCurrentPage(1); // 검색하면 페이지 초기화
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
                                        onClick={() => setIsTagExpanded((prev) => !prev)}
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
                                onClick={() => {
                                    setSelectedCount(tempSelectedCount);
                                    setSelectedTags(tempSelectedTags);
                                    setCurrentPage(1);
                                }}
                            >
                                적용
                            </button>


                        </div>
                    </div>

                    {/* 결과 */}
                    <div className="recommend-sortbar">
                        <label htmlFor="custom-sort">정렬: </label>
                        <CustomSelect
                            value={sortOption}
                            options={sortOptions}
                            onChange={setSortOption}
                        />
                    </div>

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
                                            {recipe.ingredients.map((ing, i) => (
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
                                            {recipe.ingredients.map((ing, i) => (
                                                <span key={i}
                                                      className={fridgeIngredients.includes(ing) ? "highlight" : ""}>
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
