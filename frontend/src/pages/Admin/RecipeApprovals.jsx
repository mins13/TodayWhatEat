import { useEffect, useState } from "react";
import { fetchPendingDrafts, approveDraft, rejectDraft } from "../../api/adminRecipeDraftApi";

export default function RecipeApprovals(){
    const [data, setData] = useState(null);
    const [reason, setReason] = useState("");

    const load = async()=> setData(await fetchPendingDrafts());
    useEffect(()=>{ load(); },[]);

    const onApprove = async(id)=>{ await approveDraft(id); await load(); alert("승인 완료"); };
    const onReject  = async(id)=>{ await rejectDraft(id, reason || "형식 미흡"); setReason(""); await load(); alert("반려 완료"); };

    if(!data) return "로딩...";
    return (
        <div>
            <h2>레시피 승인 대기</h2>
            <table className="tbl">
                <thead><tr><th>ID</th><th>제목</th><th>태그</th><th>미리보기</th><th>승인/반려</th></tr></thead>
                <tbody>
                {data.content.map(d=>(
                    <tr key={d.id}>
                        <td>{d.id}</td>
                        <td>{d.title}</td>
                        <td>{d.tags.join(", ")}</td>
                        <td>
                            <details>
                                <summary>열기</summary>
                                {d.imageUrl && <img src={d.imageUrl} alt="" style={{maxWidth:200}}/>}
                                <p>{d.description}</p>
                                <b>재료</b>
                                <ul>{d.ingredients.map(i=><li key={i.id}>{i.name} {i.quantity}{i.unit}</li>)}</ul>
                                <b>단계</b>
                                <ol>{d.steps.map(s=><li key={s.id}>{s.content}</li>)}</ol>
                            </details>
                        </td>
                        <td>
                            <div style={{display:"flex", gap:8}}>
                                <button className="primary" onClick={()=>onApprove(d.id)}>승인</button>
                                <input placeholder="반려 사유" value={reason} onChange={e=>setReason(e.target.value)} />
                                <button className="danger" onClick={()=>onReject(d.id)}>반려</button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}