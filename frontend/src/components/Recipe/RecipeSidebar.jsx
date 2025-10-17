import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RecipeSidebar.css";

export default function RecipeSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { path: "/recipe", label: "전체 레시피", exact: true },
        { path: "/recipe/recommend", label: "레시피 추천" },
        { path: "/recipe/my", label: "나만의 레시피" }, // NEW
    ];

    const isActive = (tab) => {
        if (tab.exact) return location.pathname === tab.path; // /recipe 는 정확히 일치할 때만
        return location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
    };

    return (
        <div className="recipe-sidebar">
            {tabs.map((tab) => (
                <div
                    key={tab.path}
                    role="button"
                    tabIndex={0}
                    className={`sidebar-link ${isActive(tab) ? "active" : ""}`}
                    onClick={() => navigate(tab.path)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(tab.path)}
                    aria-current={isActive(tab) ? "page" : undefined}
                >
                    {tab.label}
                </div>
            ))}
        </div>
    );
}
