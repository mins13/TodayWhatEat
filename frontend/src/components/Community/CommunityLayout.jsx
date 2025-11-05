import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./CommunityLayout.css";

export default function CommunityLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { path: "/community/notice", label: "공지사항" },
        { path: "/community/free", label: "자유 게시판" },
        { path: "/community/recipe", label: "레시피 게시판" },
        { path: "/community/info", label: "정보 게시판" },
    ];

    return (
        <div className="sidebar">
            {tabs.map((tab) => (
                <div
                    key={tab.path}
                    className={`sidebar-item ${
                        location.pathname === tab.path ? "active" : ""
                    }`}
                    onClick={() => navigate(tab.path)}
                >
                    {tab.label}
                </div>
            ))}
        </div>
    );
}
