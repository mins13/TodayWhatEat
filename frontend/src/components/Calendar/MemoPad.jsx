// src/components/MemoPad/MemoPad.jsx
import React, { useEffect, useRef, useState } from "react";
import { getUserMemo, saveUserMemo } from "../../api/memoApi";
import "./MemoPad.css";

export default function MemoPad() {
    const [memo, setMemo] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | saving | saved | error
    const timer = useRef(null);

    const hasToken = () =>
            !!(
                sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") ||
                 localStorage.getItem("token")
               );

    // 1) 최초 로드: 서버에서 불러오기
    useEffect(() => {
        if (!hasToken()) {
                  setStatus("idle");
                  return;
                }
        let mounted = true;
        (async () => {
            try {
                setStatus("loading");
                const res = await getUserMemo(); // { content, updatedAt }
                if (!mounted) return;
                setMemo(res?.content || "");
                setStatus("idle");
            } catch (e) {
                console.error(e);
                if (!mounted) return;
                setStatus("error");
            }
        })();
        return () => { mounted = false; };
    }, []);

    // 2) 입력 시 600ms 디바운스로 자동 저장
    useEffect(() => {
        if (!hasToken()) {
                 setStatus("idle");
                 return;
               }
        if (timer.current) clearTimeout(timer.current);
        setStatus((s) => (s === "loading" ? "loading" : "saving"));
        timer.current = setTimeout(async () => {
            try {
                await saveUserMemo(memo);
                setStatus("saved");
                setTimeout(() => setStatus("idle"), 800);
            } catch (e) {
                console.error(e);
                setStatus("error");
            }
        }, 600);
        return () => clearTimeout(timer.current);
    }, [memo]);

    // (선택) 수동 저장 단축키 Ctrl/Cmd+S
    useEffect(() => {
        const onKeyDown = async (e) => {
            const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
            if (!isSave) return;
            e.preventDefault();

            if (!hasToken()) return; // 비로그인 시 저장 안 함
            try {
                setStatus("saving");
                await saveUserMemo(memo);
                setStatus("saved");
                setTimeout(() => setStatus("idle"), 800);
            } catch (e2) {
                console.error(e2);
                setStatus("error");
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [memo]);

    const clearMemo = async () => {
        try {
            setMemo("");
            if (hasToken()) {
                       setStatus("saving");
                       await saveUserMemo("");
                       setStatus("saved");
                       setTimeout(() => setStatus("idle"), 800);
                     } else {
                       setStatus("idle");
                     }
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="memo-pad-container">
            <div className="memo-pad-header">
                <h3>📝 메모장</h3>
                <div className={`memo-status ${status}`}>
                    {status === "loading" && "불러오는 중..."}
                    {status === "saving" && "저장 중..."}
                    {status === "saved"  && "저장됨"}
                    {status === "error"  && "오류"}
                </div>
            </div>

            <textarea
                placeholder="자유롭게 메모를 작성해보세요."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
            />

            <div className="memo-actions">
                <button
                    type="button"
                    className="btn-outline"
                    onClick={clearMemo}
                >
                    내용 비우기
                </button>
            </div>
        </div>
    );
}
