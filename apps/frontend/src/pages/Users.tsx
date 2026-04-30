import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Users, Search, RefreshCw, ChevronRight, DollarSign, Activity, Plus } from 'lucide-react';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    createdAt?: string;
    balance?: number;
}

export default function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try { const r = await api.get<User[]>('/users'); setUsers(r.data); }
        catch { /* silent */ } finally { setLoading(false); }
    };

    const getInitials = (u: User) => {
        if (u.firstName && u.lastName) return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
        return u.email[0].toUpperCase();
    };

    const getRoleBadge = (role: string = 'user') => {
        if (role === 'admin') return 'badge badge-active';
        return 'badge badge-standard';
    };

    const filtered = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.lastName || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>Utilisateurs</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={fetchUsers}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                    { label: 'Total Users',  value: users.length, icon: Users, color: 'icon-wrap-blue' },
                    { label: 'Admins',       value: users.filter(u => u.role === 'admin').length, icon: Activity, color: 'icon-wrap-green' },
                    { label: 'Balance Cumulée', value: `$${users.reduce((a, u) => a + Number(u.balance || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'icon-wrap-orange' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className={`icon-wrap ${color}`} style={{ width: 40, height: 40, borderRadius: 10 }}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="stat-card-label">{label}</div>
                            <div className="stat-card-value" style={{ fontSize: 20 }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header" style={{ paddingBottom: 14 }}>
                    <div className="card-title">
                        <Users size={14} style={{ color: 'var(--primary)' }} />
                        Liste des Utilisateurs
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="form-control" placeholder="Rechercher..."
                            style={{ paddingLeft: 30, width: 200, height: 32, fontSize: 12 }}
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="divider" />
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                        Chargement...
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Balance</th>
                                <th>Inscrit le</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6}>
                                    <div className="empty-state"><Users size={32} /><p>Aucun utilisateur trouvé</p></div>
                                </td></tr>
                            ) : filtered.map(u => (
                                <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
                                            }}>
                                                {getInitials(u)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                                    {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email.split('@')[0]}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {u.id.slice(0, 8)}…</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.email}</td>
                                    <td><span className={getRoleBadge(u.role)}>{u.role || 'user'}</span></td>
                                    <td style={{ fontWeight: 600 }}>${Number(u.balance || 0).toFixed(2)}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-icon">
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
