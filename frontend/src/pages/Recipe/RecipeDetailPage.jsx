import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import ConfirmModal from "../../components/Recipe/ConfirmModal";
import "./RecipeDetailPage.css";
import { addView, fetchLikeStatus, toggleLike } from "../../api/recipeEngageApi";

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
    const [seasonings, setSeasonings] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllDelete, setIsAllDelete] = useState(false);
    const [targetIndex, setTargetIndex] = useState(null);
    const [imgSrc, setImgSrc] = useState(IMG_PLACEHOLDER);
    const [recommended, setRecommended] = useState([]);
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [views, setViews] = useState(0);
    const [likePending, setLikePending] = useState(false);

    useEffect(() => {
        if (!recipeId) return;

        // 좋아요 상태/카운트 로드
        (async () => {
            try {
                const { liked, likes } = await fetchLikeStatus(recipeId);
                setLiked(liked);
                setLikes(likes);
            } catch (e) {
                // 비로그인(401)일 수 있음: 무시하거나 안내
                // console.warn(e);
            }
        })();

        // 조회수 1회 처리 (브라우저당/레시피별)
        const key = `vw:${recipeId}`;
        const last = Number(localStorage.getItem(key) || 0);
        const now = Date.now();
        const TTL = 1000 * 60 * 60 * 6; // 6시간 안에 또 들어오면 +1 안함 (임의)
        if (!last || now - last > TTL) {
            addView(recipeId)
                .then(({ views }) => setViews(views))
                .catch(() => { /* 비로그인 등 무시 가능 */ });
            localStorage.setItem(key, String(now));
        }
    }, [recipeId]);

    const onClickLike = async (e) => {
        e.stopPropagation();
        if (likePending) return;
        setLikePending(true);
        try {
            const { liked, likes } = await toggleLike(recipeId);
            setLiked(liked);
            setLikes(likes);
        } catch (e) {
            alert("좋아요 처리에 실패했어요. 로그인 상태를 확인해주세요.");
        } finally {
            setLikePending(false);
        }
    };



    function splitAmount(str = "") {
        const s = String(str).trim();
        const m = s.match(/^([\d.]+)\s*(.*)$/);
        if (!m) return { value: 1, unit: "" };
        return { value: parseFloat(m[1]) || 1, unit: (m[2] || "").trim() };
    }
    // 이름/상태 정규화 유틸 (파일 상단 util들 근처에 추가)
    const normName = (s) => String(s ?? "").trim().toLowerCase();
    const parseQty = (v) => {
        if (typeof v === "number") return isFinite(v) ? v : 0;
        const m = String(v ?? "").trim().match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : 0;
    };

