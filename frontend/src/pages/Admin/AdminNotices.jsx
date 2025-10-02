// src/pages/Admin/AdminNotices.jsx
import { useEffect, useState } from "react";
import { fetchNotices, createNotice, updateNotice, deleteNotice } from "../../api/adminNoticeApi";

export default function AdminNotices(){
    const [query, setQuery] = useState("");
    const [page, setPage]   = useState(0);
    const [data, setData]   = useState(null);
    const [editing, setEditing] = useState(null); // {id,title,content,pinned}

    const load = async(p=page)=>{
        const res = await fetchNotices({page:p,size:10,query});
        setData(res);
    };
    useEffect(()=>{ load(0); },[]);

    const onSearch = async()=>{ setPage(0); await load(0); };

    const openEdit = (item)=> setEditing(item || { id:null, title:"", content:"", pinned:false });
    const saveEdit = async()=>{
        if(!editing.title?.trim()) return alert("제목은 필수입니다.");
        if(editing.id) await updateNotice(editing.id, editing);
        else await createNotice(editing);
        setEditing(null); await load(0);
    };
    const remove = async(id)=>{
        if(!window.confirm("공지 삭제할까요?")) return;
        await deleteNotice(id); await load();
    };

    return (
        <div className="admin-page">
            <h2>공지 등록</h2>

            <div className="toolbar" style={{display:"flex",gap:8,margin:"12px 0"}}>
                <input
                    placeholder="제목 검색"
                    value={query}
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={e=>e.key==='Enter' && onSearch()}
                />
                <button onClick={onSearch}>검색</button>
                <div style={{flex:1}} />
                <button className="primary" onClick={()=>openEdit(null)}>+ 공지 작성</button>
            </div>

            {!data ? "로딩..." : (
                <table className="tbl">
                    <thead><tr><th>ID</th><th>제목</th><th>상단고정</th><th>작성일</th><th>액션</th></tr></thead>
                    <tbody>
                    {data.content.map(n=>(
                        <tr key={n.id}>
                            <td>{n.id}</td>
                            <td>{n.title}</td>
                            <td>{n.pinned ? "✅" : "-"}</td>
                            <td>{n.createdAt?.replace("T"," ").slice(0,16)}</td>
                            <td style={{display:"flex",gap:8}}>
                                <button onClick={()=>openEdit(n)}>수정</button>
                                <button className="danger" onClick={()=>remove(n.id)}>삭제</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {editing && (
                <div className="modal">
                    <div className="modal-card" style={{maxWidth:720}}>
                        <h3>{editing.id ? "공지 수정" : "공지 작성"}</h3>
                        <label>제목
                            <input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/>
                        </label>
                        <label>내용
                            <textarea value={editing.content} onChange={e=>setEditing({...editing,content:e.target.value})} rows={10}/>
                        </label>
                        <label style={{display:"flex",alignItems:"center",gap:8}}>
                            <input type="checkbox" checked={!!editing.pinned}
                                   onChange={e=>setEditing({...editing,pinned:e.target.checked})}/>
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
