import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import ConfirmModal from "../../components/Recipe/ConfirmModal"; // ✅ 모달 임포트
import "./RecipeDetailPage.css";

export default function RecipeDetailPage() {
    const { recipeId } = useParams();
    const navigate = useNavigate();

    const [ingredients, setIngredients] = useState([
        { name: "애호박", quantity: "1개" },
        { name: "양파", quantity: "1개" },
        { name: "대파", quantity: "1개" },
        { name: "돼지고기 목살", quantity: "400g" },
    ]);

    const [seasonings] = useState([
        { name: "후추", quantity: "1T" },
        { name: "다진마늘", quantity: "1T" },
        { name: "고춧가루", quantity: "3T" },
        { name: "액젓", quantity: "1T" },
    ]);

    const [showAll, setShowAll] = useState(false);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllDelete, setIsAllDelete] = useState(false);
    const [targetIndex, setTargetIndex] = useState(null);

    const recipe = {
        id: recipeId,
        title: "애호박 찌개",
        image: "/sample2.jpg",
        instructions: [
            "돼지고기 목살을 6등분 해주세요. 기름이 많을 경우 키친타올로 살짝 눌러 기름을 제거합니다.",
            "볼에 간장 1T, 집간장 1T, 고춧가루 2T, 생강즙, 후추, 마늘을 넣고 고기를 20~30분간 재워주세요.",
            "애호박, 양파, 대파는 적당한 크기로 썰어줍니다. 애호박은 반달 모양, 양파는 굵직하게.",
            "냄비에 기름을 두르고 재워둔 고기를 볶다가 야채와 물을 넣어 끓입니다.",
            "마지막에 간을 보고 액젓과 후추를 추가해서 간을 조절하세요.",
            "대파는 반은 어슷썰고 반은 쫑쫑 썰어서 풍미를 살려 마무리합니다.",
        ],
    };

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
