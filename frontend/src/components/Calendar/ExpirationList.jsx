import React from "react";
import "./ExpirationList.css"; // ✅ CSS 파일 연결

function ExpirationList({ items }) {
    return (
        <div className="expiration-list-container">
            <h3>유통기한 임박 재료</h3>
            {items.length > 0 ? (
                <ul>
                    {items.map((item, index) => (
                        <li
                            key={index}
                            className="expiration-item"
                            style={{
                                backgroundColor: item.remainingDays <= 2 ? "#ffc9c9" : "#ffe7cc",
                            }}
                        >
                            <span className="name">{item.title}</span>
                            <span className="days">{item.remainingDays}일 남음</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty">유통기한 임박한 재료가 없습니다.</p>
            )}
        </div>
    );
}

export default ExpirationList;
