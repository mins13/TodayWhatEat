// src/pages/Admin/AdminRecipes.jsx
import { useEffect, useState } from "react";
import {
    fetchAdminRecipes, fetchRecipeDetail,
    createRecipe, updateRecipe, deleteRecipe,
    fetchIngredients, saveIngredients
} from "../../api/adminRecipeMgmtApi";

export default function AdminRecipes(){
    const [query, setQuery] = useState("");
    const [page, setPage]   = useState(0);
    const [data, setData]   = useState(null);
    const [editing, setEditing] = useState(null); // {id,title,image}
    const [ingModal, setIngModal] = useState({ open:false, recipeId:null, list:[] });

    const load = async (p=page) => {
        const res = await fetchAdminRecipes({page:p,size:10,query});
        setData(res);
    };
    useEffect(()=>{ load(0); },[]);

    const onSearch = async()=>{ setPage(0); await load(0); };

    const openEdit = async(id)=>{
        if(!id){ setEditing({id:null,title:"",image:""}); return; }
        const d = await fetchRecipeDetail(id);
        setEditing({ id:d.id, title:d.title, image:d.image||"" });
    };
    const saveEdit = async()=>{
        if(!editing.title?.trim()) return alert("제목은 필수입니다.");
        if(editing.id) await updateRecipe(editing.id, { title: editing.title, image: editing.image });
        else await createRecipe({ title: editing.title, image: editing.image });
        setEditing(null); await load(0);
    };
    const remove = async(id)=>{
        if(!window.confirm("정말 삭제할까요?")) return;
        await deleteRecipe(id); await load();
    };

    const openIngredients = async(recipeId)=>{
        const list = await fetchIngredients(recipeId);
        setIngModal({ open:true, recipeId, list });
    };
    const addIng = ()=>{
        setIngModal(m=>({...m, list:[...m.list, { id:null, name:"", quantity:"", unit:"", sortOrder: (m.list?.length||0)}]}));
    };
    const saveIng = async()=>{
        await saveIngredients(ingModal.recipeId, ingModal.list);
        setIngModal({ open:false, recipeId:null, list:[] });
    };

    return (
        <div className="admin-page">
            <h2>레시피 관리</h2>

            <div className="toolbar" style={{display:"flex", gap:8, margin:"12px 0"}}>
                <input
                    placeholder="제목 검색"
                    value={query}
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={e=>e.key==='Enter' && onSearch()}
                />
                <button onClick={onSearch}>검색</button>
                <div style={{flex:1}} />
                <button className="primary" onClick={()=>openEdit(null)}>+ 레시피 추가</button>
            </div>

            {!data ? "로딩..." : (
                <table className="tbl">
                    <thead>
                    <tr><th>ID</th><th>이미지</th><th>제목</th><th>좋아요</th><th>조회수</th><th>액션</th></tr>
                    </thead>
                    <tbody>
                    {data.content.map(r=>(
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.image ? <img src={r.image} alt="" style={{width:64,height:42,objectFit:"cover",borderRadius:6}}/> : "-"}</td>
                            <td>{r.title}</td>
                            <td>{r.likesCount}</td>
                            <td>{r.viewCount}</td>
                            <td style={{display:"flex", gap:8}}>
                                <button onClick={()=>openEdit(r.id)}>수정</button>
                                <button onClick={()=>openIngredients(r.id)}>재료편집</button>
                                <button className="danger" onClick={()=>remove(r.id)}>삭제</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* 수정/추가 모달 */}
            {editing && (
                <div className="modal">
                    <div className="modal-card">
                        <h3>{editing.id ? "레시피 수정" : "레시피 추가"}</h3>
                        <label>제목
                            <input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/>
                        </label>
                        <label>이미지 URL
                            <input value={editing.image||""} onChange={e=>setEditing({...editing,image:e.target.value})}/>
                        </label>
                        <div className="actions">
                            <button onClick={()=>setEditing(null)}>취소</button>
                            <button className="primary" onClick={saveEdit}>저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 재료 모달 */}
            {ingModal.open && (
                <div className="modal">
                    <div className="modal-card" style={{maxWidth:640}}>
                        <h3>재료 편집</h3>
                        {ingModal.list.map((g, idx)=>(
                            <div key={idx} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px",gap:8,marginBottom:8}}>
                                <input placeholder="이름" value={g.name}
                                       onChange={e=>{const x=[...ingModal.list];x[idx].name=e.target.value;setIngModal(m=>({...m,list:x}));}}/>
                                <input placeholder="수량" value={g.quantity||""}
                                       onChange={e=>{const x=[...ingModal.list];x[idx].quantity=e.target.value;setIngModal(m=>({...m,list:x}));}}/>
                                <input placeholder="단위" value={g.unit||""}
                                       onChange={e=>{const x=[...ingModal.list];x[idx].unit=e.target.value;setIngModal(m=>({...m,list:x}));}}/>
                                <input placeholder="정렬" value={g.sortOrder??idx} type="number"
                                       onChange={e=>{const x=[...ingModal.list];x[idx].sortOrder=Number(e.target.value);setIngModal(m=>({...m,list:x}));}}/>
                            </div>
                        ))}
                        <div className="actions" style={{justifyContent:"space-between"}}>
                            <button onClick={addIng}>+ 재료 추가</button>
                            <div>
                                <button onClick={()=>setIngModal({open:false, recipeId:null, list:[]})}>닫기</button>
                                <button className="primary" onClick={saveIng}>저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
