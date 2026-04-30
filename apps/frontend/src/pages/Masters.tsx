import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Master } from '../api';
import {
    Plus, Trash2, UserCog, MoreHorizontal, ChevronRight,
    Activity, DollarSign, Users, Search, RefreshCw
} from 'lucide-react';

export default function Masters() {
    const navigate = useNavigate();
    const [masters, setMasters] = useState<Master[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newMaster, setNewMaster] = useState({
        name: '', broker: 'metatrader', credentials: {}, config: {}
    });

    useEffect(() => { fetchMasters(); }, []);

    const fetchMasters = async () => {
        setLoading(true);
        try {
            const r = await api.get<Master[]>('/masters');
            setMasters(r.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/masters', newMaster);
            setIsCreating(false);
            setNewMaster({ name: '', broker: 'metatrader', credentials: {}, config: {} });
            fetchMasters();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create master');
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Supprimer ce master ?')) return;
        try {
            await api.delete(`/masters/${id}`);
            fetchMasters();
        } catch { /* silent */ }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            ACTIVE: 'badge-active', PENDING: 'badge-pending',
            PAUSED: 'badge-paused', STOPPED: 'badge-stopped',
        };
        return `badge ${map[status] || 'badge-pending'}`;
    };

    const filtered = masters.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.broker?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>Masters</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {masters.length} compte{masters.length !== 1 ? 's' : ''} master configuré{masters.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={fetchMasters}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsCreating(!isCreating)}>
                        <Plus size={15} />
                        Nouveau Master
                    </button>
                </div>
            </div>

            {/* Create form */}
            {isCreating && (
                <div className="card animate-in">
                    <div className="card-header" style={{ paddingBottom: 16 }}>
                        <div className="card-title">
                            <UserCog size={15} style={{ color: 'var(--primary)' }} />
                            Nouveau compte Master
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => setIsCreating(false)}>
                            Annuler
                        </button>
                    </div>
                    <div className="divider" />
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Nom du compte</label>
                                    <input className="form-control" placeholder="ex: FTMO Master 1"
                                        value={newMaster.name}
                                        onChange={e => setNewMaster({ ...newMaster, name: e.target.value })}
                                        required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Broker</label>
                                    <select className="form-control"
                                        value={newMaster.broker}
                                        onChange={e => setNewMaster({ ...newMaster, broker: e.target.value })}>
                                        <option value="metatrader">MetaTrader</option>
                                        <option value="binance">Binance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Login MT5</label>
                                    <input className="form-control" placeholder="ex: 123456"
                                        onChange={e => setNewMaster({ ...newMaster, credentials: { ...newMaster.credentials, login: e.target.value } })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input className="form-control" type="password" placeholder="••••••••"
                                        onChange={e => setNewMaster({ ...newMaster, credentials: { ...newMaster.credentials, password: e.target.value } })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreating(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Création...' : 'Créer le Master'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                    { label: 'Total Masters',   value: masters.length, icon: UserCog,   color: 'icon-wrap-blue' },
                    { label: 'Masters Actifs',  value: masters.filter(m => (m as any).status === 'ACTIVE').length, icon: Activity, color: 'icon-wrap-green' },
                    { label: 'Balance Totale',  value: `$${masters.reduce((a, m) => a + Number((m as any).balance || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'icon-wrap-orange' },
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

            {/* Table card */}
            <div className="card">
                <div className="card-header" style={{ paddingBottom: 14 }}>
                    <div className="card-title">
                        <UserCog size={14} style={{ color: 'var(--primary)' }} />
                        Liste des Masters
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
                                <th>Nom</th>
                                <th>Broker</th>
                                <th>Platform</th>
                                <th>Balance</th>
                                <th>Equity</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <UserCog size={32} />
                                            <p>Aucun master trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(m => (
                                <tr key={m.id} onClick={() => navigate(`/masters/${m.id}`)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="icon-wrap icon-wrap-blue" style={{ width: 32, height: 32, borderRadius: 8 }}>
                                                <UserCog size={14} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {m.id.slice(0, 8)}…</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{m.broker}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{(m as any).credentials?.platform?.toUpperCase() || 'MT5'}</td>
                                    <td style={{ fontWeight: 600 }}>${Number((m as any).balance || 0).toFixed(2)}</td>
                                    <td style={{ fontWeight: 600 }}>${Number((m as any).equity || 0).toFixed(2)}</td>
                                    <td><span className={getStatusBadge((m as any).status)}>{(m as any).status || 'PENDING'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                            <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/masters/${m.id}`)}>
                                                <ChevronRight size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}
                                                onClick={e => handleDelete(m.id, e)}>
                                                <Trash2 size={14} />
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
