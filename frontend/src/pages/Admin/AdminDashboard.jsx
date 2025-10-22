// src/pages/Admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { fetchAdminMini, fetchRecentNotices } from "../../api/adminApi";
import "./admin.css";

export default function AdminDashboard() {
    const [mini, setMini] = useState(null); // { signups, posts, revisitRate, pending }
    const [notices, setNotices] = useState(null);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [m, n] = await Promise.all([
                    fetchAdminMini(),
                    fetchRecentNotices(5),
                ]);
                setMini(m);
                setNotices(n || []);
            } catch (e) {
                console.error(e);
                setErr("대시보드 데이터를 불러오지 못했습니다.");
            }
        })();
    }, []);

    if (err) return <div className="loading">{err}</div>;
    if (!mini || !notices) return <div className="loading">로딩...</div>;

    return (
        <>
            <h2 className="page-title">대시보드</h2>

            {/* KPI 4개 */}
            <div className="kpis-4">
                <div className="card kpi">
                    <span className="kpi-ic">👤</span>
                    <div className="kpi-title">신규 가입(오늘)</div>
                    <div className="kpi-num">{mini.signups?.toLocaleString?.() ?? mini.signups}</div>
                </div>
                <div className="card kpi">
                    <span className="kpi-ic">📝</span>
                    <div className="kpi-title">게시글 수(오늘)</div>
                    <div className="kpi-num">{mini.posts?.toLocaleString?.() ?? mini.posts}</div>
                </div>
                <div className="card kpi">
                    <span className="kpi-ic">↻</span>
                    <div className="kpi-title">재방문율(7일)</div>
                    <div className="kpi-num">
                        {typeof mini.revisitRate === "number" ? `${Math.round(mini.revisitRate)}%` : mini.revisitRate}
                    </div>
                </div>
                <div className="card kpi compact">
                    <span className="kpi-ic">⏳</span>
                    <div className="kpi-title">승인 대기</div>
                    <div className="kpi-num">
                        {mini.pending?.toLocaleString?.() ?? mini.pending}
                        <a className="btn ghost" href="/admin/approvals/recipes">바로가기</a>
                    </div>
                </div>
            </div>

            {/* 최근 공지 */}
            <div className="table-card" style={{marginTop:12}}>
                <div className="table-head">
                    <b>최근 공지</b>
                    <a href="/admin/notices" className="linklike">전체 보기</a>
                </div>
                <table className="adm-table">
                    <thead>
                    <tr>
                        <th style={{width:80}}>ID</th>
                        <th>제목</th>
                        <th style={{width:160}}>작성일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {notices.length > 0 ? notices.map(n => (
                        <tr key={n.id}>
                            <td>{n.id}</td>
                            <td className="ellipsis">
                                <a className="linklike" href={`/admin/notices/${n.id}`} title={n.title}>{n.title}</a>
                            </td>
                            <td>{(n.createdAt || "").replace("T"," ").slice(0,16)}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3} className="empty">등록된 공지가 없습니다.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
