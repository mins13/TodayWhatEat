// src/pages/recipe/RecipeDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import ConfirmModal from "../../components/Recipe/ConfirmModal";
import "./RecipeDetailPage.css";
import {
        addView,
        fetchLikeStatus,
        toggleLike,
        fetchRecipeDetail,
        fetchRecipeRecommendations,
    } from "../../api/recipeEngageApi";
 import { authHttp as http } from "../../api/http"; // 냉장고 API에 사용
import { createMyRecipe } from "../../api/myRecipeApi";

const IMG_PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
      <rect width='100%' height='100%' fill='#f2f2f2'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Arial' font-size='16' fill='#999'>이미지를 불러올 수 없습니다</text>
    </svg>`
    );

// 캐시 키/TTL
const TTL_MS = 1000 * 60 * 5; // 5분
const keyDetail = (id) => `rcp:detail:${id}`;
const keyRec = (id) => `rcp:rec:${id}`;

// 안전 파서
const safeJson = (s) => {
    try { return JSON.parse(s); } catch { return null; }
};

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

    // ---------- 1) 캐시 프리하이드레이션 ----------
    useEffect(() => {
        if (!recipeId) return;

        const cachedDetail = safeJson(sessionStorage.getItem(keyDetail(recipeId)));
        if (cachedDetail && Date.now() - (cachedDetail.ts || 0) < TTL_MS) {
            const data = cachedDetail.data || {};
            setRecipe(data);
            setViews(Number(data?.viewCount ?? 0));
            setLikes(Number(data?.likesCount ?? 0));
            const url = data?.image || data?.imageUrl || data?.thumbnail || null;
            setImgSrc(url || IMG_PLACEHOLDER);
            setIngredients(
                (data.ingredients || []).map((i) => ({
                    name: i?.name ?? "",
                    amount: i?.amount ?? "",
                }))
            );
            setSeasonings([]);
        }

        const cachedRec = safeJson(sessionStorage.getItem(keyRec(recipeId)));
        if (cachedRec && Date.now() - (cachedRec.ts || 0) < TTL_MS) {
            setRecommended(Array.isArray(cachedRec.data) ? cachedRec.data : []);
        }
    }, [recipeId]);

    // ---------- 2) 백그라운드 재검증 ----------
        useEffect(() => {
              if (!recipeId) return;
               (async () => {
                    try {
                          const [detail, recs] = await Promise.all([
                                fetchRecipeDetail(recipeId),
                                fetchRecipeRecommendations(recipeId, 3),
                              ]);
                              if (detail) {
                               setRecipe(detail);
                                setViews(Number(detail?.viewCount ?? 0));
                                setLikes(Number(detail?.likesCount ?? 0));
                                const url = detail?.image || detail?.imageUrl || detail?.thumbnail || null;
                                setImgSrc(url || IMG_PLACEHOLDER);
                                setIngredients(
                                      (detail.ingredients || []).map((i) => ({
                                            name: i?.name ?? "",
                                            amount: i?.amount ?? "",
                                      }))
                                );
                                setSeasonings([]);
                                sessionStorage.setItem(
                                      keyDetail(recipeId),
                                      JSON.stringify({ ts: Date.now(), data: detail })
                                    );
                              }
                              if (Array.isArray(recs)) {
                                setRecommended(recs);
                                sessionStorage.setItem(
                                      keyRec(recipeId),
                                      JSON.stringify({ ts: Date.now(), data: recs })
                                    );
                              }
                        } catch (e) {
                          console.error(e);
                        }
                  })();
            }, [recipeId]);

    // ---------- 3) 비-크리티컬 요청 지연(초기 페인트 후) ----------
    useEffect(() => {
        if (!recipeId) return;

        const run = () => {
            // 좋아요 상태/카운트
            fetchLikeStatus(recipeId)
                .then(({ liked, likes }) => {
                    setLiked(!!liked);
                    setLikes(Number(likes ?? 0));
                })
                .catch(() => { /* 비로그인 등 무시 */ });

            // 조회수 증가 (6시간 TTL 로컬키로 중복 방지)
            const key = `vw:${recipeId}`;
            const last = Number(localStorage.getItem(key) || 0);
            const now = Date.now();
            const TTL = 1000 * 60 * 60 * 6;
            if (!last || now - last > TTL) {
                addView(recipeId)
                    .then(({ views }) => setViews(Number(views ?? 0)))
                    .catch(() => {});
                localStorage.setItem(key, String(now));
            }
        };

        // idle에 실행 시도 → 없으면 타임아웃으로 폴백
        if ("requestIdleCallback" in window) {
            // @ts-ignore
            const id = window.requestIdleCallback(run, { timeout: 1200 });
            return () => window.cancelIdleCallback && window.cancelIdleCallback(id);
        } else {
            const t = setTimeout(run, 0);
            return () => clearTimeout(t);
        }
    }, [recipeId]);

    // 좋아요 토글
    const onClickLike = async (e) => {
        e.stopPropagation();
        if (likePending) return;
        setLikePending(true);
        try {
            const { liked, likes } = await toggleLike(recipeId);
            setLiked(!!liked);
            setLikes(Number(likes ?? 0));
        } catch {
            alert("좋아요 처리에 실패했어요. 로그인 상태를 확인해주세요.");
        } finally {
            setLikePending(false);
        }
    };

    // 텍스트에서 수량/단위 분리
    function splitAmount(str = "") {
        const s = String(str).trim();
        const m = s.match(/^([\d.]+)\s*(.*)$/);
        if (!m) return { value: 1, unit: "" };
        return { value: parseFloat(m[1]) || 1, unit: (m[2] || "").trim() };
    }

    // 냉장고 재고 조회/차감은 모달 확인 때만 호출 → 초기 로드에 영향 없음
    const normName = (s) => String(s ?? "").trim().toLowerCase();
    const parseQty = (v) => {
        if (typeof v === "number") return isFinite(v) ? v : 0;
        const m = String(v ?? "").trim().match(/-?\d+(?:\.\d+)?/);
        return m ? parseFloat(m[0]) : 0;
    };

    async function hasIngredientInfo(name) {
          // 인터셉터가 Authorization/쿠키 자동 처리
              const { data: list } = await http.get("/fridge/list");
        const target = normName(name);
        const same = (Array.isArray(list) ? list : []).filter(
            (it) => normName(it?.ingredientName) === target
        );
        const total = same.reduce((acc, it) => {
            const q = parseQty(it?.quantity);
            return q > 0 ? acc + q : acc;
        }, 0);
        return { exists: total > 0, total };
    }

    async function consumeItems(items) {
          const { data } = await http.patch("/fridge/consume", { items });
          return data;
        }

    const [pendingDefault, setPendingDefault] = useState({ amount: 1, unit: "개" });

    const handleConfirmDelete = async (amountFromModal, unitFromModal) => {
        try {
            if (isAllDelete) {
                const items = ingredients.map((ing) => {
                    const { value, unit } = splitAmount(ing.amount);
                    return {
                        name: ing.name,
                        amount: Number(value) || 1,
                        unit: unit || "",
                    };
                });
                await consumeItems(items);
                localStorage.setItem("fridgeDirty", String(Date.now()));
                window.dispatchEvent(new Event("fridge-dirty"));
                alert("모든 재료 차감 완료!");
            } else if (targetIndex != null) {
                const ing = ingredients[targetIndex];
                const { exists, total } = await hasIngredientInfo(ing.name);
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
                await consumeItems([{ name: ing.name, amount: reqAmount, unit: reqUnit }]);
                alert("재고 차감 완료!");
            }
        } catch (e) {
            console.error(e);
            alert("재고 차감 실패");
        } finally {
            setIsModalOpen(false);
        }
    };

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

    // 공개 레시피 → 나만의 레시피로 복사
    const addToMyRecipes = async () => {
        if (!recipe) return;
        try {
            const imageUrl = recipe.imageUrl || recipe.image || recipe.thumbnail || imgSrc || "";
            const ingPayload = (ingredients || []).map((ing, i) => {
                const { value, unit } = splitAmount(ing?.amount || "");
                return {
                    name: ing?.name || "",
                    quantity: Number.isFinite(value) ? value : 1,
                    unit: unit || "",
                    sortOrder: i + 1,
                };
            });
            const stepPayload = (steps || []).map((s, i) => ({
                content: s,
                sortOrder: i + 1,
            }));
            const payload = {
                title: recipe.title || "(제목 없음)",
                imageUrl,
                ingredients: ingPayload,
                steps: stepPayload,
            };
            const res = await createMyRecipe(payload);
            const newId = res?.id || res?.recipeId || res?.data?.id;
            if (newId) {
                alert("나만의 레시피에 추가되었습니다. 수정 화면으로 이동합니다.");
                navigate(`/recipe/my/${newId}/edit`);
            } else {
                alert("추가는 완료했지만 새 레시피 ID를 받지 못했어요. 내 레시피 목록으로 이동합니다.");
                navigate("/recipe/my");
            }
        } catch (e) {
            console.error(e);
            alert("나만의 레시피 추가에 실패했어요. 로그인 상태를 확인해주세요.");
        }
    };

    if (!recipe) {
        // 첫 진입에 캐시가 없을 때만 잠깐 보임
        return <div>로딩 중...</div>;
    }

    return (
        <div className="recipe-detail-container">
            <div className="recipe-detail-wrapper">
                <div className="recipe-detail-left-panel">
                    <RecipeSidebar />
                </div>

                <div className="recipe-detail-right-panel">
                    <div className="detail-head">
                        <h2 className="recipe-detail-title">{recipe.title}</h2>
                        <div className="detail-head-actions">
                            <button className="btn-outline" onClick={() => navigate("/recipe")}>
                                목록으로
                            </button>
                            <button className="btn-addmine" onClick={addToMyRecipes}>
                                나만의 레시피 추가
                            </button>
                        </div>
                    </div>

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
                            decoding="async"
                        />
                        <div className="recipe-detail-table-box">
                            <div className="recipe-detail-grid-title">재료</div>
                            <div className="recipe-detail-ingredients-grid">
                                {ingredients.length === 0 ? (
                                    <div className="recipe-detail-empty">등록된 재료가 없어요</div>
                                ) : (
                                    ingredients.map((ing, i) => (
                                        <div className="recipe-detail-ingredient-card" key={`${ing.name}-${i}`}>
                      <span className="recipe-detail-ingredient-name">
                        <span className="ingredient-name">{ing.name}</span>
                        <span className="ingredient-amount">{ing.amount}</span>
                      </span>
                                            <button className="recipe-detail-remove-btn" onClick={() => handleRemoveClick(i)}>
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
                            {steps.map((step, i) => (!showAll && i >= 3 ? null : <li key={i}>{step}</li>))}
                        </ol>

                        {steps.length > 3 && (
                            <button className="recipe-detail-show-more-btn" onClick={() => setShowAll(!showAll)}>
                                {showAll ? "접기▲" : "더보기▼"}
                            </button>
                        )}
                    </div>

                    <div className="recipe-detail-footer">
                        <h4 className="recipe-detail-recommend-title">다른 추천 레시피</h4>
                        <div className="recommend-list">
                            {recommended.map((r) => (
                                <div key={r.id} className="recommend-card" onClick={() => navigate(`/recipe/${r.id}`)}>
                                    <img
                                        src={r.imageUrl || r.image || r.thumbnail || IMG_PLACEHOLDER}
                                        alt={r.title}
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = IMG_PLACEHOLDER;
                                        }}
                                    />
                                    <p>{r.title}</p>
                                </div>
                            ))}
                            {!recommended.length && <div className="recipe-detail-empty">추천 레시피가 아직 없어요</div>}
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
                        isAllDelete ? "모든 재료를 차감하시겠습니까?" : `'${ingredients[targetIndex]?.name}'을(를) 얼마만큼 사용할까요?`
                    }
                    defaultAmount={pendingDefault.amount}
                    defaultUnit={pendingDefault.unit}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
