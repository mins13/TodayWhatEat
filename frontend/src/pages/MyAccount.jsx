// src/pages/Account/MyAccount.jsx
import React, { useEffect, useState } from "react";
import { fetchMe, updateNickname, changePassword, deleteAccount } from "../api/userApi";
import { useNavigate } from "react-router-dom";
import "./MyAccount.css";

export default function MyAccount() {
    const nav = useNavigate();
    const [me, setMe] = useState(null);
    const [nick, setNick] = useState("");
    const [cpw, setCpw] = useState("");      // current
    const [npw, setNpw] = useState("");      // new
    const [npw2, setNpw2] = useState("");    // confirm
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchMe();
                setMe(data);
                setNick(data.nickname || "");
            } catch (e) {
                alert("로그인이 필요합니다.");
                nav("/login");
            }
        })();
    }, [nav]);

    const onSave = async () => {
        setMsg("");
        setSaving(true);
        try {
            // 1) 닉네임 변경 (값이 바뀐 경우만)
            if (nick.trim() !== (me?.nickname || "")) {
                const updated = await updateNickname(nick.trim());
                setMe(updated);
                localStorage.setItem("nickname", updated.nickname || "");
            }
            // 2) 비밀번호 변경 (현재 비번이 채워졌으면 시도)
            if (cpw || npw || npw2) {
                if (!cpw) throw new Error("현재 비밀번호를 입력하세요.");
                if (!npw) throw new Error("새 비밀번호를 입력하세요.");
                if (npw.length < 6) throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
                if (npw !== npw2) throw new Error("새 비밀번호 확인이 일치하지 않습니다.");
                await changePassword(cpw, npw);
                setCpw(""); setNpw(""); setNpw2("");
            }
            setMsg("저장되었습니다.");
        } catch (e) {
            setMsg(e?.response?.data?.message || e.message || "오류가 발생했습니다.");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        const ok = window.confirm(
            "정말 탈퇴하시겠어요?\n모든 정보는 즉시 삭제되며 복구가 불가능합니다."
        );
        if (!ok) return;
        try {
            await deleteAccount();
            // 클라이언트 토큰/닉네임 정리
            localStorage.removeItem("token");
            localStorage.removeItem("nickname");
            localStorage.removeItem("role");
            alert("탈퇴가 완료되었습니다.");
            nav("/");
            window.location.reload();
        } catch (e) {
            alert(e?.response?.data?.message || "탈퇴 중 오류가 발생했습니다.");
        }
    };

    if (!me) return null;

    return (
        <div className="account-wrap">
            <h2>내 정보</h2>

            <div className="card">
                <div className="field">
                    <label>이메일</label>
                    <input value={me.email || ""} readOnly />
                </div>
                <div className="field">
                    <label>아이디</label>
                    <input value={me.username || ""} readOnly />
                </div>
                <div className="field">
                    <label>닉네임</label>
                    <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} />
                </div>
            </div>

            <div className="card">
                <h3>비밀번호 변경</h3>
                <div className="field">
                    <label>현재 비밀번호</label>
                    <input type="password" value={cpw} onChange={(e) => setCpw(e.target.value)} />
                </div>
                <div className="field">
                    <label>새 비밀번호</label>
                    <input type="password" value={npw} onChange={(e) => setNpw(e.target.value)} />
                </div>
                <div className="field">
                    <label>새 비밀번호 확인</label>
                    <input type="password" value={npw2} onChange={(e) => setNpw2(e.target.value)} />
                </div>
            </div>

            {!!msg && <div className="msg">{msg}</div>}

            <div className="actions">
                <button className="btn-primary" onClick={onSave} disabled={saving}>
                    {saving ? "저장 중..." : "저장"}
                </button>
            </div>

            <button className="danger-link" onClick={onDelete}>
                탈퇴
            </button>
        </div>
    );
}
