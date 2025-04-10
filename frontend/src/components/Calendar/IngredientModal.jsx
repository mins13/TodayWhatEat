import React, { useState, useEffect } from "react";
import "./IngredientModal.css";

function IngredientModal({ date, initialData = {}, onClose, onSave }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(date);
    const [expireDate, setExpireDate] = useState("");
    const [color, setColor] = useState("#f59e0b");
    const [notes, setNotes] = useState("");

    const isEdit = initialData && Object.keys(initialData).length > 0;

    useEffect(() => {
        if (isEdit) {
            setTitle(initialData.title || "");
            setCategory(initialData.category || "");
            setPurchaseDate(initialData.purchaseDate || date);
            setExpireDate(initialData.expireDate || "");
            setColor(initialData.color || "#f59e0b");
            setNotes(initialData.notes || "");
        }
    }, [initialData, date]);

    const handleSubmit = () => {
        const newEvent = {
            title,
            category,
            purchaseDate,
            expireDate,
            color,
            notes,
            date: purchaseDate,
        };
        onSave(newEvent);
        onClose();
    };

    const formatDate = (d) => {
        const obj = new Date(d);
        return `${obj.getFullYear()}년 ${obj.getMonth() + 1}월 ${obj.getDate()}일`;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{formatDate(date)} {isEdit ? "재료 수정" : "재료 등록"}</h3>

                <input
                    type="text"
                    placeholder="재료명"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="구분 (예: 채소, 유제품)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                />

                <label>구매일:</label>
                <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                />

                <label>유통기한:</label>
                <input
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                />

                <label>색상:</label>
                <div className="color-options">
                    {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a855f7"].map((c) => (
                        <button
                            key={c}
                            className={`color-dot ${color === c ? "selected" : ""}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>

                <textarea
                    placeholder="메모"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <div className="modal-buttons">
                    <button onClick={handleSubmit}>저장</button>
                    <button onClick={onClose}>취소</button>
                </div>
            </div>
        </div>
    );
}

export default IngredientModal;
