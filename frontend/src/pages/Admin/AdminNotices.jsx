// src/pages/Admin/AdminNotices.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    fetchNotices,
    fetchNoticeDetail,
    createNotice,
    updateNotice,
    deleteNotice,
    deleteNoticeAttachment,
} from "../../api/adminNoticeApi";

/* SWR 유틸 */
async function swrList(key, loader, { ttl = 60_000, signal } = {}) {
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

export default function AdminNotices() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [data, setData] = useState(null); // { items, total }
    const [editing, setEditing] = useState(null);


    const acRef = useRef(null);
    const keyBase = "adm:notices";

    // 검색 디바운스
    const [pendingQ, setPendingQ] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setQuery(pendingQ), 300);
        return () => clearTimeout(t);
    }, [pendingQ]);

    const totalPages = data ? Math.max(1, Math.ceil((data.total ?? 0) / 10)) : 1;

    const load = async (p = page, q = query) => {
        acRef.current?.abort?.();
        const ac = new AbortController();
        acRef.current = ac;

        const key = `${keyBase}:p${p}:q${q}`;
        try {
            const { cached, promise } = await swrList(
                key,
                (signal) => fetchNotices({ page: p, size: 10, query: q, signal }),
                { ttl: 30_000, signal: ac.signal }
            );
            if (cached) {
                setData(cached);
                setPage(p);
            } else {
                setData(prev => prev ?? null);
            }
            const fresh = await promise;
            setData(fresh);
            setPage(p);
        } catch (e) {
            // 🔽 여기만 이렇게 수정!
            if (e?.name === "AbortError" || e?.code === "ERR_CANCELED") {
                return;   // 취소된 요청은 조용히 무시
            }
            console.error(e);
            setData({ items: [], total: 0 });
        }
    };


    useEffect(() => { load(0, query).catch(console.error); /* 최초 로드 */ }, [query]);

    const onSearch = async () => { await load(0, query); };

    // 수정/작성 열기
    const openEdit = async (item) => {
        if (!item) {
            setEditing({
                id: null,
                title: "",
                content: "",
                pinned: false,
                attachments: [],   // 기존 첨부(수정 시용)
                files: [],         // 새로 업로드할 파일들
            });
            return;
        }
        const ac = new AbortController();
        try {
            const d = await fetchNoticeDetail(item.id, { signal: ac.signal });
            setEditing({
                id: d.id,
                title: d.title ?? "",
                content: d.content ?? "",
                pinned: !!d.pinned,
                attachments: d.attachments || [], // 백엔드에서 내려주는 첨부 목록
                files: [],
            });
        } catch (e) {
            if (e?.name !== "AbortError") {
                console.error(e);
                alert("공지 내용을 불러오지 못했습니다.");
            }
        }
    };

    const saveEdit = async () => {
        const title = (editing.title ?? "").trim();
        const content = (editing.content ?? "").trim();
        const pinned = !!editing.pinned;

        if (!title) return alert("제목은 필수입니다.");
        if (!content) return alert("내용은 필수입니다.");

        const hasFiles = editing.files && editing.files.length > 0;

        if (hasFiles) {
            const fd = new FormData();
            fd.append("title", title);
            fd.append("content", content);
            fd.append("pinned", String(pinned)); // 백엔드에서 boolean 파싱

            editing.files.forEach((file) => {
                fd.append("files", file); // name="files"
            });

            if (editing.id) {
                await updateNotice(editing.id, fd);
            } else {
                await createNotice(fd);
            }
        } else {
            const payload = { title, content, pinned };
            if (editing.id) {
                await updateNotice(editing.id, payload);
            } else {
                await createNotice(payload);
            }
        }

        // 캐시 무효화
        Object.keys(sessionStorage)
            .filter((k) => k.startsWith("adm:notices"))
            .forEach((k) => sessionStorage.removeItem(k));

        setEditing(null);
        await load(0, query);
    };

    const removeAttachment = async (fileId) => {
        if (!editing?.id) return;

        if (!window.confirm("이 첨부파일을 삭제할까요?")) return;

        try {
            await deleteNoticeAttachment(editing.id, fileId);

            // 상태에서 해당 파일 제거
            setEditing((prev) => ({
                ...prev,
                attachments: (prev.attachments || []).filter(
                    (a) => a.id !== fileId
                ),
            }));
        } catch (e) {
            console.error(e);
            alert("첨부파일 삭제에 실패했습니다.");
        }
    };


    const remove = async (id) => {
        if (!window.confirm("공지 삭제할까요?")) return;
        await deleteNotice(id);
        Object.keys(sessionStorage)
            .filter((k) => k.startsWith("adm:notices"))
            .forEach((k) => sessionStorage.removeItem(k));
        await load(page, query);
    };

    return (
        <div className="admin-page">
            <h2>공지 등록</h2>

            {/* 검색바 */}
            <div className="search-row" style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0 18px" }}>
                <input
                    className="search-input"
                    style={{ flex: "0 1 360px", height: 40, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 12px" }}
                    placeholder="제목 검색"
                    value={pendingQ}
                    onChange={(e) => setPendingQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch()}
                />
                <button className="btn primary" style={{ height: 40, padding: "0 16px" }} onClick={onSearch}>검색</button>
                <div style={{ flex: 1 }} />
                <button className="primary" onClick={() => openEdit(null)}>+ 공지 작성</button>
            </div>

            {!data ? (
                "로딩..."
            ) : (
                <>
                    <table className="tbl">
                        <thead>
                        <tr><th>ID</th><th>제목</th><th>상단고정</th><th>작성일</th><th>액션</th></tr>
                        </thead>
                        <tbody>
                        {(data.items ?? []).map(n => (
                            <tr key={n.id}>
                                <td>{n.id}</td>
                                <td>{n.title}</td>
                                <td>{n.pinned ? "✅" : "-"}</td>
                                <td>{n.createdAt?.replace("T"," ").slice(0,16)}</td>
                                <td style={{ display: "flex", gap: 8 }}>
                                    <button onClick={() => openEdit(n)}>수정</button>
                                    <button className="danger" onClick={() => remove(n.id)}>삭제</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* 페이지네이션 */}
                    <div className="pager" style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                        <button disabled={page === 0} onClick={() => load(0, query)}>«</button>
                        <button disabled={page === 0} onClick={() => load(page - 1, query)}>‹</button>
                        {Array.from({ length: totalPages }).slice(0, 10).map((_, i) => (
                            <button key={i} className={page === i ? "active" : ""} onClick={() => load(i, query)}>
                                {i + 1}
                            </button>
                        ))}
                        <button disabled={page >= totalPages - 1} onClick={() => load(page + 1, query)}>›</button>
                        <button disabled={page >= totalPages - 1} onClick={() => load(totalPages - 1, query)}>»</button>
                    </div>
                </>
            )}

            {/* 모달 */}
            {editing && (
                <div className="modal">
                    <div className="modal-card" style={{ maxWidth: 720 }}>
                        <h3>{editing.id ? "공지 수정" : "공지 작성"}</h3>

                        <label>제목
                            <input
                                value={editing.title}
                                onChange={(e) =>
                                    setEditing({ ...editing, title: e.target.value })
                                }
                            />
                        </label>

                        <label>내용
                            <textarea
                                value={editing.content}
                                onChange={(e) =>
                                    setEditing({ ...editing, content: e.target.value })
                                }
                                rows={10}
                            />
                        </label>

                        {/* 🔽 여기 추가: 파일 첨부 */}
                        <label>
                            첨부 파일
                            <input
                                type="file"
                                multiple
                                onChange={(e) =>
                                    setEditing((prev) => ({
                                        ...prev,
                                        files: Array.from(e.target.files || []),
                                    }))
                                }
                            />
                        </label>

                        {/* 기존 첨부(수정 모드일 때) */}
                        {editing.attachments && editing.attachments.length > 0 && (
                            <div style={{ marginTop: 8, fontSize: 13 }}>
                                <div style={{ marginBottom: 4 }}>등록된 첨부:</div>
                                <ul style={{ paddingLeft: 18 }}>
                                    {editing.attachments.map((f) => (
                                        <li
                                            key={f.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <a href={f.url} target="_blank" rel="noreferrer">
                                                {f.filename}
                                            </a>
                                            <button
                                                type="button"
                                                className="link danger"  // AdminPosts에서 쓰는 스타일 있으면 그대로 사용
                                                onClick={() => removeAttachment(f.id)}
                                            >
                                                삭제
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 이번에 새로 올릴 파일 프리뷰 */}
                        {editing.files && editing.files.length > 0 && (
                            <div style={{ marginTop: 8, fontSize: 13 }}>
                                <div style={{ marginBottom: 4 }}>업로드 예정:</div>
                                <ul style={{ paddingLeft: 18 }}>
                                    {editing.files.map((f, i) => (
                                        <li key={i}>{f.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                                type="checkbox"
                                checked={!!editing.pinned}
                                onChange={(e) =>
                                    setEditing({ ...editing, pinned: e.target.checked })
                                }
                            />
                            상단 고정
                        </label>

                        <div className="actions">
                            <button onClick={() => setEditing(null)}>취소</button>
                            <button className="primary" onClick={saveEdit}>저장</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
