import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RecipeSidebar.css";

export default function RecipeSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { path: "/recipe", label: "전체 레시피" },
        { path: "/recipe/recommend", label: "레시피 추천" },
    ];

    return (
        <div className="recipe-sidebar">
            {tabs.map((tab) => (
                <div
                    key={tab.path}
                    className={`sidebar-link ${location.pathname === tab.path ? "active" : ""}`}
                    onClick={() => navigate(tab.path)}
                >
                    {tab.label}
                </div>
            ))}
        </div>
    );
}
