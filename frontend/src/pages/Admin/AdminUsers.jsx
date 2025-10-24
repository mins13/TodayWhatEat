// src/pages/Admin/AdminUsers.jsx
import { useEffect, useRef, useState } from "react";
import { fetchAdminUsers, setUserRole, setUserBanned } from "../../api/adminApi";

/* SWR */
async function swr(key, loader, { ttl = 45_000, signal } = {}) {
    const now = Date.now();
    const raw = sessionStorage.getItem(key);
    let cached = null;
    if (raw) {
        try {
            const { ts, data } = JSON.parse(raw);
            if (now - ts < ttl) cached = data;
        } catch {}
    }
    const promise = (async () => {
        const fresh = await loader(signal);
        sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: fresh }));
        return fresh;
    })();
    return { cached, promise };
}

export default function AdminUsers() {
    const [data, setData] = useState({ items: [], total: 0 });
    const [q, setQ] = useState("");
    const [pendingQ, setPendingQ] = useState("");
    const [page, setPage] = useState(1);
    const size = 10;

    const acRef = useRef(null);

    // 디바운스
    useEffect(() => {
        const t = setTimeout(() => setQ(pendingQ), 300);
        return () => clearTimeout(t);
    }, [pendingQ]);

    const load = async (p = page, keyword = q) => {
        acRef.current?.abort?.();
        const ac = new AbortController();
        acRef.current = ac;
        const key = `adm:users:p${p}:q${keyword}`;
        try {
            const { cached, promise } = await swr(
                key,
                (signal) => fetchAdminUsers({ page: p, size, q: keyword, signal }),
                { ttl: 30_000, signal: ac.signal }
            );
            if (cached) setData(cached);
            const fresh = await promise;
            setData(fresh);
        } catch (e) {
            if (e?.name === "AbortError") return;
            console.error(e);
            setData({ items: [], total: 0 });
        }
    };

    useEffect(() => { load(1, q).catch(console.error); setPage(1); }, [q]);

    const changeRole = async (id, role) => {
        // 낙관적
        setData(d => ({ ...d, items: d.items.map(u => u.id === id ? { ...u, role } : u) }));
        try {
            await setUserRole(id, role);
            // 캐시 무효화는 최소화(낙관 반영)
            Object.keys(sessionStorage)
                .filter(k=>k.startsWith("adm:users"))
                .forEach(k=>sessionStorage.removeItem(k));
        } catch (e) {
            alert("권한 변경 실패");
            await load(page, q);
        }
    };
    const toggleBan  = async (id, current) => {
        setData(d => ({ ...d, items: d.items.map(u => u.id === id ? { ...u, banned: !current } : u) }));
        try {
            await setUserBanned(id, !current);
            Object.keys(sessionStorage)
                .filter(k=>k.startsWith("adm:users"))
                .forEach(k=>sessionStorage.removeItem(k));
        } catch (e) {
            alert("상태 변경 실패");
            await load(page, q);
        }
    };

    return (
        <>
            <h2 className="page-title">유저 관리</h2>

            <div className="toolbar">
                <div className="search">
                    <input
                        value={pendingQ}
                        onChange={(e) => setPendingQ(e.target.value)}
                        placeholder="이메일/아이디 검색"
                    />
                    <button className="btn" onClick={() => { setPage(1); load(1, pendingQ); }}>검색</button>
                </div>
                <div className="muted">총 {data.total}명</div>
            </div>

            <div className="table-card">
                <table className="adm-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>아이디</th>
                        <th>이메일</th>
                        <th>닉네임</th>
                        <th>권한</th>
                        <th>정지</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.items.map((u) => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.username}</td>
                            <td className="ellipsis">{u.email}</td>
                            <td>{u.nickname}</td>
                            <td>
                                <span className={`tag ${u.role === "ADMIN" ? "tag-admin" : ""}`}>{u.role}</span>
                                <select
                                    className="role-select"
                                    value={u.role}
                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                >
                                    <option value="USER">USER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </td>
                            <td>
                                {u.banned
                                    ? <span className="badge badge-red">정지</span>
                                    : <span className="badge">정상</span>}
                            </td>
                            <td className="row-actions">
                                <button className="link" onClick={() => toggleBan(u.id, u.banned)}>
                                    {u.banned ? "정지 해제" : "정지"}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {data.items.length === 0 && (
                        <tr><td colSpan={7} className="empty">검색 결과가 없습니다.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            <div className="pager">
                <button
                    className="btn ghost"
                    disabled={page <= 1}
                    onClick={() => { const np = page - 1; setPage(np); load(np, q); }}
                >
                    이전
                </button>
                <span className="page-num">{page}</span>
                <button
                    className="btn ghost"
                    disabled={data.items.length < size}
                    onClick={() => { const np = page + 1; setPage(np); load(np, q); }}
                >
                    다음
                </button>
            </div>
        </>
    );
}
