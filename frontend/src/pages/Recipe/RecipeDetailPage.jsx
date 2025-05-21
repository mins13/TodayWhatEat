import { useParams, useNavigate } from "react-router-dom";
import React from "react";
import "./RecipeDetailPage.css";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";

export default function RecipeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 임시 데이터
    const recipe = {
        id: id,
        title: "애호박 찌개",
        image: "/assets/recipe_sample.jpg", // 이미지 경로는 실제로 맞게
        ingredients: [
            { name: "애호박", amount: "1개" },
            { name: "양파", amount: "1개" },
            { name: "대파", amount: "1개" },
            { name: "돼지고기", amount: "400g" },
        ],
        subIngredients: [
            { name: "후추", amount: "1T" },
            { name: "다진마늘", amount: "1T" },
            { name: "고춧가루", amount: "3T" },
            { name: "액젓", amount: "1T" },
        ],
        steps: [
            "돼지고기 목살을 6등분 해주세요.",
            "양념 재료를 넣고 20~30분 전에 재워주세요.",
            "대파를 반으로 나누고 썰어주세요.",
        ],
    };

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel">
                    <RecipeSidebar />
                </div>

                <div className="right-panel">
                    <div className="detail-header">
                        <h2 className="detail-title">{recipe.title}</h2>
                        <button className="back-btn" onClick={() => navigate(-1)}>목록으로</button>
                    </div>
                    <hr />
                    <div className="detail-body">
                        <img src={recipe.image} alt={recipe.title} className="detail-image" />
                        <table className="ingredient-table">
                            <thead>
                            <tr><th>재료</th><th>조미료</th></tr>
                            </thead>
                            <tbody>
                            {recipe.ingredients.map((ing, i) => (
                                <tr key={i}>
                                    <td>{ing.name} {ing.amount}</td>
                                    <td>{recipe.subIngredients[i] ? `${recipe.subIngredients[i].name} ${recipe.subIngredients[i].amount}` : ""}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="recipe-steps">
                            <h4>레시피</h4>
                            <ol>
                                {recipe.steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
