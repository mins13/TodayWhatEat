import React, { useState } from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    const [amount, setAmount] = useState(1);
    const [unit, setUnit] = useState("개"); // 기본 단위

    const handleConfirm = () => {
        // 부모에서 onConfirm(amount, unit)으로 받을 수 있음
        onConfirm(amount, unit);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <p>{message}</p>

                {/* 수량 입력 */}
                <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    style={{ width: "80px", marginRight: "8px" }}
                />

                {/* 단위 선택 */}
                <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{ marginBottom: "12px" }}
                >
                    <option value="개">개</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="컵">컵</option>
                </select>

                <div className="modal-buttons">
                    <button className="confirm-btn" onClick={handleConfirm}>확인</button>
                    <button className="cancel-btn" onClick={onCancel}>취소</button>
                </div>
            </div>
        </div>
    );
}
