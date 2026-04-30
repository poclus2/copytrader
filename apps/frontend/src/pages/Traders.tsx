import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Briefcase, Search, RefreshCw, ChevronRight, DollarSign, Activity, Users, TrendingUp } from 'lucide-react';

interface Trader {
    id: string;
    name: string;
    email?: string;
    strategy?: string;
    totalReturn?: number;
    winRate?: number;
    followers?: number;
    aum?: number;
    status?: string;
}

export default function Traders() {
    const navigate = useNavigate();
    const [traders, setTraders] = useState<Trader[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchTraders(); }, []);

    const fetchTraders = async () => {
        setLoading(true);
        try { const r = await api.get<Trader[]>('/traders'); setTraders(r.data); }
        catch { /* silent */ } finally { setLoading(false); }
    };

    const filtered = traders.filter(t =>
        (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.strategy || '').toLowerCase().includes(search.toLowerCase())
    );

    const getReturnColor = (ret?: number) => {
        if (!ret) return 'var(--text-muted)';
        return ret >= 0 ? 'var(--success)' : 'var(--danger)';
    };

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>Traders</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {traders.length} trader{traders.length !== 1 ? 's' : ''} référencé{traders.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={fetchTraders}>
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                    { label: 'Total Traders',    value: traders.length, icon: Briefcase,  color: 'icon-wrap-blue' },
                    { label: 'Actifs',           value: traders.filter(t => t.status === 'ACTIVE').length, icon: Activity, color: 'icon-wrap-green' },
                    { label: 'Total Followers',  value: traders.reduce((a, t) => a + (t.followers || 0), 0), icon: Users, color: 'icon-wrap-purple' },
                    { label: 'AUM Total',        value: `$${traders.reduce((a, t) => a + (t.aum || 0), 0).toFixed(0)}`, icon: DollarSign, color: 'icon-wrap-orange' },
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
                        <Briefcase size={14} style={{ color: 'var(--primary)' }} />
                        Leaderboard des Traders
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
                                <th>#</th>
                                <th>Trader</th>
                                <th>Stratégie</th>
                                <th>Retour Total</th>
                                <th>Win Rate</th>
                                <th>Followers</th>
                                <th>AUM</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8}>
                                    <div className="empty-state">
                                        <Briefcase size={32} />
                                        <p>Aucun trader trouvé</p>
                                    </div>
                                </td></tr>
                            ) : filtered.map((t, i) => (
                                <tr key={t.id} onClick={() => navigate(`/traders/${t.id}`)}>
                                    <td>
                                        <span style={{
                                            fontSize: 12, fontWeight: 700,
                                            color: i < 3 ? 'var(--primary)' : 'var(--text-muted)'
                                        }}>#{i + 1}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontSize: 12, fontWeight: 700
                                            }}>
                                                {(t.name || 'T')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.email || '—'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t.strategy || 'Swing Trading'}</td>
                                    <td style={{ fontWeight: 700, color: getReturnColor(t.totalReturn) }}>
                                        {t.totalReturn !== undefined ? `${t.totalReturn > 0 ? '+' : ''}${t.totalReturn.toFixed(2)}%` : '—'}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {t.winRate !== undefined ? `${t.winRate.toFixed(1)}%` : '—'}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{t.followers || 0}</td>
                                    <td style={{ fontWeight: 600 }}>${(t.aum || 0).toFixed(0)}</td>
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
