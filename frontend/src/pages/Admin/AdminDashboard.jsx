// src/pages/Admin/AdminDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAdminMini, fetchRecentNotices } from "../../api/adminApi";
import "./admin.css";

/** ─────────────────────────────────────────────────────────
 *  초간단 SWR 유틸 (sessionStorage 기반)
 *  - 캐시 즉시 표시 -> 백그라운드 재검증
 *  - ttl: ms
 *  - revalidate: true 면 백그라운드 재검증
 *  - abort 지원
 * ───────────────────────────────────────────────────────── */
async function swrCall(key, fetcher, { ttl = 60_000, signal } = {}) {
    const now = Date.now();
    const ss = sessionStorage.getItem(key);
    let cached = null;
    if (ss) {
        try {
            const { ts, data } = JSON.parse(ss);
            if (now - ts < ttl) cached = data;
        } catch {}
    }
    const p = (async () => {
        const fresh = await fetcher(signal);
        sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: fresh }));
        return fresh;
    })();
    return { cached, promise: p };
}

export default function AdminDashboard() {
    const [mini, setMini] = useState(null); // { signups, posts, revisitRate, pending }
    const [notices, setNotices] = useState(null);
    const [err, setErr] = useState("");

    // 캐시 키
    const miniKey = "adm:mini:v1";
    const noticesKey = "adm:notices:recent:5";

    const acRef = useRef(null);

    useEffect(() => {
        acRef.current?.abort?.();
        const ac = new AbortController();
        acRef.current = ac;

        (async () => {
            try {
                // 캐시 우선 표시 + 동시 요청
                const [{ cached: cMini, promise: pMini }, { cached: cNoti, promise: pNoti }] =
                    await Promise.all([
                        swrCall(miniKey, () => fetchAdminMini({ signal: ac.signal }), { ttl: 30_000 }),
                        swrCall(noticesKey, () => fetchRecentNotices(5, { signal: ac.signal }), { ttl: 30_000 }),
                    ]);

                if (cMini) setMini(cMini);
                if (cNoti) setNotices(cNoti);

                // 백그라운드 최신 반영
                const [m, n] = await Promise.all([pMini, pNoti]);
                setMini(m);
                setNotices(n || []);
            } catch (e) {
                if (e?.name === "AbortError") return;
                console.error(e);
                setErr("대시보드 데이터를 불러오지 못했습니다.");
                if (!mini) setMini({ signups: 0, posts: 0, revisitRate: 0, pending: 0 });
                if (!notices) setNotices([]);
            }
        })();

        return () => ac.abort();
    }, []); // 최초 1회

    // idle에 전체 공지 목록 프리페치(있으면)
    useEffect(() => {
        if ("requestIdleCallback" in window) {
            requestIdleCallback(() => {
                // 필요 시: 다른 화면 진입 대비 프리페치
                // fetchRecentNotices(20).catch(()=>{});
            });
        }
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
            <div className="table-card" style={{ marginTop: 12 }}>
                <div className="table-head">
                    <b>최근 공지</b>
                    <a href="/admin/notices" className="linklike">전체 보기</a>
                </div>
                <table className="adm-table">
                    <thead>
                    <tr>
                        <th style={{ width: 80 }}>ID</th>
                        <th>제목</th>
                        <th style={{ width: 160 }}>작성일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {notices.length > 0 ? notices.map(n => (
                        <tr key={n.id}>
                            <td>{n.id}</td>
                            <td className="ellipsis">
                                <a className="linklike" href={`/admin/notices/${n.id}`} title={n.title}>{n.title}</a>
                            </td>
                            <td>{(n.createdAt || "").replace("T", " ").slice(0, 16)}</td>
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
