import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Slave, Master, CreateSlaveDto } from '../api';
import {
    Plus, Trash2, Users, ShieldCheck, Search, RefreshCw,
    ChevronRight, Activity, DollarSign, Server,
    CheckCircle, XCircle, AlertTriangle, MoreHorizontal
} from 'lucide-react';
import { BROKERS } from '../brokers.config';

export default function Slaves() {
    const navigate = useNavigate();
    const [slaves, setSlaves] = useState<Slave[]>([]);
    const [masters, setMasters] = useState<Master[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');
    const [newSlave, setNewSlave] = useState<CreateSlaveDto>({
        name: '', broker: 'metatrader', credentials: {}, masterIds: [], isPropFirm: false,
        config: { mode: 'FIXED_RATIO', ratio: 1.0 },
    });

    useEffect(() => { fetchSlaves(); fetchMasters(); }, []);

    const fetchSlaves = async () => {
        setLoading(true);
        try { const r = await api.get<Slave[]>('/slaves'); setSlaves(r.data); }
        catch { /* silent */ } finally { setLoading(false); }
    };

    const fetchMasters = async () => {
        try {
            const r = await api.get<Master[]>('/masters');
            setMasters(r.data);
            // Présélectionner le premier master par défaut
            if (r.data.length > 0) setNewSlave(p => ({ ...p, masterIds: [r.data[0].id] }));
        } catch { /* silent */ }
    };

    const testConnection = async () => {
        setIsTestingConnection(true);
        setConnectionStatus('idle');
        try {
            const r = await api.post('/brokers/metatrader/verify-connection', {
                ...newSlave.credentials, platform: newSlave.credentials.platform || 'mt5'
            });
            if (r.data.success) {
                setConnectionStatus('valid');
                setConnectionMessage(`Connexion réussie · Balance: ${r.data.balance}`);
            } else {
                setConnectionStatus('invalid');
                setConnectionMessage(r.data.error || 'Connexion échouée');
            }
        } catch (e: any) {
            setConnectionStatus('error');
            setConnectionMessage(e.response?.data?.message || 'Erreur de connexion');
        } finally { setIsTestingConnection(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSlave.masterIds || newSlave.masterIds.length === 0) {
            alert('Veuillez sélectionner au moins un Master.');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/slaves', newSlave);
            setIsCreating(false);
            setNewSlave({ name: '', broker: 'metatrader', credentials: {}, masterIds: masters.length > 0 ? [masters[0].id] : [], isPropFirm: false, config: { mode: 'FIXED_RATIO', ratio: 1.0 } });
            setConnectionStatus('idle');
            fetchSlaves();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            alert(`Erreur: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Supprimer ce slave ?')) return;
        try { await api.delete(`/slaves/${id}`); fetchSlaves(); } catch { /* silent */ }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            ACTIVE: 'badge-active', PENDING: 'badge-pending',
            PAUSED: 'badge-paused', STOPPED: 'badge-stopped',
        };
        return `badge ${map[status] || 'badge-pending'}`;
    };

    const filtered = slaves.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        s.broker?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>Slaves</h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {slaves.length} compte{slaves.length !== 1 ? 's' : ''} slave · {slaves.filter((s: any) => s.isPropFirm).length} PropFirm
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={fetchSlaves}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsCreating(!isCreating)}>
                        <Plus size={15} />
                        Nouveau Slave
                    </button>
                </div>
            </div>

            {/* Create form */}
            {isCreating && (
                <div className="card animate-in">
                    <div className="card-header" style={{ paddingBottom: 16 }}>
                        <div className="card-title">
                            <Users size={15} style={{ color: 'var(--primary)' }} />
                            Nouveau compte Slave
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => setIsCreating(false)}>Annuler</button>
                    </div>
                    <div className="divider" />
                    <div className="card-body">
                        <form onSubmit={handleCreate}>
                            {/* PropFirm toggle */}
                            <div className={`toggle-wrap ${newSlave.isPropFirm ? 'active' : ''}`}
                                style={{ marginBottom: 16 }}
                                onClick={() => setNewSlave(p => ({ ...p, isPropFirm: !p.isPropFirm }))}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className={`icon-wrap ${newSlave.isPropFirm ? 'icon-wrap-blue' : 'icon-wrap-gray'}`}
                                        style={{ width: 32, height: 32, borderRadius: 8 }}>
                                        <ShieldCheck size={15} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: newSlave.isPropFirm ? 'var(--primary)' : 'var(--text-primary)' }}>
                                            Compte Prop Firm
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            Active le Shield (jitter, lot variation, equity guard)
                                        </div>
                                    </div>
                                </div>
                                <div className={`toggle-track ${newSlave.isPropFirm ? 'on' : ''}`}>
                                    <div className="toggle-thumb" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Nom du compte</label>
                                    <input className="form-control" placeholder="ex: Slave FTMO 1"
                                        value={newSlave.name}
                                        onChange={e => setNewSlave({ ...newSlave, name: e.target.value })}
                                        required />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">
                                        Masters à copier
                                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>Ctrl+clic pour sélection multiple</span>
                                    </label>
                                    <select className="form-control" multiple
                                        style={{ height: Math.min(masters.length * 36 + 8, 160) }}
                                        value={newSlave.masterIds || []}
                                        onChange={e => {
                                            const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                                            setNewSlave({ ...newSlave, masterIds: selected });
                                        }} required>
                                        {masters.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} — {m.broker}
                                            </option>
                                        ))}
                                    </select>
                                    {(newSlave.masterIds?.length ?? 0) > 0 && (
                                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {(newSlave.masterIds || []).map(id => {
                                                const m = masters.find(x => x.id === id);
                                                return m ? (
                                                    <span key={id} className="badge badge-active" style={{ fontSize: 10 }}>
                                                        {m.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Broker</label>
                                    <select className="form-control" value={newSlave.broker}
                                        onChange={e => setNewSlave({ ...newSlave, broker: e.target.value, credentials: {} })}>
                                        <option value="metatrader">MetaTrader</option>
                                        <option value="binance">Binance</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Copy Mode</label>
                                    <select className="form-control" value={newSlave.config?.mode || 'FIXED_RATIO'}
                                        onChange={e => setNewSlave({ ...newSlave, config: { ...newSlave.config, mode: e.target.value } })}>
                                        <option value="FIXED_RATIO">Fixed Ratio</option>
                                        <option value="FIXED_LOT">Fixed Lot</option>
                                        <option value="BALANCE_RATIO">Balance Ratio</option>
                                        <option value="EQUITY_RATIO">Equity Ratio</option>
                                    </select>
                                </div>

                                {/* MT credentials */}
                                {(newSlave.broker === 'metatrader' || BROKERS.some(b => b.id === newSlave.broker)) && (<>
                                    <div className="form-group">
                                        <label className="form-label">Login MT5</label>
                                        <input className="form-control" placeholder="ex: 123456"
                                            value={newSlave.credentials.login || ''}
                                            onChange={e => { setNewSlave({ ...newSlave, credentials: { ...newSlave.credentials, login: e.target.value } }); setConnectionStatus('idle'); }}
                                            required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input className="form-control" type="password" placeholder="••••••••"
                                            value={newSlave.credentials.password || ''}
                                            onChange={e => { setNewSlave({ ...newSlave, credentials: { ...newSlave.credentials, password: e.target.value } }); setConnectionStatus('idle'); }}
                                            required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Platform</label>
                                        <select className="form-control" value={newSlave.credentials.platform || 'mt5'}
                                            onChange={e => setNewSlave({ ...newSlave, credentials: { ...newSlave.credentials, platform: e.target.value } })}>
                                            <option value="mt5">MetaTrader 5</option>
                                            <option value="mt4">MetaTrader 4</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bridge IP (optionnel)</label>
                                        <input className="form-control" placeholder="127.0.0.1"
                                            value={newSlave.credentials.bridgeIp || ''}
                                            onChange={e => setNewSlave({ ...newSlave, credentials: { ...newSlave.credentials, bridgeIp: e.target.value } })} />
                                    </div>
                                </>)}
                            </div>

                            {/* Connection test */}
                            {newSlave.broker === 'metatrader' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                    <button type="button" className="btn btn-outline"
                                        onClick={testConnection}
                                        disabled={isTestingConnection || !newSlave.credentials.login || !newSlave.credentials.password}>
                                        <Server size={14} />
                                        {isTestingConnection ? 'Test en cours...' : 'Tester la connexion'}
                                    </button>
                                    {connectionStatus !== 'idle' && (
                                        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
                                            color: connectionStatus === 'valid' ? 'var(--success)' : 'var(--danger)' }}>
                                            {connectionStatus === 'valid' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {connectionMessage}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreating(false)}>Annuler</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Création...' : 'Créer le Slave'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                    { label: 'Total Slaves',    value: slaves.length,                                             icon: Users,      color: 'icon-wrap-blue' },
                    { label: 'Actifs',          value: slaves.filter((s: any) => s.status === 'ACTIVE').length,  icon: Activity,   color: 'icon-wrap-green' },
                    { label: 'PropFirm',        value: slaves.filter((s: any) => s.isPropFirm).length,           icon: ShieldCheck,color: 'icon-wrap-purple' },
                    { label: 'Balance Totale',  value: `$${slaves.reduce((a, s) => a + Number((s as any).balance || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'icon-wrap-orange' },
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

            {/* Table */}
            <div className="card">
                <div className="card-header" style={{ paddingBottom: 14 }}>
                    <div className="card-title">
                        <Users size={14} style={{ color: 'var(--primary)' }} />
                        Liste des Slaves
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
                                <th>Master</th>
                                <th>Broker</th>
                                <th>Type</th>
                                <th>Balance</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7}>
                                    <div className="empty-state"><Users size={32} /><p>Aucun slave trouvé</p></div>
                                </td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} onClick={() => navigate(`/slaves/${s.id}`)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className={`icon-wrap ${(s as any).isPropFirm ? 'icon-wrap-green' : 'icon-wrap-blue'}`}
                                                style={{ width: 32, height: 32, borderRadius: 8 }}>
                                                {(s as any).isPropFirm ? <ShieldCheck size={14} /> : <Users size={14} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                                                {(s as any).isPropFirm && (
                                                    <span className="badge badge-propfirm" style={{ fontSize: 9, padding: '1px 5px' }}>
                                                        <ShieldCheck size={8} /> PropFirm
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{(s as any).master?.name || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.broker}</td>
                                    <td>
                                        <span className={`badge ${(s as any).isPropFirm ? 'badge-propfirm' : 'badge-standard'}`}>
                                            {(s as any).isPropFirm ? 'PropFirm' : 'Standard'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>${Number((s as any).balance || 0).toFixed(2)}</td>
                                    <td><span className={getStatusBadge((s as any).status)}>{(s as any).status || 'PENDING'}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                            <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/slaves/${s.id}`)}>
                                                <ChevronRight size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }}
                                                onClick={e => handleDelete(s.id, e)}>
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
