import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchDraftById, approveDraft, rejectDraft } from "../../api/adminRecipeDraftApi";
import "./admin.css";

const IMG_FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
       <defs>
         <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
           <stop offset='0%' stop-color='#f5f5f5'/>
           <stop offset='100%' stop-color='#eaeaea'/>
         </linearGradient>
       </defs>
       <rect width='100%' height='100%' fill='url(#g)'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
         font-family='Arial' font-size='22' fill='#999'>이미지가 없습니다</text>
     </svg>`
    );

export default function RecipeApprovalDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [d, setD] = useState(null);
    const [img, setImg] = useState(IMG_FALLBACK);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            const draft = await fetchDraftById(id);
            setD(draft);
            setImg(draft?.imageUrl || IMG_FALLBACK);
        })();
    }, [id]);

    const ingredients = useMemo(() => {
        if (!d?.ingredients) return [];
        return d.ingredients
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((i) => ({
                id: i.id,
                left: i.name || "",
                right: [i.quantity, i.unit].filter(Boolean).join(" "),
            }));
    }, [d]);

    const steps = useMemo(() => {
        if (!d?.steps) return [];
        return d.steps
            .slice()
            .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
            .map((s) => s.content || "");
    }, [d]);

    if (!d) {
        return (
            <div className="ra-container">
                <div className="ra-grid">
                    <div className="ra-left">
                        <div className="ra-skeleton-img" />
                        <div className="ra-skeleton-block" />
                        <div className="ra-skeleton-block" />
                    </div>
                    <aside className="ra-right">
                        <div className="ra-skeleton-btn" />
                        <div className="ra-skeleton-input" />
                        <div className="ra-skeleton-btn" />
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="ra-container">
            <div className="ra-breadcrumb">
                <span className="muted">관리자</span>
                <span> / </span>
                <span className="muted">레시피 승인</span>
                <span> / 상세</span>
            </div>

            <h2 className="ra-title">
                승인 대기 상세 <span className="id">#{d.id}</span>
            </h2>

            <div className="ra-grid">
                {/* LEFT */}
                <div className="ra-left">
                    <div className="ra-hero">
                        <img
                            src={img}
                            alt={d.title || "승인 레시피 이미지"}
                            onError={() => setImg(IMG_FALLBACK)}
                        />
                        <div className="ra-hero-overlay">
                            <div className="ra-hero-title">{d.title || "제목 없음"}</div>
                        </div>
                    </div>

                    {d.description && (
                        <div className="ra-desc" title={d.description}>
                            {d.description}
                        </div>
                    )}

                    {Array.isArray(d.tags) && d.tags.length > 0 && (
                        <div className="ra-tags">
                            {d.tags.map((t, idx) => (
                                <span className="tag" key={idx}>
                  #{t}
                </span>
                            ))}
                        </div>
                    )}

                    <section className="ra-section">
                        <h3 className="ra-sec-title">재료</h3>
                        {ingredients.length === 0 ? (
                            <div className="ra-empty">등록된 재료가 없습니다.</div>
                        ) : (
                            <div className="ra-chips">
                                {ingredients.map((g) => (
                                    <div className="chip" key={g.id}>
                                        <span className="chip-left">{g.left}</span>
                                        {g.right && <span className="chip-right">{g.right}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="ra-section">
                        <h3 className="ra-sec-title">레시피</h3>
                        {steps.length === 0 ? (
                            <div className="ra-empty">등록된 단계가 없습니다.</div>
                        ) : (
                            <ol className="ra-steps">
                                {steps.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                        )}
                    </section>
                </div>

                {/* RIGHT (sticky actions) */}
                <aside className="ra-right">
                    <button
                        className="btn approve"
                        disabled={submitting}
                        onClick={async () => {
                            if (!window.confirm("이 초안을 승인하시겠습니까?")) return;
                            setSubmitting(true);
                            try {
                                await approveDraft(d.id);
                                alert("승인 완료: 전체 레시피에 반영되었습니다.");
                                navigate("/admin/approvals/recipes");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        승인
                    </button>

                    <textarea
                        className="reason"
                        placeholder="반려 사유 (선택)"
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />

                    <button
                        className="btn reject"
                        disabled={submitting}
                        onClick={async () => {
                            if (!window.confirm("이 초안을 반려하시겠습니까?")) return;
                            setSubmitting(true);
                            try {
                                await rejectDraft(d.id, reason || "형식 미흡");
                                alert("반려 처리되었습니다.");
                                navigate("/admin/approvals/recipes");
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                        반려
                    </button>

                    <button className="btn ghost" onClick={() => navigate(-1)}>
                        목록으로
                    </button>
                </aside>
            </div>
        </div>
    );
}
