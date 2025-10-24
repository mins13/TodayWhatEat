// src/pages/Admin/AdminRecipes.jsx
import { useEffect, useRef, useState } from "react";
import {
    fetchAdminRecipes, fetchRecipeDetail,
    createRecipe, updateRecipe, deleteRecipe,
    fetchIngredients, saveIngredients,
    fetchTags, saveTags
} from "../../api/adminRecipeMgmtApi";

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

export default function AdminRecipes() {
    const [query, setQuery]   = useState("");
    const [page, setPage]     = useState(0);
    const [data, setData]     = useState(null);

    const [editing, setEditing] = useState(null);
    const [ingModal, setIngModal] = useState({ open:false, recipeId:null, list:[] });
    const [tagModal, setTagModal] = useState({ open:false, recipeId:null, tags:[], input:"" });

    const acRef = useRef(null);
    const size = 10;

    const load = async (p = page, q = query) => {
        acRef.current?.abort?.();
        const ac = new AbortController();
        acRef.current = ac;
        const key = `adm:recipes:p${p}:q${q}`;
        try {
            const { cached, promise } = await swr(
                key,
                (signal) => fetchAdminRecipes({ page: p, size, query: q, signal }),
                { ttl: 30_000, signal: ac.signal }
            );
            const pick = (res) => {
                const items = res?.items ?? res?.content ?? [];
                const total = res?.total ?? res?.totalElements ?? res?.totalCount ?? 0;
                return { items, total };
            };
            if (cached) {
                setData(pick(cached));
                setPage(p);
            }
            const fresh = await promise;
            setData(pick(fresh));
            setPage(p);
        } catch (e) {
            if (e?.name === "AbortError") return;
            console.error(e);
            setData({ items: [], total: 0 });
        }
    };

    useEffect(()=>{ load(0, query).catch(console.error); },[]);

    const onSearch = async()=>{ await load(0, query); };

    const openEdit = async (id) => {
        if (!id) {
            setEditing({
                id: null,
                title: "",
                image: "",
                ingredients: [{ name: "", amount: "" }],
                steps: [""],
            });
            return;
        }
        const ac = new AbortController();
        const d = await fetchRecipeDetail(id, { signal: ac.signal });
        const rawSteps = d.steps ?? [];
        const steps = rawSteps
            .map(s => typeof s === "string" ? s : (s?.description ?? ""))
            .filter(s => s !== null && s !== undefined)
            .map(s => String(s));

        setEditing({
            id: d.id,
            title: d.title ?? "",
            image: d.image ?? "",
            steps: steps.length ? steps : [""],
        });
    };

    const saveEdit = async()=>{
        if(!editing.title?.trim()) return alert("제목은 필수입니다.");
        const title = editing.title.trim();
        const image = (editing.image ?? "").trim();

        if(editing.id){ // 수정
            const steps = (editing.steps ?? []).map(s=>(s??"").trim()).filter(s=>s.length>0);
            if(steps.length===0) return alert("단계를 1개 이상 입력하세요.");
            await updateRecipe(editing.id, { title, image, steps });
        }else{ // 추가
            const steps = (editing.steps ?? []).map(s=>(s??"").trim()).filter(s=>s.length>0);
            if(steps.length===0) return alert("단계를 1개 이상 입력하세요.");

            const ingredients = (editing.ingredients ?? [])
                .map(g=>({ name:(g.name??"").trim(), amount:(g.amount??"").trim() }))
                .filter(g=> g.name.length>0);

            if(ingredients.length===0) return alert("재료를 1개 이상 입력하세요.");

            await createRecipe({ title, image, ingredients, steps });
        }
        // 캐시 무효화
        Object.keys(sessionStorage)
            .filter(k=>k.startsWith("adm:recipes"))
            .forEach(k=>sessionStorage.removeItem(k));

        setEditing(null);
        await load(0, query);
    };

    const remove = async(id)=>{
        if(!window.confirm("정말 삭제할까요?")) return;
        await deleteRecipe(id);
        Object.keys(sessionStorage)
            .filter(k=>k.startsWith("adm:recipes"))
            .forEach(k=>sessionStorage.removeItem(k));
        await load(page, query);
    };

    // ------- 재료 모달(수정 전용) -------
    const openIngredients = async(recipeId)=>{
        const list = await fetchIngredients(recipeId);
        setIngModal({ open:true, recipeId, list });
    };
    const addIng = ()=>{
        setIngModal(m=>({...m, list:[...m.list, { id:null, name:"", amount:"" }]}));
    };
    const saveIng = async()=>{
        await saveIngredients(ingModal.recipeId, ingModal.list);
        setIngModal({ open:false, recipeId:null, list:[] });
    };

    // ------- 태그 모달 -------
    const openTags = async(recipeId)=>{
        const tags = await fetchTags(recipeId);
        setTagModal({ open:true, recipeId, tags, input:"" });
    };
    const addTag = ()=>{
        const v = (tagModal.input||"").trim();
        if(!v) return;
        if(tagModal.tags.includes(v)) return setTagModal(m=>({...m, input:""}));
        setTagModal(m=>({...m, tags:[...m.tags, v], input:""}));
    };
    const removeTag = (t)=> setTagModal(m=>({...m, tags: m.tags.filter(x=>x!==t)}));
    const saveTagList = async()=>{
        await saveTags(tagModal.recipeId, tagModal.tags);
        setTagModal({ open:false, recipeId:null, tags:[], input:"" });
    };

    // ------- 추가 모드에서 재료/단계 행 제어 -------
    const addEditingIngredient = ()=>{
        if(!editing || editing.id) return;
        setEditing(e=>({...e, ingredients:[...(e.ingredients||[]), {name:"", amount:""}]}));
    };
    const delEditingIngredient = (idx)=>{
        if(!editing || editing.id) return;
        setEditing(e=>({...e, ingredients:(e.ingredients||[]).filter((_,i)=>i!==idx)}));
    };

    const totalPages = data ? Math.max(1, Math.ceil(data.total / 10)) : 1;
    const current = page + 1;
    const goto = (p) => { if (p<0 || p>=totalPages) return; setPage(p); load(p, query); };

    const pageNums = () => {
        const max = totalPages;
        const cur = current;
        const window = 5;
        const start = Math.max(1, cur - Math.floor(window/2));
        const end = Math.min(max, start + window - 1);
        const items = [];
        for (let i=start; i<=end; i++) items.push(i);
        return items;
    };

    return (
        <div className="admin-page">
            <h2>레시피 관리</h2>

            <div className="search-row" style={{display:"flex", gap:10, alignItems:"center", margin:"14px 0 18px"}}>
                <input
                    className="search-input"
                    style={{flex:"0 1 360px", height:40, border:"1px solid #e5e7eb", borderRadius:8, padding:"0 12px"}}
                    placeholder="제목 검색"
                    value={query}
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={e=>e.key==='Enter' && onSearch()}
                />
                <button
                    className="btn primary"
                    style={{height:40, padding:"0 16px"}}
                    onClick={onSearch}
                >
                    검색
                </button>

                <div style={{flex:1}} />
                <button className="primary" onClick={()=>openEdit(null)}>+ 레시피 추가</button>
            </div>

            {!data ? "로딩..." : (
                <table className="tbl">
                    <thead>
                    <tr><th>ID</th><th>이미지</th><th>제목</th><th>좋아요</th><th>조회수</th><th>액션</th></tr>
                    </thead>
                    <tbody>
                    {data.items.map(r => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.image ? <img src={r.image} alt="" loading="lazy" style={{width:64,height:42,objectFit:"cover",borderRadius:6}}/> : "-"}</td>
                            <td>{r.title}</td>
                            <td>{r.likesCount}</td>
                            <td>{r.viewCount}</td>
                            <td style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                                <button onClick={()=>openEdit(r.id)}>수정</button>
                                <button onClick={()=>openIngredients(r.id)}>재료편집</button>
                                <button onClick={()=>openTags(r.id)}>태그편집</button>
                                <button className="danger" onClick={()=>remove(r.id)}>삭제</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {data && totalPages > 1 && (
                <div style={{display:"flex", justifyContent:"center", margin:"18px 0 6px"}}>
                    <div style={{display:"flex", gap:8}}>
                        <button className="btn ghost" disabled={page===0} onClick={()=>goto(0)}>{'«'}</button>
                        <button className="btn ghost" disabled={page===0} onClick={()=>goto(page-1)}>{'‹'}</button>

                        {pageNums().map(n=>(
                            <button
                                key={n}
                                className="btn ghost"
                                onClick={()=>goto(n-1)}
                                style={{
                                    background:n===current ? "#1d4ed8" : "white",
                                    color:n===current ? "white" : "inherit",
                                    minWidth:36
                                }}
                            >
                                {n}
                            </button>
                        ))}

                        <button className="btn ghost" disabled={page>=totalPages-1} onClick={()=>goto(page+1)}>{'›'}</button>
                        <button className="btn ghost" disabled={page>=totalPages-1} onClick={()=>goto(totalPages-1)}>{'»'}</button>
                    </div>
                </div>
            )}

            {/* 레시피 수정/추가 모달 */}
            {editing && (
                <div className="modal">
                    <div className="modal-card">
                        <h3>{editing.id ? "레시피 수정" : "레시피 추가"}</h3>

                        <div className="modal-body">
                            <label>제목
                                <input
                                    value={editing.title}
                                    onChange={e=>setEditing({...editing,title:e.target.value})}
                                />
                            </label>

                            <label>이미지 URL
                                <input
                                    value={editing.image||""}
                                    onChange={e=>setEditing({...editing,image:e.target.value})}
                                />
                            </label>

                            {!editing.id && (
                                <div>
                                    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6}}>
                                        <b>재료</b>
                                        <button onClick={addEditingIngredient}>+ 재료 추가</button>
                                    </div>
                                    {(editing.ingredients||[]).map((g, idx)=>(
                                        <div key={idx} style={{display:"grid", gridTemplateColumns:"1fr 1fr 80px", gap:8, marginBottom:8}}>
                                            <input
                                                placeholder="이름"
                                                value={g.name}
                                                onChange={e=>{
                                                    const arr=[...(editing.ingredients||[])];
                                                    arr[idx] = {...arr[idx], name:e.target.value};
                                                    setEditing({...editing, ingredients:arr});
                                                }}
                                            />
                                            <input
                                                placeholder="수량 (예: 1컵 / 300g)"
                                                value={g.amount||""}
                                                onChange={e=>{
                                                    const arr=[...(editing.ingredients||[])];
                                                    arr[idx] = {...arr[idx], amount:e.target.value};
                                                    setEditing({...editing, ingredients:arr});
                                                }}
                                            />
                                            <button className="danger" onClick={()=>delEditingIngredient(idx)}>삭제</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6}}>
                                    <b>레시피(단계)</b>
                                    <button onClick={()=>setEditing(ed=>({...ed,steps:[...(ed.steps||[]), ""]}))}>+ 단계 추가</button>
                                </div>
                                {(editing.steps||[]).map((t,idx)=>(
                                    <div key={idx} style={{display:"grid", gridTemplateColumns:"1fr 80px", gap:8, marginBottom:8}}>
                    <textarea
                        placeholder={`단계 ${idx+1} 내용`}
                        rows={3}
                        value={t}
                        onChange={e=>{
                            const arr=[...(editing.steps||[])];
                            arr[idx]=e.target.value;
                            setEditing({...editing, steps:arr});
                        }}
                    />
                                        <button className="danger" onClick={()=>{
                                            const arr=[...(editing.steps||[])];
                                            arr.splice(idx,1);
                                            setEditing({...editing, steps:arr});
                                        }}>삭제</button>
                                    </div>
                                ))}
                            </div>
                        </div>

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
                            <div key={idx} style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px",gap:8,marginBottom:8}}>
                                <input placeholder="이름" value={g.name}
                                       onChange={e=>{const x=[...ingModal.list];x[idx].name=e.target.value;setIngModal(m=>({...m,list:x}));}}/>
                                <input placeholder="수량 (예: 1컵 / 300g)" value={g.amount||""}
                                       onChange={e=>{const x=[...ingModal.list];x[idx].amount=e.target.value;setIngModal(m=>({...m,list:x}));}}/>
                                <button className="danger" onClick={()=>{
                                    const x=[...ingModal.list]; x.splice(idx,1); setIngModal(m=>({...m,list:x}));
                                }}>삭제</button>
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

            {/* 태그 모달 */}
            {tagModal.open && (
                <div className="modal">
                    <div className="modal-card" style={{maxWidth:520}}>
                        <h3>태그 편집</h3>
                        <div style={{display:"flex", gap:8}}>
                            <input
                                placeholder="태그 입력 후 추가"
                                value={tagModal.input}
                                onChange={e=>setTagModal(m=>({...m, input:e.target.value}))}
                                onKeyDown={e=>e.key==='Enter' && addTag()}
                            />
                            <button onClick={addTag}>추가</button>
                        </div>
                        <div style={{marginTop:10, display:"flex", gap:8, flexWrap:"wrap"}}>
                            {tagModal.tags.map(t=>(
                                <span key={t} className="badge-soft" style={{display:"inline-flex", alignItems:"center", gap:6}}>
                  #{t}
                                    <button className="link danger" onClick={()=>removeTag(t)}>x</button>
                </span>
                            ))}
                            {tagModal.tags.length===0 && <div className="muted">태그가 없습니다.</div>}
                        </div>
                        <div className="actions" style={{marginTop:12}}>
                            <button onClick={()=>setTagModal({open:false, recipeId:null, tags:[], input:""})}>닫기</button>
                            <button className="primary" onClick={saveTagList}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
