import React, { useEffect, useState } from "react";
import { fetchMyRecipeSummaries } from "../../api/communityApi.js";
import "./RecipeSelectModal.css";

export default function RecipeSelectModal({ onClose, onSelect }) {
    const [items, setItems] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const list = await fetchMyRecipeSummaries();
                setItems(list || []);
            } catch (e) {
                console.error(e);
                setError("내 레시피를 불러오지 못했습니다.");
            }
        })();
    }, []);

    return (
        <div className="rsm-backdrop" onClick={onClose}>
            <div className="rsm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rsm-head">
                    <h3>나만의 레시피 선택</h3>
                    <button className="rsm-close" onClick={onClose}>×</button>
                </div>
                {!items ? (
                    <div className="rsm-loading">{error || "불러오는 중..."}</div>
                ) : items.length === 0 ? (
                    <div className="rsm-empty">등록한 나만의 레시피가 없습니다.</div>
                ) : (
                    <div className="rsm-grid">
                        {items.map(it => (
                            <button key={it.id} className="rsm-card" onClick={() => onSelect(it)}>
                                <img src={it.mainImageUrl} alt="" />
                                <div className="rsm-info">
                                    <b className="ellipsis-2">{it.title}</b>
                                    <span>❤ {it.likeCount ?? 0} · 조회 {it.viewCount ?? 0}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
