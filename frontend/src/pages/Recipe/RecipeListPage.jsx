import React, { useEffect, useState } from "react";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import CustomSelect from "../../components/Recipe/CustomSelect";
import searchIcon from "../../assets/Icon.jpg";
import "./RecipeListPage.css";
import { useNavigate } from "react-router-dom";
import { fetchAllRecipes } from "../../api/recipeViewApi"; // ← 추가

export default function RecipePage() {
    const [recipes, setRecipes] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [sortOption, setSortOption] = useState("popular");
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();




    const postsPerPage = 5;
    const pageLimit = 5;

    const sortOptions = [
        { value: "popular", label: "인기순", tooltip: "다른 사람들이 많이 본 인기 레시피 순서로 보여줍니다",},
        { value: "view", label: "조회순", tooltip: "다른 사람들이 자주 본 레시피 순으로 정렬합니다", },
    ];

    // ✅ 실제 API 호출
    useEffect(() => {
        const load = async () => {
            const data = await fetchAllRecipes();
            setRecipes(data);
        };
        load();
    }, []);

    // 🔍 필터링 + 정렬
    const filteredList = recipes
        .map((r) => {
            const normalizedTitle = r.title.replace(/\s/g, "").toLowerCase();
            const normalizedKeyword = searchKeyword.replace(/\s/g, "").toLowerCase();
            return {
                ...r,
                matchesSearch: normalizedTitle.includes(normalizedKeyword),
            };
        })
        .filter((r) => r.matchesSearch);

    if (sortOption === "popular") {
        filteredList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sortOption === "view") {
        filteredList.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    // 페이지네이션
    const totalPages = Math.ceil(filteredList.length / postsPerPage);
    const indexOfLast = currentPage * postsPerPage;
    const indexOfFirst = indexOfLast - postsPerPage;
    const currentRecipes = filteredList.slice(indexOfFirst, indexOfLast);

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
                    <h2 className="main-recipe-title">전체 레시피</h2>
                    <div className="main-recipe-searchbar">
                        <div className="main-recipe-searchbox">
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

                    {/* 정렬바 */}
                    <div className="recommend-sortbar">
                        <label htmlFor="sort-select">정렬: </label>
                        <CustomSelect
                            value={sortOption}
                            options={sortOptions}
                            onChange={setSortOption}
                        />
                    </div>

                    {/* 레시피 리스트 */}
                    <div className="main-recipe-list">
                        {currentRecipes.map((recipe) => (
                            <div key={recipe.id}
                                 className="main-recipe-card"
                                 onClick={() => navigate(`/recipe/${recipe.id}`)}
                            >
                                <div className="main-recipe-name">{recipe.title}</div>
                                <div className="main-recipe-ingredients">
                                    재료:{" "}
                                    {recipe.ingredients && recipe.ingredients.slice(0, 5).map((item, index) => (
                                        <span key={index}>
                                            {item}
                                            {index < Math.min(recipe.ingredients.length, 5) - 1 ? ", " : ""}
                                        </span>
                                    ))}
                                    {recipe.ingredients && recipe.ingredients.length > 5 && " …"}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 페이지네이션 */}
                    <div className="main-recipe-pagination">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>《</button>
                        <button onClick={() => setCurrentPage(startPage - 1)} disabled={startPage === 1}>〈</button>
                        {pageNumbers.map((num) => (
                            <span
                                key={num}
                                className={num === currentPage ? "active" : ""}
                                onClick={() => setCurrentPage(num)}
                            >
                                {num}
                            </span>
                        ))}
                        <button onClick={() => setCurrentPage(endPage + 1)} disabled={endPage >= totalPages}>〉</button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>》</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
