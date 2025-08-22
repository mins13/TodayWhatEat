import React from "react";
import "./MyFridgeModal.css";

function MyFridgeModal({ events, onClose }) {
    const merged = {};

    events
        .filter(e => !e.usedUpAt && Number(e.count) > 0)
        .forEach((item) => {
            const key = `${item.title}__${item.unit || "개"}`;
            if (!merged[key]) {
                merged[key] = {
                    title: item.title,
                    unit: item.unit || "개",
                    total: 0,
                    details: [],
                };
            }
            merged[key].total += Number(item.count) || 0;
            merged[key].details.push({
                date: item.purchaseDate,
                count: Number(item.count) || 0,
                unit: item.unit || "개",
                expireDate: item.expireDate,
            });
        });

    // total이 0인 건 숨김
    const entries = Object.entries(merged).filter(([, v]) => v.total > 0);

    return (
        <div className="modal-overlay">
            <div className="modal-content fridge-modal">
                <h2>🥕 나의 냉장고</h2>
                <div className="fridge-item-list">
                    {entries.length === 0 ? (
                        <div className="empty">표시할 재료가 없습니다.</div>
                    ) : (
                        entries.map(([key, data], idx) => (
                            <div key={idx} className="fridge-item">
                                <strong>{data.title}</strong> - 총 {data.total}{data.unit}
                                <details>
                                    <summary>자세히 보기</summary>
                                    <ul>
                                        {data.details.map((d, i) => (
                                            <li key={i}>
                                                {d.date} 구매 ({d.count}{d.unit}) - 유통기한: {d.expireDate}
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            </div>
                        ))
                    )}
                </div>
                <div className="close-btn-wrapper">
                    <button className="close-btn" onClick={onClose}>닫기</button>
                </div>
            </div>
        </div>
    );
}

export default MyFridgeModal;
