import { useEffect, useState } from "react";
import { fetchAdminUsers, setUserRole, setUserBanned } from "../../api/adminApi";

export default function AdminUsers() {
    const [data, setData] = useState({ items: [], total: 0 });
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const size = 10;

    const load = async () => {
        const res = await fetchAdminUsers({ page, size, q });
        setData(res);
    };

    useEffect(() => { load().catch(console.error); }, [page, q]);

    const changeRole = async (id, role) => { await setUserRole(id, role); await load(); };
    const toggleBan  = async (id, current) => { await setUserBanned(id, !current); await load(); };

    return (
        <>
            <h2 className="page-title">유저 관리</h2>

            <div className="toolbar">
                <div className="search">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="이메일/아이디 검색"
                    />
                    <button className="btn" onClick={() => { setPage(1); load(); }}>검색</button>
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
                  <span className={`tag ${u.role === "ADMIN" ? "tag-admin" : ""}`}>
                    {u.role}
                  </span>
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
                <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</button>
                <span className="page-num">{page}</span>
                <button className="btn ghost" disabled={data.items.length < size} onClick={() => setPage(p => p + 1)}>다음</button>
            </div>
        </>
    );
}
