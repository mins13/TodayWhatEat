import { NavLink, Outlet, useLocation } from "react-router-dom";
import "./admin.css";

const MENUS = [
    { to: "/admin", label: "대시보드", icon: "🏠", end: true },
    { to: "/admin/users", label: "유저 관리", icon: "👥" },
    { to: "/admin/posts", label: "게시글 관리", icon: "📝" },
    { to: "/admin/approvals/recipes", label: "레시피 승인", icon: "🍳" },
    { to: "/admin/recipes", label: "레시피 관리", icon: "🧂" },
    { to: "/admin/notices", label: "공지 등록", icon: "📢" },
];

export default function AdminLayout() {
    const { pathname } = useLocation();
    const current = MENUS.find(m =>
        m.end ? pathname === m.to : pathname.startsWith(m.to)
    );

    return (
        <div className="admin-shell">
            {/* 좌측 네비 */}
            <aside className="admin-side">
                <div className="brand">
                    <span className="brand-logo">🍽️</span>
                    <div className="brand-text">
                        <b>오늘 뭐 먹지?</b>
                        <small>Admin Console</small>
                    </div>
                </div>

                <nav className="menu">
                    {MENUS.map(m => (
                        <NavLink
                            key={m.to}
                            to={m.to}
                            end={!!m.end}
                            className={({ isActive }) =>
                                "menu-item" + (isActive ? " active" : "")
                            }
                        >
                            <span className="menu-ic">{m.icon}</span>
                            <span className="menu-tx">{m.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="side-footer">
                    <div className="muted">v1.0.0</div>
                </div>
            </aside>

            {/* 우측 컨텐츠 */}
            <main className="admin-main">
                <header className="topbar">
                    <div className="crumb">
                        관리자 &nbsp; / &nbsp;<b>{current?.label ?? "콘솔"}</b>
                    </div>
                    <div className="top-actions">
                        {/* 필요 시 토글/버튼 추가 */}
                        <span className="badge-role">ADMIN</span>
                    </div>
                </header>

                <section className="admin-content">
                    <Outlet />
                </section>
            </main>
        </div>
    );
}
