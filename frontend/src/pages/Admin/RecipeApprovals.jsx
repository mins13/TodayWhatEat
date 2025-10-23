import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPendingDrafts, approveDraft, rejectDraft } from "../../api/adminRecipeDraftApi";
import "./admin.css";

export default function RecipeApprovals() {
    const [data, setData] = useState(null);
    const [reasons, setReasons] = useState({}); // { [id]: reason }
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const load = async () => {
        try {
            const res = await fetchPendingDrafts();
            setData(res);
            setError("");
        } catch (e) {
            setError(e?.message || "목록을 불러오지 못했습니다.");
            setData({ content: [] });
        }
    };

    useEffect(() => { load(); }, []);

    const setReason = (id, v) => setReasons(prev => ({ ...prev, [id]: v }));

    if (!data) return <div className="loading">로딩...</div>;

    return (
        <div className="admin-page">
            <h2 className="page-title">레시피 승인 대기</h2>

            {/* 검색/툴바 (필요 없으면 지워도 됨) */}
            <div className="toolbar">
                <div className="search">
                    <input className="search-input" placeholder="검색 (제목)" disabled />
                    <button className="btn ghost" disabled>검색</button>
                </div>
                <span className="muted">총 {data.totalElements ?? (data.content?.length || 0)}건</span>
            </div>

            <div className="table-card">
                <table className="adm-table tbl admin-approvals">
                    <thead>
                    <tr>
                        <th style={{ width: 90 }}>ID</th>
                        <th>제목</th>
                        <th style={{ width: 140 }}>상태</th>
                        <th style={{ width: 220 }}>신청일</th>
                        <th style={{ width: 380 }}>승인/반려</th>
                    </tr>
                    </thead>
                    <tbody>
                    {(data.content || []).map(d => (
                        <tr key={d.id}>
                            <td>{d.id}</td>

                            <td className="ellipsis">
                                <button
                                    className="linklike"
                                    title={d.title}
                                    onClick={() => navigate(`/admin/approvals/recipes/${d.id}`)}
                                >
                                    {d.title || "(제목 없음)"}
                                </button>
                            </td>

                            <td>
                  <span className={`badge ${
                      (d.status || "PENDING").toString().toLowerCase()
                  }`}>
                    {d.status || "PENDING"}
                  </span>
                            </td>

                            <td className="muted">
                                {/* ISO라면 slice로 간단 표시 */}
                                {d.createdAt ? String(d.createdAt).replace("T", " ").slice(0, 16) : "-"}
                            </td>

                            <td>
                                <div className="row-actions" style={{ display: "flex", alignItems: "center" }}>
                                    <button
                                        className="primary"
                                        onClick={async () => {
                                            await approveDraft(d.id);
                                            await load();
                                            alert("승인 완료");
                                        }}
                                    >
                                        승인
                                    </button>

                                    <input
                                        className="reason-input"
                                        placeholder="반려 사유"
                                        value={reasons[d.id] || ""}
                                        onChange={e => setReason(d.id, e.target.value)}
                                        style={{ flex: 1, minWidth: 160 }}
                                    />

                                    <button
                                        className="danger"
                                        onClick={async () => {
                                            await rejectDraft(d.id, reasons[d.id] || "형식 미흡");
                                            setReason(d.id, "");
                                            await load();
                                            alert("반려 완료");
                                        }}
                                    >
                                        반려
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}

                    {(data.content || []).length === 0 && (
                        <tr>
                            <td colSpan={5} className="empty">승인 대기 항목이 없습니다.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>


            <div className="pager">
                <button
                    className="btn ghost pager-nav"
                    disabled   // 페이지네이션 붙이면 조건으로 바꿔 쓰면 됨: page <= 1
                    aria-label="이전 페이지"
                    // onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    ‹
                </button>

                <span className="page-num">1</span> {/* 실제 페이지 번호 바인딩으로 교체 가능 */}

                <button
                    className="btn ghost pager-nav"
                    disabled   // 페이지네이션 붙이면 조건으로 바꿔 쓰면 됨: page >= totalPages
                    aria-label="다음 페이지"
                    // onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                    ›
                </button>
            </div>


            {error && (
                <div style={{ marginTop: 10 }} className="badge-red">
                    {error}
                </div>
            )}
        </div>
    );
}
