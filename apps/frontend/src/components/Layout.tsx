import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, UserCog, Settings, Briefcase,
    ShieldCheck, BarChart2, ChevronRight, ChevronDown,
    CreditCard, Award, Trophy, List, Rss, Calendar,
    Monitor, Calculator, TrendingUp, LogOut
} from 'lucide-react';

const MENU_ITEMS = [
    { to: '/',         label: 'Accounts Overview', icon: LayoutDashboard },
    { to: '/masters',  label: 'Masters',           icon: UserCog },
    { to: '/slaves',   label: 'Slaves',            icon: Users },
    { to: '/traders',  label: 'Traders',           icon: Briefcase },
    { to: '/users',    label: 'Utilisateurs',      icon: Users },
];

const APP_ITEMS = [
    { to: '/prop-firm-protection', label: 'PropFirm Shield', icon: ShieldCheck },
    { to: '/settings',             label: 'Settings',        icon: Settings },
];

const Layout: React.FC = () => {
    const location = useLocation();
    const [accountOpen, setAccountOpen] = useState(false);

    const isActive = (to: string) =>
        to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

    return (
        <div className="app-shell">
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <aside className="sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-text">
                        <div className="sidebar-logo-icon">
                            <BarChart2 size={15} />
                        </div>
                        Trading
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>

                {/* MENU section */}
                <p className="sidebar-section-label">Menu</p>
                <nav className="sidebar-nav">
                    {MENU_ITEMS.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`sidebar-nav-item ${isActive(to) ? 'active' : ''}`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* APPS section */}
                <p className="sidebar-section-label">Apps</p>
                <nav className="sidebar-nav">
                    {APP_ITEMS.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`sidebar-nav-item ${isActive(to) ? 'active' : ''}`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Account info box */}
                <div className="sidebar-account-box">
                    <div className="sidebar-account-row">
                        <span style={{ color: 'var(--text-muted)' }}>Account</span>
                        <strong>Admin</strong>
                    </div>
                    <div className="sidebar-account-row">
                        <span style={{ color: 'var(--text-muted)' }}>Status</span>
                        <span>
                            <span className="status-dot" />
                            <strong style={{ color: 'var(--success)' }}>Active</strong>
                        </span>
                    </div>
                    <div className="sidebar-account-row">
                        <span style={{ color: 'var(--text-muted)' }}>Mode</span>
                        <strong>Live</strong>
                    </div>
                </div>

                {/* User profile */}
                <div className="sidebar-user" onClick={() => setAccountOpen(!accountOpen)}>
                    <div className="sidebar-user-avatar">AD</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">Admin</div>
                        <div className="sidebar-user-email">admin@copytrade.io</div>
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
            </aside>

            {/* ── Main ────────────────────────────────────────────────────── */}
            <div className="main-content">
                <main className="page-body animate-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
