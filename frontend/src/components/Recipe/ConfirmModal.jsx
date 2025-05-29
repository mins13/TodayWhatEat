// components/Common/ConfirmModal.jsx
import React from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <p>{message}</p>
                <div className="modal-buttons">
                    <button className="confirm-btn" onClick={onConfirm}>확인</button>
                    <button className="cancel-btn" onClick={onCancel}>취소</button>
                </div>
            </div>
        </div>
    );
}