// 냉장고 재고 조회: 이름이 같고, USED/0개는 제외하여 총 보유량 계산
    async function hasIngredientInfo(name) {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/fridge/list", {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return { exists: false, total: 0 };

        const list = await res.json();
        const target = normName(name);

        const same = (Array.isArray(list) ? list : []).filter(
            (it) => normName(it?.ingredientName) === target
        );

        // 🔑 상태(status)는 무시하고, 수량이 0보다 큰 것만 합산
        const total = same.reduce((acc, it) => {
            const q = parseQty(it?.quantity);
            return q > 0 ? acc + q : acc;
        }, 0);

        // 디버깅 원하면 유지
        console.log("[hasIngredientInfo]", { name, target, same, total });

        return { exists: total > 0, total };
    }

    async function consumeItems(items) {
        console.log("Sending the following items to the server:", items);
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/fridge/consume", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ items }),
        });
        if (!res.ok) {
            const errorData = await res.json(); // 서버의 오류 메시지 확인
            console.error("Error details:", errorData);
            throw new Error("재고 차감 실패");
        }
        return await res.json();
    }

    const [pendingDefault, setPendingDefault] = useState({ amount: 1, unit: "개" });
    // ---- helpers -------------------------------------------------
    function parseAmount(str = "") {
        // "30g", "1.5 L", "5 개" → { value: 30, unit: "g" } 등
        const s = String(str).trim();
        const m = s.match(/^([\d.]+)\s*(.*)$/);
        if (!m) return { value: 1, unit: "" };
        return { value: parseFloat(m[1]), unit: (m[2] || "").trim() };
    }



    const handleConfirmDelete = async (amountFromModal, unitFromModal) => {
        try {
            if (isAllDelete) {
                // 전체 차감 로직
                const items = ingredients.map(ing => {
                    const { value, unit } = splitAmount(ing.amount);
                    return {
                        name: ing.name,
                        amount: Number(value) || 1,
                        unit: unit || ""
                    };
                });

                await consumeItems(items);
                localStorage.setItem("fridgeDirty", String(Date.now()));
                window.dispatchEvent(new Event("fridge-dirty"));
                alert("모든 재료 차감 완료!");
            } else if (targetIndex != null) {
                const ing = ingredients[targetIndex];
                const { exists, total } = await hasIngredientInfo(ing.name);

                // 수량이 0일 경우 "냉장고에 없습니다." 메시지 표시
                if (!exists) {
                    alert(`냉장고에 '${ing.name}'이(가) 없습니다.`);
                    return;
                }

                const reqAmount = Number(amountFromModal) || 1;
                if (reqAmount > total) {
                    alert(`'${ing.name}'의 수량이 부족합니다. (보유: ${total})`);
                    return;
                }
                const reqUnit = unitFromModal || "";

                // 차감 요청
                await consumeItems([{ name: ing.name, amount: reqAmount, unit: reqUnit }]);

                alert("재고 차감 완료!");
            }
        } catch (e) {
               console.error(e);
               const msg = String(e?.message || "");
               if (/(없습|해당 재료가 없습니다)/.test(msg)) {
                     alert(`냉장고에 '${ingredients[targetIndex]?.name}'이(가) 없습니다.`);
                   } else if (/수량.*부족/.test(msg)) {
                     alert(`'${ingredients[targetIndex]?.name}'의 수량이 부족합니다.`);
                   } else {
                     alert("재고 차감 실패");
                   }
             } finally {
            setIsModalOpen(false);
        }
    };





    // -------------------------------------------------------------

    useEffect(() => {
        if (!recipeId) return;
        const ac = new AbortController();

        (async () => {
            try {
                const [recipeRes, recRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/recipes/${recipeId}`, { signal: ac.signal }),
                    fetch(`http://localhost:8080/api/recipes/${recipeId}/recommendations?limit=3`, { signal: ac.signal }),
                ]);

                if (!recipeRes.ok) throw new Error("recipe fetch failed");
                const data = await recipeRes.json();
                setRecipe(data);
                setViews(Number(data?.viewCount ?? 0));
                setLikes(Number(data?.likesCount ?? 0));

                const url = data?.image || data?.imageUrl || data?.thumbnail || null;
                setImgSrc(url || IMG_PLACEHOLDER);

                setIngredients((data.ingredients || []).map((i) => ({
                    name: i?.name ?? "",
                    amount: i?.amount ?? "", // "30g", "5개" 등 그대로 표시
                })));

                setSeasonings([]);

                const recData = recRes.ok ? await recRes.json() : [];
                setRecommended(Array.isArray(recData) ? recData : []);
            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            }
        })();

        return () => ac.abort();
    }, [recipeId]);

    const steps = useMemo(() => {
        if (!recipe) return [];
        let raw = recipe.instructions ?? recipe.steps ?? recipe.description ?? recipe.content ?? "";
        if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
        if (typeof raw === "string") {
            const withoutTags = raw
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/p>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .replace(/\r/g, "");
            const splitted = withoutTags
                .split(/\n+/)
                .flatMap((line) => line.split(/\s*\d+[.)-]\s+/))
                .map((s) => s.trim())
                .filter(Boolean);
            return splitted.length ? splitted : withoutTags.trim() ? [withoutTags.trim()] : [];
        }
        return [];
    }, [recipe]);

    const handleRemoveClick = (index) => {
        setTargetIndex(index);
        setIsAllDelete(false);

        const ing = ingredients[index];
        const { value, unit } = splitAmount(ing?.amount ?? "");
        setPendingDefault({
            amount: Number.isFinite(value) && value > 0 ? value : 1,
            unit: unit || "개",
        });

        setIsModalOpen(true);
    };



    if (!recipe) return <div>로딩 중...</div>;






    return (
        <div className="recipe-detail-container">
            <div className="recipe-detail-wrapper">
                <div className="recipe-detail-left-panel">
                    <RecipeSidebar />
                </div>

                <div className="recipe-detail-right-panel">
                    <h2 className="recipe-detail-title">{recipe.title}</h2>
                    <div className="recipe-detail-stats">
                        <button
                            className={`like-btn ${liked ? "liked" : ""}`}
                            onClick={onClickLike}
                            disabled={likePending}
                            aria-pressed={liked}
                            title={liked ? "좋아요 취소" : "좋아요"}
                        >
                            ♥
                        </button>
                        <span className="like-count">{likes}</span>
                        <span className="view-count">조회 {views}</span>
                    </div>


                    <div className="recipe-detail-top">
                        <img
                            src={imgSrc}
                            alt={recipe.title || "레시피 이미지"}
                            className="recipe-detail-image"
                            onError={() => setImgSrc(IMG_PLACEHOLDER)}
                            loading="lazy"
                        />

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


                        </div>
                    </div>

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
                            {recommended.map((r) => (
                                <div key={r.id} className="recommend-card" onClick={() => navigate(`/recipe/${r.id}`)}>
                                    <img src={r.imageUrl || IMG_PLACEHOLDER} alt={r.title} loading="lazy" />
                                    <p>{r.title}</p>
                                </div>
                            ))}
                        </div>
                        <button className="recipe-detail-back-btn" onClick={() => navigate("/recipe")}>
                            목록으로
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <ConfirmModal
                    message={
                        isAllDelete
                            ? "모든 재료를 차감하시겠습니까?"
                            : `'${ingredients[targetIndex]?.name}'을(를) 얼마만큼 사용할까요?`
                    }
                    defaultAmount={pendingDefault.amount}
                    defaultUnit={pendingDefault.unit}
                    onConfirm={handleConfirmDelete}          // (amount, unit) 전달받음
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
