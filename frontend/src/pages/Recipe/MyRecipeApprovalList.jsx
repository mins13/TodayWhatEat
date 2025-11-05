// src/pages/recipe/MyRecipeApprovalList.jsx
import React, { useEffect, useState } from "react";
import { fetchMySubmittedDrafts, cancelMySubmission } from "../../api/draftApi";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import useRequireAuth from "../../hooks/useRequireAuth";   // ✅ 추가
import "./MyRecipeApprovalList.css";

const PAGE_SIZE = 5;         // 한 페이지 5개
const TITLE_LIMIT = 12;      // 제목 12글자 이후 … 처리

// 안전한 글자수 자르기(코드포인트 단위)
function ellipsize(str, limit = TITLE_LIMIT) {
    if (!str) return "-";
    const cps = Array.from(str); // surrogate pair 안전
    return cps.length > limit ? cps.slice(0, limit).join("") + "…" : str;
}

/** ✅ 바깥 래퍼: 로그인 확인 후에만 내부 렌더 */
export default function MyRecipeApprovalListPage() {
    const ready = useRequireAuth({ alert: true }); // 토큰 없으면 /login 으로 보냄
    if (!ready) return null;                       // redirect 동안 화면 비우기
    return <MyRecipeApprovalListInner />;
}

/** 실제 화면 컴포넌트 */
function MyRecipeApprovalListInner() {
    const [data, setData] = useState(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [workingId, setWorkingId] = useState(null);

    const load = async (p = 0) => {
        setLoading(true);
        try {
            const res = await fetchMySubmittedDrafts(p, PAGE_SIZE);
            setData(res);
            setPage(p);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(0);
    }, []);

    const safe = data ?? {
        content: [],
        number: page,
        totalPages: 1,
        first: true,
        last: true,
    };

    const onCancel = async (id) => {
        if (!window.confirm("이 승인 신청을 취소할까요? (초안으로 되돌아갑니다)")) return;
        try {
            setWorkingId(id);
            await cancelMySubmission(id);
            await load(page);
        } catch (e) {
            alert(e?.message || "취소에 실패했습니다.");
        } finally {
            setWorkingId(null);
        }
    };

    const fillerCount = Math.max(0, PAGE_SIZE - (safe.content?.length ?? 0));

    return (
        <div className="recipe-detail-container">
            <div className="recipe-detail-wrapper">
                <div className="recipe-detail-left-panel">
                    <RecipeSidebar />
                </div>

                <div className="recipe-detail-right-panel">
                    <h2 className="page-title">내 승인 신청 관리</h2>

                    <div className="card">
                        <table className="tbl">
                            <thead>
                            <tr>
                                <th style={{ width: 90 }}>ID</th>
                                <th>제목</th>
                                <th style={{ width: 120 }}>상태</th>
                                <th style={{ width: 240 }}>반려 사유</th>
                                <th style={{ width: 180 }}>업데이트</th>
                                <th style={{ width: 120 }}>작업</th>
                            </tr>
                            </thead>

                            <tbody>
                            {loading &&
                                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                    <tr className="skeleton-row" key={`sk-${i}`}>
                                        <td colSpan={6}>
                                            <div className="skeleton-line" />
                                        </td>
                                    </tr>
                                ))}

                            {!loading &&
                                safe.content.map((d) => (
                                    <tr key={d.id}>
                                        <td>{d.id}</td>
                                        {/* 제목: 12글자 이후 … 표시 + 전체는 title로 툴팁 */}
                                        <td className="title-clip" title={d.title || "-"}>
                                            {ellipsize(d.title, TITLE_LIMIT)}
                                        </td>
                                        <td>
                                            {d.status === "PENDING" && (
                                                <span className="badge-soft">PENDING</span>
                                            )}
                                            {d.status === "APPROVED" && (
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: "#e8fff1",
                                                        color: "#16a34a",
                                                    }}
                                                >
                                                    APPROVED
                                                </span>
                                            )}
                                            {d.status === "REJECTED" && (
                                                <span className="badge-red">REJECTED</span>
                                            )}
                                        </td>
                                        <td
                                            className="title-clip"
                                            title={d.rejectionReason || "-"}
                                        >
                                            {d.rejectionReason || "-"}
                                        </td>
                                        <td>
                                            {(d.updatedAt || "").replace("T", " ").slice(0, 16)}
                                        </td>
                                        <td>
                                            {d.status === "PENDING" ? (
                                                <button
                                                    className="btn-refresh"
                                                    disabled={!!workingId}
                                                    onClick={() => onCancel(d.id)}
                                                    title="신청 취소"
                                                >
                                                    {workingId === d.id ? "취소 중…" : "취소"}
                                                </button>
                                            ) : (
                                                <span className="muted">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                            {!loading &&
                                fillerCount > 0 &&
                                Array.from({ length: fillerCount }).map((_, i) => (
                                    <tr key={`filler-${i}`}>
                                        <td colSpan={6}>&nbsp;</td>
                                    </tr>
                                ))}

                            {!loading && safe.content.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="empty">
                                        승인 신청 기록이 없습니다.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        <div className="pager" style={{ marginTop: 12 }}>
                            <button
                                onClick={() => load(Math.max(0, page - 1))}
                                disabled={loading || safe.first}
                            >
                                〈
                            </button>
                            <strong className="page-num">
                                {(safe.number ?? 0) + 1}
                            </strong>
                            <button
                                onClick={() =>
                                    load(Math.min((safe.totalPages ?? 1) - 1, page + 1))
                                }
                                disabled={loading || safe.last}
                            >
                                〉
                            </button>

                            <button
                                className="btn-refresh"
                                onClick={() => load(page)}
                                disabled={loading}
                                style={{ marginLeft: 8 }}
                            >
                                {loading ? "로딩중…" : "새로고침"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
