import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./RecipeSidebar.css";

export default function RecipeSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    // 섹션/하위 메뉴 구조
    const sections = [
        { path: "/recipe", label: "전체 레시피", exact: true },
        { path: "/recipe/recommend", label: "레시피 추천" },
        {
            path: "/recipe/my",
            label: "나만의 레시피",
            children: [
                { path: "/recipe/my/approvals", label: "승인 신청 관리" }, // 하위 메뉴
            ],
        },
    ];

    const isActive = (p, exact = false) =>
        exact ? location.pathname === p : location.pathname === p || location.pathname.startsWith(p + "/");

    return (
        <nav className="recipe-sidebar" aria-label="레시피 내비게이션">
            {sections.map((sec) => {
                const parentActive = isActive(sec.path, !!sec.exact) || (sec.children ?? []).some((c) => isActive(c.path));
                return (
                    <div className="sidebar-section" key={sec.path}>
                        <div
                            role="button"
                            tabIndex={0}
                            className={`sidebar-link ${parentActive ? "active" : ""}`}
                            onClick={() => navigate(sec.path)}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(sec.path)}
                            aria-current={parentActive ? "page" : undefined}
                        >
                            {sec.label}
                        </div>

                        {sec.children && (
                            <div className="subnav" role="group" aria-label={`${sec.label} 하위 메뉴`}>
                                {sec.children.map((child) => {
                                    const childActive = isActive(child.path);
                                    return (
                                        <div
                                            key={child.path}
                                            role="button"
                                            tabIndex={0}
                                            className={`sub-link ${childActive ? "active" : ""}`}
                                            onClick={() => navigate(child.path)}
                                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(child.path)}
                                            aria-current={childActive ? "page" : undefined}
                                        >
                                            <span className="sub-bullet" aria-hidden>↳</span>
                                            {child.label}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
