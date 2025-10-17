import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RecipeSidebar from "../../components/Recipe/RecipeSidebar";
import { createDraft, updateDraft, getDraft, uploadDraftImage } from "../../api/recipeDraftApi";
import "./MyRecipeEditorPage.css";

export default function MyRecipeEditorPage(){
    const { draftId } = useParams();
    const navigate = useNavigate();

    const empty = { title:"", imageUrl:"", ingredients:[], steps:[] };
    const [form, setForm] = useState(empty);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(!!draftId);

    useEffect(()=> {
        if(!draftId){ setPreviewUrl(""); return; }
        (async()=>{
            try{
                const d = await getDraft(draftId);
                setForm({
                    title: d.title || "",
                    imageUrl: d.imageUrl || "",
                    ingredients: (d.ingredients||[]).map((g,i)=>({
                        name:g.name||"", quantity:g.quantity||"", unit:g.unit||"", sortOrder:i+1
                    })),
                    steps: (d.steps||[]).map((s,i)=>({ content:s.content||"", sortOrder:i+1 })),
                });
                setPreviewUrl(d.imageUrl || "");
            } finally { setLoading(false); }
        })();
    }, [draftId]);

    const setField = (k,v)=> setForm(f=>({...f,[k]:v}));
    const addIng  = ()=> setForm(f=>({...f, ingredients:[...f.ingredients, {name:"",quantity:"",unit:"",sortOrder:f.ingredients.length+1}]}));
    const delIng  = (i)=> setForm(f=>({...f, ingredients:f.ingredients.filter((_,idx)=>idx!==i)}));
    const addStep = ()=> setForm(f=>({...f, steps:[...f.steps, {content:"",sortOrder:f.steps.length+1}]}));
    const delStep = (i)=> setForm(f=>({...f, steps:f.steps.filter((_,idx)=>idx!==i)}));

    const onChangeImageUrl = (v)=>{
        setField("imageUrl", v);
        if(!imageFile) setPreviewUrl(v || "");
    };

    const onPickFile = (file)=>{
        setImageFile(file || null);
        if(file){
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(form.imageUrl || "");
        }
    };

    const buildPayload = ()=>({
        title: form.title.trim(),
        imageUrl: form.imageUrl.trim(), // 파일 업로드 시 save()에서 덮어씀
        ingredients: form.ingredients.map((g,i)=>({ ...g, sortOrder:i+1 })),
        steps: form.steps.map((s,i)=>({ ...s, sortOrder:i+1 })),
    });

    const save = async ()=>{
        if(!form.title.trim()){ alert("제목을 입력하세요."); return; }
        let payload = buildPayload();

        if(imageFile){
            try{
                const url = await uploadDraftImage(imageFile);
                if(url) payload.imageUrl = url;
            }catch(e){
                console.error(e);
                alert("이미지 업로드에 실패했어요.");
                return;
            }
        }

        if(draftId){
            await updateDraft(draftId, payload);
            alert("수정 저장 완료");
        }else{
            await createDraft(payload);
            alert("초안 저장 완료");
        }
        navigate("/recipe/my");
    };

    if(loading){
        return (
            <div className="main-container">
                <div className="community-wrapper">
                    <div className="left-panel"><RecipeSidebar/></div>
                    <div className="right-panel">로딩...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="community-wrapper">
                <div className="left-panel"><RecipeSidebar/></div>

                <div className="right-panel">
                    <div className="write-head">
                        <h2 className="main-recipe-title">{draftId ? "레시피 수정" : "레시피 작성"}</h2>
                        <div className="spacer" />
                        <button className="btn" onClick={()=>navigate("/recipe/my")}>목록으로</button>
                        <button className="btn primary" onClick={save}>초안 저장</button>
                    </div>

                    <div className="write-card">
                        <div className="grid">
                            {/* 제목 */}
                            <label>제목
                                <input value={form.title} onChange={e=>setField("title", e.target.value)} />
                            </label>

                            {/* 이미지 URL + 파일 업로드 (같은 줄) */}
                            <label>대표이미지 URL(선택)
                                <div className="img-row">
                                    <input
                                        value={form.imageUrl}
                                        onChange={e=>onChangeImageUrl(e.target.value)}
                                        placeholder="https://…"
                                    />
                                    <label className="btn file-btn">
                                        파일 선택
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e)=>onPickFile(e.target.files?.[0] || null)}
                                            hidden
                                        />
                                    </label>
                                </div>
                                {previewUrl && (
                                    <div className="preview"><img src={previewUrl} alt="미리보기" /></div>
                                )}
                            </label>
                        </div>

                        {/* 재료 */}
                        <h4>재료</h4>
                        <div className="section-list">
                            {form.ingredients.map((g, i) => (
                                <div className="ing-row" key={i}>
                                    <span className="idx">{i + 1}</span>

                                    <input
                                        className="input name"
                                        placeholder="이름"
                                        value={g.name}
                                        onChange={(e) => {
                                            const x = [...form.ingredients];
                                            x[i].name = e.target.value;
                                            setField("ingredients", x);
                                        }}
                                    />
                                    <input
                                        className="input qty"
                                        placeholder="수량"
                                        value={g.quantity}
                                        onChange={(e) => {
                                            const x = [...form.ingredients];
                                            x[i].quantity = e.target.value;
                                            setField("ingredients", x);
                                        }}
                                    />
                                    <input
                                        className="input unit"
                                        placeholder="단위"
                                        value={g.unit}
                                        onChange={(e) => {
                                            const x = [...form.ingredients];
                                            x[i].unit = e.target.value;
                                            setField("ingredients", x);
                                        }}
                                    />

                                    {/* ⬇️ 삭제 버튼을 행 내부 마지막 칸에 */}
                                    <button
                                        className="icon-btn danger"
                                        onClick={() => delIng(i)}
                                        aria-label="재료 삭제"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="btn ghost" onClick={addIng}>+ 재료 추가</button>

                        {/* 조리 단계 */}
                        <h4>조리 단계</h4>
                        <div className="section-list">
                            {form.steps.map((s, i) => (
                                <div className="step-row" key={i}>
                                    <span className="idx">{i + 1}</span>
                                    <input
                                        className="input step"
                                        placeholder="내용"
                                        value={s.content}
                                        onChange={(e) => {
                                            const x = [...form.steps];
                                            x[i].content = e.target.value;
                                            setField("steps", x);
                                        }}
                                    />
                                    <button
                                        className="icon-btn danger"
                                        onClick={() => delStep(i)}
                                        aria-label="단계 삭제"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="btn ghost" onClick={addStep}>+ 단계 추가</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
