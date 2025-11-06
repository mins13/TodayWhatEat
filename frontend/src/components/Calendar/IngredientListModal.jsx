import React, { useState, useEffect } from "react";
import { http } from "../../api/http"; // ← 경로 확인!
import "./IngredientListModal.css";

function IngredientListModal({ date, items, version, onClose, onChange }) {
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

    // items / version 바뀌면 로컬 상태 초기화
    useEffect(() => {
        setLocalItems(
            (items || []).map((it) => ({
                ...it,
                lastUsedNow: 0,
                // 수량이 있으면 USED 표시/클래스를 즉시 해제
                status: Number(it.count) > 0 ? "ACTIVE" : it.status ?? "USED",
            }))
        );

        // UX: 입력 기본값 1로 재설정
        setUsingAmount((prev) => {
            const next = { ...prev };
            for (const it of items || []) next[it.id] = 1;
            return next;
        });
    }, [items, version]);

    const toggleExpand = (idx) =>
        setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

    const token = localStorage.getItem("token");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // ===== API 호출 헬퍼 =====
    // /fridge/consume  ← ConsumeRequest { items: [ { id, amount } ] } 를 보낸다고 가정
    async function apiConsumeOne(id, amount) {
        const body = {
            items: [{ id, amount: Number(amount) }],
        };
        return http.patch("/fridge/consume", body, { headers: authHeader });
    }

    // /fridge/mark-used  ← body 로 { id } 전송
    async function apiMarkUsed(id) {
        return http.patch(
            "/fridge/mark-used",
            { id: String(id) },
            { headers: authHeader }
        );
    }

    // ⚠️ 백엔드에 아직 없으면 404 날 수 있음(사용취소 기능)
    async function apiRestoreOne(id, amount) {
        return http.patch(
            "/fridge/restore-one",
            { id, amount: Number(amount) },
            { headers: authHeader }
        );
    }

    const afterSuccess = async () => {
        // 부모에게 갱신 신호 → 부모가 재조회(또는 부분 수정) 수행
        if (onChange) await onChange("refresh");
    };

    // ===== 동작 핸들러 =====
    const handleConsume = async (idx) => {
        const row = localItems[idx];
        let amount = Number(usingAmount[row.id]);
        if (!Number.isFinite(amount) || amount <= 0) amount = 1;

        const now = Number(row.count ?? 0);
        const safeAmount = Math.min(amount, now); // 현재 수량 초과 차감 방지
        if (safeAmount <= 0) {
            alert("사용할 수 있는 수량이 없습니다.");
            return;
        }

        try {
            setLoadingId(row.id);
            const { data } = await apiConsumeOne(row.id, safeAmount);

            const newQ = Number(
                data?.newQuantity ?? Math.max(0, now - safeAmount)
            );
            const newStatus = data?.status ?? (newQ > 0 ? "ACTIVE" : "USED");
            const usedNow = Number.isFinite(data?.usedNow)
                ? data.usedNow
                : safeAmount;

            setLocalItems((prev) =>
                prev.map((it, i) =>
                    i === idx
                        ? {
                            ...it,
                            count: newQ,
                            status: newStatus,
                            lastUsedNow: usedNow,
                        }
                        : it
                )
            );

            if (onChange)
                await onChange("consume", { id: row.id, newQuantity: newQ });

            setUsingAmount((prev) => ({ ...prev, [row.id]: "" }));
        } catch (e) {
            console.error("consume error:", e);
            alert(e?.response?.data?.message || e?.message || "사용 처리 실패");
        } finally {
            setLoadingId(null);
        }
    };

    const handleMarkUsed = async (idx) => {
        const row = localItems[idx];
        if (!row?.id) return;

        try {
            setLoadingId(row.id);

            let data;
            const remain = Number(row.count ?? 0);

            if (remain > 0) {
                // 남은 전량 소모 → 백엔드가 0 만들면서 USED로 돌려줌
                ({ data } = await apiConsumeOne(row.id, remain));
            } else {
                // 이미 0이면 상태만 USED
                ({ data } = await apiMarkUsed(row.id));
            }

            const newQ = Number(data?.newQuantity ?? 0);
            const newStatus = data?.status ?? (newQ > 0 ? "ACTIVE" : "USED");

            setLocalItems((prev) =>
                prev.map((it, i) =>
                    i === idx
                        ? {
                            ...it,
                            count: newQ,
                            status: newStatus,
                            usedAt:
                                newStatus === "USED" ? new Date().toISOString() : null,
                        }
                        : it
                )
            );

            if (onChange)
                await onChange("consume", { id: row.id, newQuantity: newQ });
        } catch (e) {
            console.error(e);
            alert(e?.response?.data?.message || "사용완료 처리 실패");
        } finally {
            setLoadingId(null);
        }
    };

    const handleRestore = async (idx) => {
        const row = localItems[idx];
        if (!row?.id) return;

        const init = Number(row.initialCount ?? 0);
        const now = Number(row.count ?? 0);
        const maxAdd = Math.max(0, init - now);

        // 💡 1) 이미 처음 수량이면 더 복구할 게 없음
        if (maxAdd <= 0) {
            alert("복구할 수 있는 수량이 없습니다. (이미 처음 수량입니다)");
            return;
        }

        let safeAmount;

        if (now === 0) {
            // 💡 2) 전체 사용된 상태라면 → 남은 사용량 전체 복구
            safeAmount = maxAdd; // = init - 0 = init
        } else {
            // 💡 3) 일부만 사용된 상태라면 → 입력값 만큼만 복구(최대 maxAdd)
            let amount = Number(usingAmount[row.id]);
            if (!Number.isFinite(amount) || amount <= 0) amount = 1;
            safeAmount = Math.min(amount, maxAdd);
        }

        try {
            setLoadingId(row.id);
            const { data } = await apiRestoreOne(row.id, safeAmount);
            const newQ = Number(data?.newQuantity ?? now + safeAmount);

            setLocalItems((prev) =>
                prev.map((it, i) =>
                    i === idx
                        ? {
                            ...it,
                            count: newQ,
                            status: "ACTIVE",
                            lastUsedNow: 0,
                        }
                        : it
                )
            );

            if (onChange)
                await onChange("restore", { id: row.id, newQuantity: newQ });

            // 입력창은 다시 1로
            setUsingAmount((prev) => ({ ...prev, [row.id]: 1 }));
        } catch (e) {
            alert(e?.response?.data?.message || e?.message || "사용취소 실패");
        } finally {
            setLoadingId(null);
        }
    };


    // ===== 렌더 =====
    const todayStr = formatDate(date);

    return (
        <div className="modal-overlay">
            <div className="modal-content list-modal">
                <h3>{todayStr}의 재료 목록</h3>

                {localItems.length > 0 ? (
                    <ul className="ingredient-list">
                        {localItems.map((item, idx) => {
                            const isExpanded = !!expanded[idx];
                            const isUsed = item.status === "USED";
                            const unit = item.unit && item.unit !== "개" ? item.unit : "개";
                            const memo = item.notes || item.memo || "없음";
                            const needToggleMemo = memo.length > 100;
                            const init = Number(item.initialCount ?? 0);
                            const now = Number(item.count ?? 0);
                            const used = Math.max(0, init - now);
                            const maxAdd = Math.max(0, init - now);

                            return (
                                <li
                                    key={item.id ?? idx}
                                    className={`ingredient-item ${
                                        isExpanded ? "expanded" : ""
                                    } ${isUsed ? "used" : ""}`}
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

                                        <div className="count-badges">
                      <span className="badge badge-initial">
                        처음 {init}
                          {unit}
                      </span>
                                            <span className="badge badge-now">
                        지금 {now}
                                                {unit}
                      </span>
                                            <span className="badge badge-used">
                        사용 {used}
                                                {unit}
                      </span>
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
                                                min="1"
                                                step="1"
                                                value={usingAmount[item.id] ?? 1}
                                                placeholder="사용/복구 수량"
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    const clamped = Math.max(
                                                        1,
                                                        Number.isFinite(v) ? v : 1
                                                    );
                                                    setUsingAmount((prev) => ({
                                                        ...prev,
                                                        [item.id]: clamped,
                                                    }));
                                                }}
                                                disabled={loadingId === item.id}
                                            />

                                            <button
                                                className="use-btn"
                                                type="button"
                                                onClick={() => handleConsume(idx)}
                                                disabled={
                                                    loadingId === item.id ||
                                                    isUsed ||
                                                    Number(item.count) <= 0
                                                }
                                            >
                                                사용
                                            </button>

                                            <button
                                                className="mark-used-btn"
                                                type="button"
                                                onClick={() => handleMarkUsed(idx)}
                                                disabled={loadingId === item.id || Number(item.count) <= 0}
                                            >
                                                전체 사용
                                            </button>

                                            <button
                                                className="undo-used-btn"
                                                type="button"
                                                onClick={() => handleRestore(idx)}
                                                disabled={loadingId === item.id}
                                            >
                                                사용취소
                                            </button>

                                            <small style={{ opacity: 0.7 }}>
                                                사용 최대: {now}
                                                {unit} · 복구 최대: {maxAdd}
                                                {unit}
                                            </small>
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
