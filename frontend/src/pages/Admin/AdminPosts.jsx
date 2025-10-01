import { useEffect, useState } from "react";
import { fetchAdminPosts, deleteAdminPost } from "../../api/adminApi";

export default function AdminPosts() {
    const [data, setData] = useState({ items: [], total: 0 });
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const size = 10;

    const load = async () => {
        const res = await fetchAdminPosts({ page, size, q });
        setData(res);
    };
    useEffect(() => { load().catch(console.error); }, [page, q]);

    const remove = async (id) => {
        if (!window.confirm("삭제할까요?")) return;
        await deleteAdminPost(id);
        await load();
    };

    return (
        <>
            <h2 className="page-title">게시글 관리</h2>

            <div className="toolbar">
                <div className="search">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="제목/내용 검색"
                    />
                    <button className="btn" onClick={() => { setPage(1); load(); }}>검색</button>
                </div>
                <div className="muted">총 {data.total}건</div>
            </div>

            <div className="table-card">
                <table className="adm-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>게시판</th>
                        <th>제목</th>
                        <th>작성자</th>
                        <th>좋아요</th>
                        <th>조회</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.items.map((p) => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td><span className="badge-soft">{p.boardCode ?? p.board}</span></td>
                            <td className="ellipsis">{p.title}</td>
                            <td>{p.authorName}</td>
                            <td>{p.likesCount ?? p.likes}</td>
                            <td>{p.viewsCount ?? p.views}</td>
                            <td className="row-actions">
                                <button className="link danger" onClick={() => remove(p.id)}>삭제</button>
                            </td>
                        </tr>
                    ))}
                    {data.items.length === 0 && (
                        <tr><td colSpan={7} className="empty">게시글이 없습니다.</td></tr>
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
