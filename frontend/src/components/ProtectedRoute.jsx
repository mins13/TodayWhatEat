import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    const alertedRef = useRef(false); // 🚨 alert 실행 여부 추적

    useEffect(() => {
        if (!token && !alertedRef.current) {
            alert("로그인이 필요합니다!");
            alertedRef.current = true; // 다시는 alert 안 뜨게!
        }
    }, [token]);

    if (!token) {
        return <Navigate to="/login" />;
    }

    return children;
}

export default ProtectedRoute;
