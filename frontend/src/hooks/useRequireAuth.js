import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useRequireAuth(options) {
    const {
        alert = true,
        message = "로그인이 필요합니다!",
        redirect = "/login",
    } = options || {};

    const navigate = useNavigate();
    const location = useLocation();

    const [ready, setReady] = useState(false); // 렌더 잠깐 막기
    const didRun = useRef(false);              // 중복 실행 방지

    useEffect(() => {
        if (didRun.current) return;
        didRun.current = true;

        const token = localStorage.getItem("token");
        if (!token) {
            // 다음 틱에 실행(렌더 블로킹/경고 순서 안정화)
            setTimeout(() => {
                if (alert) window.alert(message);
                navigate(redirect, { replace: true, state: { from: location } });
            }, 0);
            return; // ready=false 유지 → 화면 비우기
        }
        setReady(true);
    }, [navigate, location, alert, message, redirect]);

    return ready;
}
