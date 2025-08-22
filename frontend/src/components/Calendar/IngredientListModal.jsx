import React, { useState } from "react";
import axios from "axios";
import "./IngredientListModal.css";

function IngredientListModal({ date, items, onClose }) {
    const formatDate = (d) => {
        const obj = new Date(d);
        return `${obj.getFullYear()}년 ${obj.getMonth() + 1}월 ${obj.getDate()}일`;
    };

    // 모달 안에서만 쓰는 로컬 복제본 (최근 사용량 표시용 필드도 추가)
    const [localItems, setLocalItems] = useState(
        (items || []).map((it) => ({
            ...it,
            lastUsedNow: 0, // 직전 요청에서 사용한 양 표시
        }))
    );
    const [expanded, setExpanded] = useState({}); // 항목별 펼침 여부
    const [usingAmount, setUsingAmount] = useState({}); // 항목별 입력 수량
    const [loadingId, setLoadingId] = useState(null); // 버튼 중복 클릭 방지

    const toggleExpand = (idx) =>
        setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

    const token = localStorage.getItem("token");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // ===== API 호출 헬퍼 (모두 /api 프리픽스) =====
    async function apiConsumeOne(id, amount) {
        return axios.patch(
            "/api/fridge/consume",
            { id, amount: Number(amount) },
            { headers: { "Content-Type": "application/json", ...authHeader } }
        );
    }
    async function apiMarkUsed(id) {
        return axios.patch(`/api/fridge/mark-used/${id}`, null, {
            headers: authHeader,
        });
    }
    async function apiUnuse(id) {
        return axios.patch(`/api/fridge/unuse/${id}`, null, {
            headers: authHeader,
        });
    }

    // ===== 동작 핸들러 =====
    const handleConsume = async (idx) => {
        const row = localItems[idx];
        if (!row?.id) return alert("항목 ID를 찾을 수 없어요.");
        const amount = Number(usingAmount[row.id] ?? 1);
        if (!amount || amount <= 0) return alert("사용할 개수를 올바르게 입력하세요.");

        try {
            setLoadingId(row.id);
            const { data } = await apiConsumeOne(row.id, amount);
            // data: { id, name, usedNow, newQuantity, unit, status }
            setLocalItems((prev) =>
                prev.map((it, i) =>
                    i === idx
                        ? {
                            ...it,
                            count: data?.newQuantity ?? it.count,
                            unit: data?.unit ?? it.unit,
                            status: data?.status ?? it.status,
                            lastUsedNow: data?.usedNow ?? amount,
                        }
                        : it
                )
            );
        } catch (e) {
            console.error(e);
            alert("사용 처리에 실패했습니다.");
        } finally {
            setLoadingId(null);
        }
    };

    const handleMarkUsed = async (idx) => {
        const row = localItems[idx];
        if (!row?.id) return alert("항목 ID를 찾을 수 없어요.");
        try {
            setLoadingId(row.id);
            const { data } = await apiMarkUsed(row.id);
            setLocalItems((prev) =>
                prev.map((it, i) =>
                    i === idx
                        ? {
                            ...it,
                            status: data?.status ?? "USED",
                            usedAt: new Date().toISOString(),
                        }
                        : it
                )
            );
        } catch (e) {
            console.error(e);
            alert("사용완료 처리에 실패했습니다.");
        } finally {
            setLoadingId(null);
        }
    };

    const handleUnuse = async (idx) => {
        const row = localItems[idx];
        if (!row?.id) return alert("항목 ID를 찾을 수 없어요.");
        try {
            setLoadingId(row.id);
            const { data } = await apiUnuse(row.id);
            setLocalItems((prev) =>
                prev.map((it, i) =>
                    i === idx ? { ...it, status: data?.status ?? "ACTIVE", usedAt: null } : it
                )
            );
        } catch (e) {
            console.error(e);
            alert("사용취소(되돌리기)에 실패했습니다.");
        } finally {
            setLoadingId(null);
        }
    };

    // ===== 렌더 =====
    return (
        <div className="modal-overlay">
            <div className="modal-content list-modal">
                <h3>{formatDate(date)}의 재료 목록</h3>

                {localItems.length > 0 ? (
                    <ul className="ingredient-list">
                        {localItems.map((item, idx) => {
                            const isExpanded = !!expanded[idx];
                            const isUsed = item.status === "USED";
                            const unit = item.unit && item.unit !== "개" ? item.unit : "개";
                            const memo = item.notes || item.memo || "없음";
                            const needToggleMemo = memo.length > 100;

                            return (
                                <li
                                    key={item.id ?? idx}
                                    className={`ingredient-item ${isExpanded ? "expanded" : ""} ${
                                        isUsed ? "used" : ""
                                    }`}
                                >
                                    <div className="ingredient-content">
                                        <div
                                            className="ingredient-title"
                                            style={{
                                                color: item.color,
                                                textDecoration: isUsed ? "line-through" : "none",
                                            }}
                                        >
                                            {item.title} - {item.count}
                                            {unit}
                                        </div>

                                        <div className="ingredient-sub">
                                            <span>구분: {item.category}</span>
                                            <br />
                                            <span>유통기한: {item.expireDate}</span>
                                            <br />
                                            <span>
                        메모:{" "}
                                                {needToggleMemo && !isExpanded
                                                    ? `${memo.slice(0, 10)}...`
                                                    : memo}
                      </span>

                                            {isUsed && (
                                                <div className="used-caption">
                                                    사용완료
                                                    {item.usedAt
                                                        ? ` (${String(item.usedAt).split("T")[0]})`
                                                        : ""}
                                                </div>
                                            )}

                                            {item.lastUsedNow > 0 && (
                                                <div className="just-used">
                                                    최근 사용 {item.lastUsedNow}
                                                    {unit}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 오른쪽 액션 영역 */}
                                    <div className="ingredient-actions">
                                        {/* 펼침 토글 */}
                                        {needToggleMemo && (
                                            <button
                                                className="expand-btn"
                                                onClick={() => toggleExpand(idx)}
                                                disabled={loadingId === item.id}
                                            >
                                                {isExpanded ? "접기 ▲" : "더보기 ▼"}
                                            </button>
                                        )}

                                        {/* 사용/완료/취소 컨트롤 */}
                                        <div className="use-controls">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={usingAmount[item.id] ?? ""}
                                                placeholder="사용 수량"
                                                onChange={(e) =>
                                                    setUsingAmount((prev) => ({
                                                        ...prev,
                                                        [item.id]: e.target.value,
                                                    }))
                                                }
                                                disabled={loadingId === item.id || isUsed}
                                            />
                                            <button
                                                className="use-btn"
                                                onClick={() => handleConsume(idx)}
                                                disabled={loadingId === item.id || isUsed}
                                            >
                                                사용
                                            </button>

                                            {!isUsed ? (
                                                <button
                                                    className="mark-used-btn"
                                                    onClick={() => handleMarkUsed(idx)}
                                                    disabled={loadingId === item.id}
                                                >
                                                    사용완료
                                                </button>
                                            ) : (
                                                <button
                                                    className="undo-used-btn"
                                                    onClick={() => handleUnuse(idx)}
                                                    disabled={loadingId === item.id}
                                                >
                                                    사용취소
                                                </button>
                                            )}
                                        </div>
                                    </div>
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
