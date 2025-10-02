import { useEffect, useState } from "react";
import { createDraft, updateDraft, submitDraft, fetchMyDrafts } from "../../api/recipeDraftApi";
import "./MyRecipePage.css";

export default function MyRecipePage(){
    const empty = { title:"", description:"", imageUrl:"", tags:[], ingredients:[], steps:[] };
    const [form, setForm] = useState(empty);
    const [list, setList] = useState(null);

    const load = async () => setList(await fetchMyDrafts(0,20));
    useEffect(()=>{ load(); },[]);

    const addIng = () => setForm(f => ({...f, ingredients:[...f.ingredients, {name:"",quantity:"",unit:"",sortOrder:f.ingredients.length}]}));
    const addStep= () => setForm(f => ({...f, steps:[...f.steps, {stepOrder:f.steps.length+1, content:""}]}));

    const save = async () => {
        const payload = {...form, tags: (form.tagsText||"").split(",").map(s=>s.trim()).filter(Boolean)};
        await createDraft(payload);
        setForm(empty); await load(); alert("초안 저장 완료");
    };

    const submit = async (id) => {
        await submitDraft(id);
        await load(); alert("승인 요청 완료");
    };

    return (
        <div className="recipe-draft-shell">
            <h2>나만의 레시피 만들기</h2>
            <div className="card">
                <div className="grid">
                    <label>제목<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
                    <label>대표이미지 URL<input value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})}/></label>
                    <label>태그(콤마구분)<input value={form.tagsText||""} onChange={e=>setForm({...form,tagsText:e.target.value})}/></label>
                    <label>설명<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
                </div>

                <h4>재료</h4>
                {form.ingredients.map((g,i)=>(
                    <div className="row" key={i}>
                        <input placeholder="이름" value={g.name} onChange={e=>{const x=[...form.ingredients];x[i].name=e.target.value;setForm({...form,ingredients:x});}}/>
                        <input placeholder="수량" value={g.quantity} onChange={e=>{const x=[...form.ingredients];x[i].quantity=e.target.value;setForm({...form,ingredients:x});}}/>
                        <input placeholder="단위" value={g.unit} onChange={e=>{const x=[...form.ingredients];x[i].unit=e.target.value;setForm({...form,ingredients:x});}}/>
                    </div>
                ))}
                <button onClick={addIng}>+ 재료 추가</button>

                <h4>조리 단계</h4>
                {form.steps.map((s,i)=>(
                    <div className="row" key={i}>
                        <span className="badge">{i+1}</span>
                        <input placeholder="내용" value={s.content} onChange={e=>{const x=[...form.steps];x[i].content=e.target.value;setForm({...form,steps:x});}}/>
                    </div>
                ))}
                <button onClick={addStep}>+ 단계 추가</button>

                <div className="actions">
                    <button className="primary" onClick={save}>초안 저장</button>
                </div>
            </div>

            <h3 style={{marginTop:24}}>내 초안 목록</h3>
            {!list ? "로딩..." : (
                <table className="tbl">
                    <thead><tr><th>ID</th><th>제목</th><th>상태</th><th>승인결과</th><th>액션</th></tr></thead>
                    <tbody>
                    {list.content.map(d=>(
                        <tr key={d.id}>
                            <td>{d.id}</td>
                            <td>{d.title}</td>
                            <td><span className={`chip ${d.status.toLowerCase()}`}>{d.status}</span></td>
                            <td>{d.status==="REJECTED" ? d.rejectionReason : (d.publishedRecipeId ? `등록됨(#${d.publishedRecipeId})` : "-")}</td>
                            <td>
                                {(d.status==="DRAFT" || d.status==="REJECTED") &&
                                    <button onClick={()=>submit(d.id)}>승인요청</button>}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}