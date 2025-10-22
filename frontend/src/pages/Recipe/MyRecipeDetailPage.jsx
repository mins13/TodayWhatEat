// src/pages/Recipe/MyRecipeDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import {
    getMyRecipe,
    requestMyRecipeApproval,
    getMyRecipeApprovalStatus,
    deleteMyRecipe, // ✅ 추가
} from "../../api/myRecipeApi";
import "./MyRecipeDetailPage.css";
import useRequireAuth from "../../hooks/useRequireAuth";

const IMG_PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>
      <rect width='100%' height='100%' fill='#f2f2f2'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Arial' font-size='16' fill='#999'>이미지를 불러올 수 없습니다</text>
    </svg>`
    );

/** 인증 Wrapper */
export default function MyRecipeDetailPage() {
    const ready = useRequireAuth();
    if (!ready) return null;
    return <MyRecipeDetailPageInner />;
}

/** 실제 페이지 로직 */
function MyRecipeDetailPageInner() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [imgSrc, setImgSrc] = useState(IMG_PLACEHOLDER);
    const [showAll, setShowAll] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitPending, setSubmitPending] = useState(false);

    /** ✅ 서버 보관 승인상태 (새로고침해도 유지됨) */
    const [approval, setApproval] = useState(null); // {status, rejectionReason, draftId, updatedAt}

    // ✅ 제출 가능 여부
    const canSubmit = (rec) => {
        if (!rec) return false;
        const hasTitle = !!(rec.title && rec.title.trim());
        const hasImage = !!(rec.imageUrl && rec.imageUrl.trim());
        const hasIngredients =
            Array.isArray(rec.ingredients) && rec.ingredients.length > 0;
        const hasSteps = Array.isArray(rec.steps) && rec.steps.length > 0;
        return hasTitle && hasImage && hasIngredients && hasSteps;
    };

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await getMyRecipe(id);
                setData(res);
                setImgSrc(res?.imageUrl || IMG_PLACEHOLDER);
            } catch (e) {
                console.error(e);
                setData(null);
            }

            try {
                const st = await getMyRecipeApprovalStatus(id); // ★ 상태 로드
                setApproval(st);
            } catch {
                /* ignore */
            }
        })();
    }, [id]);

    const isPending = approval?.status === "PENDING";
    const isRejected = approval?.status === "REJECTED";
    const isApproved = approval?.status === "APPROVED";

    const onOpenSubmit = () => {
        if (!canSubmit(data)) {
            alert(
                "승인 신청을 하려면 제목/대표이미지/재료/레시피 단계가 모두 필요합니다."
            );
            return;
        }
        setShowSubmitModal(true);
    };

    const doSubmit = async () => {
        if (submitPending) return;
        setSubmitPending(true);
        try {
            await requestMyRecipeApproval(id); // ★ my-recipe id로 호출
            const st = await getMyRecipeApprovalStatus(id); // 상태 새로고침
            setApproval(st);
            setShowSubmitModal(false);
            alert("승인 신청이 접수되었습니다. 심사는 최대 7일 이상 소요될 수 있어요.");
        } catch (e) {
            alert(e?.message || "승인 신청에 실패했습니다.");
        } finally {
            setSubmitPending(false);
        }
    };

    // ✅ 삭제
    const doDelete = async () => {
        if (!window.confirm("정말 삭제하시겠어요? 복구할 수 없습니다.")) return;
        try {
            await deleteMyRecipe(id);
            alert("삭제되었습니다.");
            navigate("/recipe/my");
        } catch (e) {
            alert(e?.message || "삭제에 실패했습니다.");
        }
    };

    const ingredients = useMemo(() => {
        const list = data?.ingredients ?? [];
        return list
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((g) => ({
                name: g?.name ?? "",
                amount: [g?.quantity, g?.unit].filter(Boolean).join(" "),
            }));
    }, [data]);

    const steps = useMemo(() => {
        const list = data?.steps ?? [];
        return list
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) // ★ sortOrder 사용
            .map((s) => s?.content ?? "")
            .filter(Boolean);
    }, [data]);

    if (!data)
        return (
            <div className="main-container">
                <div className="community-wrapper">
                    <div className="right-panel">데이터를 불러오지 못했습니다.</div>
                </div>
            </div>
        );

    return (
        <div className="recipe-detail-container">
            <div className="recipe-detail-wrapper">
                <div className="recipe-detail-left-panel">
                    <RecipeSidebar />
                </div>

                <div className="recipe-detail-right-panel">
                    {/* ✅ 상태 배너 */}
                    {isRejected && (
                        <div className="banner danger" style={{ marginBottom: 12 }}>
                            <b>승인 반려됨</b> — 사유:{" "}
                            {approval?.rejectionReason || "형식 미흡"} / 수정 후 다시 신청해주세요.
                        </div>
                    )}
                    {isPending && (
                        <div className="banner info" style={{ marginBottom: 12 }}>
                            관리자 검토 중입니다. (승인 대기)
                        </div>
                    )}
                    {isApproved && (
                        <div className="banner success" style={{ marginBottom: 12 }}>
                            승인 완료! 전체 레시피에 반영되었습니다.
                        </div>
                    )}

                    {/* 헤더 버튼들 */}
                    <div className="detail-head">
                        <h2 className="recipe-detail-title">{data?.title || "제목 없음"}</h2>
                        <div className="detail-head-actions">
                            <button
                                className="btn-outline"
                                onClick={() => navigate("/recipe/my")}
                            >
                                목록으로
                            </button>

                            {/* ✅ 삭제 버튼 (필요 시 disabled 제거 가능) */}
                            <button
                                className="btn-danger"
                                onClick={doDelete}
                                disabled={isPending}
                                title={isPending ? "승인 대기 중에는 삭제할 수 없어요." : ""}
                            >
                                삭제
                            </button>

                            <button
                                className="btn-primary"
                                onClick={() => navigate(`/recipe/my/${id}/edit`)}
                                disabled={isPending}
                                title={isPending ? "승인 대기 중에는 수정할 수 없어요." : ""}
                            >
                                수정
                            </button>
                            <button
                                className="btn-approve"
                                onClick={onOpenSubmit}
                                disabled={isPending}
                                title={isPending ? "이미 승인 대기 중입니다." : ""}
                            >
                                승인 신청
                            </button>
                        </div>
                    </div>

                    {/* 이미지 + 재료표 */}
                    <div className="recipe-detail-top">
                        <img
                            src={imgSrc}
                            alt={data.title || "레시피 이미지"}
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
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 조리 단계 */}
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
                </div>

                {showSubmitModal && (
                    <div
                        className="approve-modal-backdrop"
                        onClick={() => !submitPending && setShowSubmitModal(false)}
                    >
                        <div
                            className="approve-modal-card"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>승인 신청 전 확인</h3>
                            <ul className="approve-bullets">
                                <li>
                                    레시피 <b>제목</b>, <b>대표 사진</b>, <b>재료</b>,{" "}
                                    <b>레시피 순서</b>가 모두 있어야 합니다.
                                </li>
                                <li>
                                    레시피 등록 승인 심사는 <b>최대 7일 이상</b> 소요될 수 있습니다.
                                </li>
                                <li>운영 정책에 맞지 않는 콘텐츠는 반려될 수 있습니다.</li>
                            </ul>
                            <div className="approve-actions">
                                <button
                                    className="btn-cancel"
                                    disabled={submitPending}
                                    onClick={() => setShowSubmitModal(false)}
                                >
                                    취소
                                </button>
                                <button
                                    className="btn-approve"
                                    disabled={submitPending}
                                    onClick={doSubmit}
                                >
                                    {submitPending ? "신청 중..." : "정말 승인 신청"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
