import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import ConfirmModal from "../../components/Recipe/ConfirmModal";
import "./RecipeDetailPage.css";

export default function RecipeDetailPage() {
    const { recipeId } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [seasonings, setSeasonings] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllDelete, setIsAllDelete] = useState(false);
    const [targetIndex, setTargetIndex] = useState(null);

    // ✅ 레시피 불러오기
    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/recipes/${recipeId}`);
                const data = await res.json();
                setRecipe(data);
                setIngredients(data.ingredients.map(i => {
                    const [name, quantity] = i.split(" ");
                    return { name, quantity };
                }));
                setSeasonings(data.seasonings.map(s => {
                    const [name, quantity] = s.split(" ");
                    return { name, quantity };
                }));
            } catch (e) {
                console.error("레시피 로딩 실패:", e);
            }
        };
        fetchRecipe();
    }, [recipeId]);

    const handleRemoveClick = (index) => {
        setTargetIndex(index);
        setIsAllDelete(false);
        setIsModalOpen(true);
    };

    const handleRemoveAllClick = () => {
        setIsAllDelete(true);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = () => {
        alert("삭제되었습니다!");
        setIsModalOpen(false);
    };

    if (!recipe) return <div className="recipe-detail-loading">로딩 중...</div>;

    return (
        <div className="recipe-detail-container">
            <div className="recipe-detail-wrapper">
                <div className="recipe-detail-left-panel">
                    <RecipeSidebar />
                </div>

                <div className="recipe-detail-right-panel">
                    <h2 className="recipe-detail-title">{recipe.title}</h2>

                    <div className="recipe-detail-top">
                        <img src={recipe.image} alt={recipe.title} className="recipe-detail-image" />

                        <div className="recipe-detail-table-box">
                            <table className="recipe-detail-table">
                                <thead>
                                <tr>
                                    <th>재료</th>
                                    <th>조미료</th>
                                </tr>
                                </thead>
                                <tbody>
                                {Array.from({
                                    length: Math.max(ingredients.length, seasonings.length),
                                }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="recipe-detail-ingredient-cell">
                                            {ingredients[i] && (
                                                <>
                                                    <span>{ingredients[i].name} {ingredients[i].quantity}</span>
                                                    <button
                                                        className="recipe-detail-remove-btn"
                                                        onClick={() => handleRemoveClick(i)}
                                                    >
                                                        재료 삭제
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                        <td>
                                            {seasonings[i] && `${seasonings[i].name} ${seasonings[i].quantity}`}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            <div className="recipe-detail-remove-all-wrapper">
                                <button
                                    className="recipe-detail-remove-all-btn"
                                    onClick={handleRemoveAllClick}
                                >
                                    재료 전체 삭제
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="recipe-detail-description">
                        <h4>레시피</h4>
                        <ol>
                            {recipe.instructions.map((step, i) =>
                                !showAll && i >= 3 ? null : <li key={i}>{step}</li>
                            )}
                        </ol>
                        {recipe.instructions.length > 3 && (
                            <button
                                className="recipe-detail-show-more-btn"
                                onClick={() => setShowAll(!showAll)}
                            >
                                {showAll ? "접기▲" : "더보기▼"}
                            </button>
                        )}
                    </div>

                    <div className="recipe-detail-footer">
                        <h4 className="recipe-detail-recommend-title">다른 추천 레시피</h4>
                        <button
                            className="recipe-detail-back-btn"
                            onClick={() => navigate("/recipe")}
                        >
                            목록으로
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ConfirmModal
                    message={
                        isAllDelete
                            ? "모든 재료를 삭제하시겠습니까?"
                            : `'${ingredients[targetIndex]?.name}'을(를) 삭제하시겠습니까?`
                    }
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
