import React, { useState, useEffect } from "react";
import "./IngredientModal.css";

function IngredientModal({ date, initialData = {}, onClose, onSave ,onDelete}) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(date);
    const [expireDate, setExpireDate] = useState("");
    const [color, setColor] = useState("#f59e0b");
    const [notes, setNotes] = useState("");
    const [count, setCount] = useState(1);
    const [unit, setUnit] = useState("개");



    const isEdit = initialData && Object.keys(initialData).length > 0;

    useEffect(() => {
        if (isEdit) {
            setTitle(initialData.title || "");
            setCategory(initialData.category || "");
            setPurchaseDate(initialData.purchaseDate || date);
            setExpireDate(initialData.expireDate || "");
            setColor(initialData.color || "#f59e0b");
            setNotes(initialData.notes || "");
            setCount(initialData.count || 1);
            setUnit(initialData.unit || "개");

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
            count,
            unit,
            date: purchaseDate,
        };
        onSave(newEvent);
        onClose();
    };

    const formatDate = (d) => {
        const obj = new Date(d);
        return `${obj.getFullYear()}년 ${obj.getMonth() + 1}월 ${obj.getDate()}일`;
    };

    const handleDelete = () => {
        if (window.confirm("정말 삭제하시겠습니까?")) {
            onDelete(initialData); // 상위에서 삭제 처리
            onClose();
        }
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

                <label>수량:</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
                    <input
                        type="number"
                        min="1"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        style={{ width: "100px" }}
                    />
                    <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                        <option value="개">개</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="컵">컵</option>
                    </select>
                </div>

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
                    {isEdit && (
                        <button className="delete-btn" onClick={handleDelete}>삭제</button>
                    )}

                </div>
            </div>
        </div>
    );
}

export default IngredientModal;
