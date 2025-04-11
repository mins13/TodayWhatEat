import React from "react";
import "./MyFridgeModal.css";

function MyFridgeModal({ events, onClose }) {
    const merged = {};

    events.forEach((item) => {
        const key = `${item.title}__${item.unit || "개"}`; // ✅ title + unit 조합 키
        if (!merged[key]) {
            merged[key] = {
                title: item.title,
                unit: item.unit || "개",
                total: 0,
                details: [],
            };
        }

        merged[key].total += item.count || 1;
        merged[key].details.push({
            date: item.purchaseDate,
            count: item.count || 1,
            unit: item.unit || "개",
            expireDate: item.expireDate,
        });
    });

    return (
        <div className="modal-overlay">
            <div className="modal-content fridge-modal">
                <h2>🥕 나의 냉장고</h2>
                <div className="fridge-item-list">
                    {Object.entries(merged).map(([key, data], idx) => (
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
                    ))}
                </div>
                    <div className="close-btn-wrapper">
                        <button className="close-btn" onClick={onClose}>닫기</button>
                    </div>
            </div>
        </div>
    );
}

export default MyFridgeModal;
