import React, { useState } from "react";
import "./IngredientListModal.css";

function IngredientListModal({ date, items, onClose }) {
    const formatDate = (d) => {
        const obj = new Date(d);
        return `${obj.getFullYear()}년 ${obj.getMonth() + 1}월 ${obj.getDate()}일`;
    };

    const [expandedIndices, setExpandedIndices] = useState({});

    const toggleExpand = (index) => {
        setExpandedIndices((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content list-modal">
                <h3>{formatDate(date)}의 재료 목록</h3>

                {items.length > 0 ? (
                    <ul className="ingredient-list">
                        {items.map((item, idx) => {
                            const isExpanded = expandedIndices[idx];
                            const memo = item.notes || "없음";
                            const shouldShowToggle = memo.length > 100;

                            return (
                                <li
                                    key={idx}
                                    className={`ingredient-item ${isExpanded ? "expanded" : ""}`}
                                >
                                    <div className="ingredient-content">
                                        <div className="ingredient-title" style={{ color: item.color }}>
                                            {item.title} - {item.count}
                                            {item.unit && item.unit !== "개" ? item.unit : "개"}
                                        </div>
                                        <div className="ingredient-sub">
                                            <span>구분: {item.category}</span><br />
                                            <span>유통기한: {item.expireDate}</span><br />
                                            <span>
                                                메모:{" "}
                                                {shouldShowToggle && !isExpanded
                                                    ? `${memo.slice(0, 10)}...`
                                                    : memo}
                                            </span>
                                        </div>
                                    </div>
                                    {shouldShowToggle && (
                                        <button className="expand-btn" onClick={() => toggleExpand(idx)}>
                                            {isExpanded ? "접기 ▲" : "더보기 ▼"}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="empty">등록된 재료가 없습니다.</p>
                )}

                <div className="modal-buttons-wrapper">
                    <div className="modal-buttons">
                        <button onClick={onClose}>닫기</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IngredientListModal;
