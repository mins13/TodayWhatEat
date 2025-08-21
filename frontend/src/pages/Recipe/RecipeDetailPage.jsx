import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import ConfirmModal from "../../components/Recipe/ConfirmModal";
import "./RecipeDetailPage.css";

const IMG_PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
      <rect width='100%' height='100%' fill='#f2f2f2'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Arial' font-size='16' fill='#999'>이미지를 불러올 수 없습니다</text>
    </svg>`
    );

export default function RecipeDetailPage() {
    const { recipeId } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [seasonings, setSeasonings] = useState([]); // 유지하되 미사용
    const [showAll, setShowAll] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllDelete, setIsAllDelete] = useState(false);
    const [targetIndex, setTargetIndex] = useState(null);
    const [imgSrc, setImgSrc] = useState(IMG_PLACEHOLDER); // ✅ 이미지 상태 추가
    const [recommended, setRecommended] = useState([]);


    console.log("✅ recipeId:", recipeId);

    useEffect(() => {
        if (!recipeId) return;

        const ac = new AbortController();

        (async () => {
            try {
                // 두 요청을 병렬로
                const [recipeRes, recRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/recipes/${recipeId}`, { signal: ac.signal }),
                    fetch(`http://localhost:8080/api/recipes/${recipeId}/recommendations?limit=3`, { signal: ac.signal }),
                ]);

                // --- 레시피 ---
                if (!recipeRes.ok) throw new Error("recipe fetch failed");
                const data = await recipeRes.json();

                setRecipe(data);

                const url = data?.image || data?.imageUrl || data?.thumbnail || null;
                setImgSrc(url || IMG_PLACEHOLDER);

                setIngredients((data.ingredients || []).map(i => ({
                    name: i?.name ?? "",
                    amount: i?.amount ?? "",
                })));

                setSeasonings([]); // 사용 안함 유지

                // --- 추천 ---
                const recData = recRes.ok ? await recRes.json() : [];
                setRecommended(Array.isArray(recData) ? recData : []);

            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            }
        })();

        return () => ac.abort(); // recipeId 바뀌거나 언마운트 시 취소
    }, [recipeId]);

    // ✅ 레시피 설명: 문자열/배열 모두 대응
    const steps = useMemo(() => {
        if (!recipe) return [];
        let raw = recipe.instructions ?? recipe.steps ?? recipe.description ?? recipe.content ?? "";
        if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean);
        if (typeof raw === "string") {
            const withoutTags = raw
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .replace(/\r/g, "");
            const splitted = withoutTags
                .split(/\n+/)
                .flatMap(line => line.split(/\s*\d+[.)-]\s+/))
                .map(s => s.trim())
                .filter(Boolean);
            return splitted.length ? splitted : (withoutTags.trim() ? [withoutTags.trim()] : []);
        }
        return [];
    }, [recipe]);

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
        if (isAllDelete) {
            setIngredients([]);
        } else if (targetIndex != null) {
            setIngredients(prev => prev.filter((_, i) => i !== targetIndex));
        }
        setIsModalOpen(false);
    };

    if (!recipe) {
        return <div>로딩 중...</div>;
    }

    return (
        <div className="recipe-detail-container">
            <div className="recipe-detail-wrapper">
                <div className="recipe-detail-left-panel">
                    <RecipeSidebar />
                </div>

                <div className="recipe-detail-right-panel">
                    <h2 className="recipe-detail-title">{recipe.title}</h2>

                    <div className="recipe-detail-top">
                        {/* ✅ 이미지 깨짐 방지 */}
                        <img
                            src={imgSrc}
                            alt={recipe.title || "레시피 이미지"}
                            className="recipe-detail-image"
                            onError={() => setImgSrc(IMG_PLACEHOLDER)}
                            loading="lazy"
                        />

                        {/* ✅ 조미료 칸 삭제 → 재료 그리드 카드 */}
                        <div className="recipe-detail-table-box">
                            <div className="recipe-detail-grid-title">재료</div>

                            <div className="recipe-detail-ingredients-grid">
                                {ingredients.length === 0 ? (
                                    <div className="recipe-detail-empty">등록된 재료가 없어요</div>
                                ) : (
                                    ingredients.map((ing, i) => (
                                        <div className="recipe-detail-ingredient-card" key={i}>
                                            <span className="recipe-detail-ingredient-name">
                                                <span className="ingredient-name">{ing.name}</span>
                                                <span className="ingredient-amount">{ing.amount}</span>
                                            </span>
                                            <button
                                                className="recipe-detail-remove-btn"
                                                onClick={() => handleRemoveClick(i)}
                                            >
                                                재료 삭제
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* 전체 삭제 */}
                            {ingredients.length > 0 && (
                                <div className="recipe-detail-remove-all-wrapper">
                                    <button
                                        className="recipe-detail-remove-all-btn"
                                        onClick={handleRemoveAllClick}
                                    >
                                        재료 전체 삭제
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ✅ 레시피 설명 */}
                    <div className="recipe-detail-description">
                        <h4>레시피</h4>
                        <ol>
                            {steps.map((step, i) =>
                                !showAll && i >= 3 ? null : <li key={i}>{step}</li>
                            )}
                        </ol>

                        {steps.length > 3 && (
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
                        <div className="recommend-list">
                            {recommended.map(r => (
                                <div key={r.id} className="recommend-card" onClick={() => navigate(`/recipe/${r.id}`)}>
                                    <img src={r.imageUrl || IMG_PLACEHOLDER} alt={r.title} loading="lazy" />
                                    <p>{r.title}</p>
                                </div>
                            ))}
                        </div>
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
