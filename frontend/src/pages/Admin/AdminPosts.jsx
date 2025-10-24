// src/pages/Admin/AdminPosts.jsx
import { useEffect, useRef, useState } from "react";
import { fetchAdminPosts, deleteAdminPost } from "../../api/adminApi";
import {
    fetchAdminPostDetail,
    fetchAdminPostComments,
    deleteAdminComment,
} from "../../api/adminModerationApi";

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

export default function AdminPosts() {
    const [data, setData] = useState({ items: [], total: 0 });
    const [q, setQ] = useState("");
    const [pendingQ, setPendingQ] = useState("");
    const [page, setPage] = useState(1);
    const size = 10;

    const [preview, setPreview] = useState(null);
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
        const key = `adm:posts:p${p}:q${keyword}`;
        try {
            const { cached, promise } = await swr(
                key,
                (signal) => fetchAdminPosts({ page: p, size, q: keyword, signal }),
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

    useEffect(() => {
        load(1, q).catch(console.error);
        setPage(1);
    }, [q]);

    const remove = async (id) => {
        if (!window.confirm("삭제할까요?")) return;
        await deleteAdminPost(id);
        // 캐시 무효화
        Object.keys(sessionStorage)
            .filter((k) => k.startsWith("adm:posts"))
            .forEach((k) => sessionStorage.removeItem(k));
        await load(page, q);
    };

    const openPreview = async (row) => {
        const ac = new AbortController();
        setPreview({ loading: true, post: null, comments: [], ac });
        try {
            const [post, cRes] = await Promise.all([
                fetchAdminPostDetail(row.id, { signal: ac.signal }),
                fetchAdminPostComments(row.id, { page: 1, size: 50, signal: ac.signal }),
            ]);
            setPreview({ loading: false, post, comments: cRes?.items || [], ac });
        } catch (e) {
            if (e?.name !== "AbortError") {
                console.error(e);
                alert("게시글/댓글을 불러오지 못했습니다.");
            }
            setPreview(null);
        }
    };

    const removeComment = async (postId, commentId) => {
        if (!window.confirm("댓글을 삭제할까요?")) return;
        try {
            await deleteAdminComment(postId, commentId);
            const { items } = await fetchAdminPostComments(postId, { page: 1, size: 50 });
            setPreview((p) => ({ ...p, comments: items || [] }));
        } catch (e) {
            console.error(e);
            alert("댓글 삭제 실패");
        }
    };

    return (
        <>
            <h2 className="page-title">게시글 관리</h2>

            <div className="toolbar">
                <div className="search">
                    <input
                        value={pendingQ}
                        onChange={(e) => setPendingQ(e.target.value)}
                        placeholder="제목/내용 검색"
                    />
                    <button
                        className="btn"
                        onClick={() => {
                            setPage(1);
                            load(1, pendingQ);
                        }}
                    >
                        검색
                    </button>
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
                            <td>
                                <span className="badge-soft">{p.boardCode ?? p.board}</span>
                            </td>
                            <td className="ellipsis">{p.title}</td>
                            <td>{p.authorName}</td>
                            <td>{p.likesCount ?? p.likes}</td>
                            <td>{p.viewsCount ?? p.views}</td>
                            <td className="row-actions">
                                <button className="link" onClick={() => openPreview(p)}>
                                    보기
                                </button>
                                <button className="link danger" onClick={() => remove(p.id)}>
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                    {data.items.length === 0 && (
                        <tr>
                            <td colSpan={7} className="empty">게시글이 없습니다.</td>
                        </tr>
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

            {preview && (
                <div className="modal">
                    <div className="modal-card" style={{ maxWidth: 860 }}>
                        <h3>게시글 미리보기</h3>

                        {preview.loading ? (
                            <div style={{ padding: 16 }}>불러오는 중...</div>
                        ) : (
                            <>
                                <div
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 10,
                                        padding: 14,
                                        marginBottom: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <b>{preview.post.title}</b>
                                        <span className="badge-soft">{preview.post.boardCode}</span>
                                    </div>
                                    <div style={{ whiteSpace: "pre-wrap" }}>
                                        {preview.post.content}
                                    </div>
                                    <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                                        ❤ {preview.post.likesCount} · 조회 {preview.post.viewsCount} · 작성자{" "}
                                        {preview.post.authorName}
                                    </div>
                                </div>

                                <h4 style={{ margin: "10px 0 8px" }}>댓글</h4>
                                <div
                                    style={{
                                        maxHeight: 260,
                                        overflow: "auto",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 10,
                                    }}
                                >
                                    {preview.comments.length === 0 ? (
                                        <div style={{ padding: 12, color: "#6b7280" }}>댓글이 없습니다.</div>
                                    ) : (
                                        <table className="adm-table" style={{ margin: 0 }}>
                                            <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>작성자</th>
                                                <th>내용</th>
                                                <th>관리</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {preview.comments.map((c) => (
                                                <tr key={c.id}>
                                                    <td>{c.id}</td>
                                                    <td>{c.authorName ?? "익명"}</td>
                                                    <td className="ellipsis">{c.content}</td>
                                                    <td className="row-actions">
                                                        <button
                                                            className="link danger"
                                                            onClick={() => removeComment(preview.post.id, c.id)}
                                                        >
                                                            삭제
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="actions" style={{ marginTop: 12 }}>
                            <button
                                onClick={() => {
                                    preview.ac?.abort?.();
                                    setPreview(null);
                                }}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
