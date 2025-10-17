import { useEffect, useState } from "react";
import {
    fetchNotices,
    fetchNoticeDetail,   // ✅ 상세 조회
    createNotice,
    updateNotice,
    deleteNotice,
} from "../../api/adminNoticeApi";

export default function AdminNotices() {
    const [query, setQuery] = useState("");
    const [page, setPage]   = useState(0);
    // data: { items: Notice[], total: number }
    const [data, setData]   = useState(null);
    // editing: { id|null, title, content, pinned } | null
    const [editing, setEditing] = useState(null);

    const load = async (p = page) => {
        const res = await fetchNotices({ page: p, size: 10, query });
        setData(res);
        setPage(p);
    };
    useEffect(() => { load(0).catch(console.error); }, []);

    const onSearch = async () => { await load(0); };

    // ✅ 수정/작성 열기: 수정일 때 상세 불러와서 채우기
    const openEdit = async (item) => {
        if (!item) {
            setEditing({ id: null, title: "", content: "", pinned: false });
            return;
        }
        try {
            const d = await fetchNoticeDetail(item.id);
            setEditing({
                id: d.id,
                title: d.title ?? "",
                content: d.content ?? "",
                pinned: !!d.pinned,
            });
        } catch (e) {
            alert("공지 내용을 불러오지 못했습니다.");
        }
    };

    // ✅ 저장: 제목/내용 필수 + pinned 함께 전송
    const saveEdit = async () => {
        const title = (editing.title ?? "").trim();
        const content = (editing.content ?? "").trim();
        const pinned = !!editing.pinned;

        if (!title) return alert("제목은 필수입니다.");
        if (!content) return alert("내용은 필수입니다.");

        if (editing.id) {
            await updateNotice(editing.id, { title, content, pinned });
        } else {
            await createNotice({ title, content, pinned });
        }
        setEditing(null);
        await load(0);
    };

    const remove = async (id) => {
        if (!window.confirm("공지 삭제할까요?")) return;
        await deleteNotice(id);
        await load(page);
    };

    const totalPages = data ? Math.max(1, Math.ceil((data.total ?? 0) / 10)) : 1;

    return (
        <div className="admin-page">
            <h2>공지 등록</h2>

            {/* 검색바 (레시피 페이지와 동일 스타일) */}
            <div className="search-row" style={{display:"flex", gap:10, alignItems:"center", margin:"14px 0 18px"}}>
                <input
                    className="search-input"
                    style={{flex:"0 1 360px", height:40, border:"1px solid #e5e7eb", borderRadius:8, padding:"0 12px"}}
                    placeholder="제목 검색"
                    value={query}
                    onChange={(e)=>setQuery(e.target.value)}
                    onKeyDown={(e)=>e.key==='Enter' && onSearch()}
                />
                <button className="btn primary" style={{height:40, padding:"0 16px"}} onClick={onSearch}>검색</button>
                <div style={{flex:1}} />
                <button className="primary" onClick={()=>openEdit(null)}>+ 공지 작성</button>
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
                                <td style={{display:"flex", gap:8}}>
                                    <button onClick={()=>openEdit(n)}>수정</button>
                                    <button className="danger" onClick={()=>remove(n.id)}>삭제</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {/* 페이지네이션 */}
                    <div className="pager" style={{display:"flex", gap:8, justifyContent:"center", marginTop:16}}>
                        <button disabled={page===0} onClick={()=>load(0)}>«</button>
                        <button disabled={page===0} onClick={()=>load(page-1)}>‹</button>
                        {Array.from({length: totalPages}).slice(0,10).map((_, i)=>(
                            <button key={i} className={page===i ? "active" : ""} onClick={()=>load(i)}>
                                {i+1}
                            </button>
                        ))}
                        <button disabled={page>=totalPages-1} onClick={()=>load(page+1)}>›</button>
                        <button disabled={page>=totalPages-1} onClick={()=>load(totalPages-1)}>»</button>
                    </div>
                </>
            )}

            {/* 모달 */}
            {editing && (
                <div className="modal">
                    <div className="modal-card" style={{maxWidth:720}}>
                        <h3>{editing.id ? "공지 수정" : "공지 작성"}</h3>
                        <label>제목
                            <input
                                value={editing.title}
                                onChange={(e)=>setEditing({...editing, title:e.target.value})}
                            />
                        </label>
                        <label>내용
                            <textarea
                                value={editing.content}
                                onChange={(e)=>setEditing({...editing, content:e.target.value})}
                                rows={10}
                            />
                        </label>
                        {/* ✅ 상단 고정 유지 */}
                        <label style={{display:"flex", alignItems:"center", gap:8}}>
                            <input
                                type="checkbox"
                                checked={!!editing.pinned}
                                onChange={(e)=>setEditing({...editing, pinned:e.target.checked})}
                            />
                            상단 고정
                        </label>

                        <div className="actions">
                            <button onClick={()=>setEditing(null)}>취소</button>
                            <button className="primary" onClick={saveEdit}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
