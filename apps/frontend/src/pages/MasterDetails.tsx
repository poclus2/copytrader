import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Master } from '../api';
import {
    ArrowLeft, Save, Trash2, CheckCircle, XCircle, AlertTriangle,
    RefreshCw, UserCog, DollarSign, TrendingUp, TrendingDown,
    Server, Settings, Activity, ChevronLeft, ChevronRight, Monitor
} from 'lucide-react';
import { BROKERS } from '../brokers.config';
import ErrorBoundary from '../components/ErrorBoundary';

// ── Inline Trade History ────────────────────────────────────────────────────
function TradeRow({ trade }: { trade: any }) {
    const isProfit = Number(trade.profit) >= 0;
    return (
        <tr>
            <td>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{trade.symbol}</div>
                {trade.ticket && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{trade.ticket}</div>}
            </td>
            <td>
                <span className={`badge ${trade.type === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>
                    {trade.type}
                </span>
            </td>
            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{trade.volume}</td>
            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{trade.openPrice}</td>
            <td>
                <span className={`badge ${trade.status === 'CLOSED' ? 'badge-standard' : 'badge-active'}`}>
                    {trade.status}
                </span>
            </td>
            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {trade.openTime ? new Date(trade.openTime).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
            </td>
            <td style={{ fontWeight: 700, fontFamily: 'monospace', color: isProfit ? 'var(--success)' : 'var(--danger)', textAlign: 'right' }}>
                {trade.profit !== undefined ? `${isProfit ? '+' : ''}${Number(trade.profit).toFixed(2)}` : '—'}
            </td>
        </tr>
    );
}

export default function MasterDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [master, setMaster] = useState<Master | null>(null);
    const [trades, setTrades] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');
    const [accountInfo, setAccountInfo] = useState({ balance: 0, equity: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'connection'>('profile');

    useEffect(() => { fetchMaster(); fetchTrades(1); }, [id]);
    useEffect(() => { if (master?.credentials?.bridgeIp) fetchAccountInfo(); }, [master]);

    const fetchMaster = async () => {
        try {
            const r = await api.get<Master>(`/masters/${id}`);
            setMaster(r.data);
        } catch { navigate('/masters'); }
        finally { setIsLoading(false); }
    };

    const fetchTrades = async (page = 1) => {
        try {
            const r = await api.get(`/masters/${id}/trades?page=${page}&limit=20`);
            if (r.data?.data && Array.isArray(r.data.data)) {
                setTrades(r.data.data); setTotalPages(Math.ceil(r.data.total / 20)); setCurrentPage(page);
            } else if (Array.isArray(r.data)) {
                setTrades(r.data); setTotalPages(1); setCurrentPage(1);
            } else { setTrades([]); }
        } catch { setTrades([]); }
    };

    const fetchAccountInfo = async () => {
        if (!master) return;
        try {
            const r = await api.post('/brokers/metatrader/verify-connection', {
                ...master.credentials, platform: master.credentials.platform || 'mt5'
            });
            if (r.data.success && r.data.balance !== undefined) {
                setAccountInfo({ balance: r.data.balance, equity: r.data.equity });
            }
        } catch { /* silent */ }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchMaster(), fetchTrades(currentPage), fetchAccountInfo()]);
        setIsRefreshing(false);
    };

    const totalProfit = Array.isArray(trades)
        ? trades.reduce((a, t) => a + Number(t.profit || 0), 0) : 0;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!master) return;
        setIsSaving(true);
        try {
            await api.patch(`/masters/${id}`, master);
            setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            alert(`Erreur: ${err.response?.data?.message || err.message}`);
        } finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Supprimer ce master ? Cette action est irréversible.')) return;
        try { await api.delete(`/masters/${id}`); navigate('/masters'); }
        catch { alert('Échec de la suppression'); }
    };

    const testConnection = async () => {
        if (!master) return;
        setIsTestingConnection(true); setConnectionMessage(''); setConnectionStatus('idle');
        try {
            const r = await api.post('/brokers/metatrader/verify-connection', {
                ...master.credentials, platform: master.credentials.platform || 'mt5'
            });
            if (r.data.success) {
                setConnectionStatus('valid');
                setConnectionMessage(`Connexion réussie · Balance: ${r.data.balance}, Equity: ${r.data.equity}`);
                if (r.data.balance !== undefined) setAccountInfo({ balance: r.data.balance, equity: r.data.equity });
            } else {
                setConnectionStatus('invalid'); setConnectionMessage(r.data.error || 'Connexion échouée');
            }
        } catch (err: any) {
            setConnectionStatus('error');
            setConnectionMessage(err.response?.data?.error || err.message || 'Erreur de connexion');
        } finally { setIsTestingConnection(false); }
    };

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" />
        </div>
    );
    if (!master) return null;

    const getStatusBadge = (s: string) => {
        const map: Record<string, string> = { ACTIVE: 'badge-active', PENDING: 'badge-pending', PAUSED: 'badge-paused', STOPPED: 'badge-stopped' };
        return `badge ${map[s] || 'badge-pending'}`;
    };

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-outline btn-icon" onClick={() => navigate('/masters')}>
                        <ArrowLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-wrap icon-wrap-blue" style={{ width: 38, height: 38, borderRadius: 10 }}>
                            <UserCog size={18} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{master.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                <span className={getStatusBadge((master as any).status)}>{(master as any).status || 'PENDING'}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{master.broker} · {master.credentials?.platform?.toUpperCase() || 'MT5'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* ── KPI cards ───────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                    { label: 'Balance',      value: `$${accountInfo.balance.toFixed(2)}`,  icon: DollarSign,   color: 'icon-wrap-blue' },
                    { label: 'Equity',       value: `$${accountInfo.equity.toFixed(2)}`,   icon: TrendingUp,   color: 'icon-wrap-green' },
                    { label: 'Total Profit', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, icon: Activity, color: totalProfit >= 0 ? 'icon-wrap-green' : 'icon-wrap-red' },
                    { label: 'Retraits',     value: '$0.00',                                icon: TrendingDown, color: 'icon-wrap-orange' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className={`icon-wrap ${color}`} style={{ width: 40, height: 40, borderRadius: 10 }}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="stat-card-label">{label}</div>
                            <div className="stat-card-value" style={{ fontSize: 18,
                                color: label === 'Total Profit' ? (totalProfit >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-primary)' }}>
                                {value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Config card with tabs ────────────────────────────────────── */}
            <div className="card">
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 18px' }}>
                    {[
                        { key: 'profile',    label: 'Profil Public',         icon: UserCog },
                        { key: 'connection', label: 'Connexion MetaTrader',  icon: Server },
                        { key: 'vnc',        label: 'Terminal VNC',          icon: Monitor },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key}
                            onClick={() => setActiveTab(key as any)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 13, fontWeight: 600,
                                color: activeTab === key ? 'var(--primary)' : 'var(--text-secondary)',
                                borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
                                marginBottom: -1, transition: 'all 0.15s',
                            }}>
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSave}>
                    <div className="card-body">

                        {/* ── Tab: Profil ─────────────────────────────────── */}
                        {activeTab === 'profile' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Nom d'affichage</label>
                                    <input className="form-control" value={master.name}
                                        onChange={e => setMaster({ ...master, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-control" value={(master as any).type || 'HUMAN'}
                                        onChange={e => setMaster({ ...master, type: e.target.value as any })}>
                                        <option value="HUMAN">Human Trader</option>
                                        <option value="BOT">Trading Bot</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Stratégie</label>
                                    <input className="form-control" placeholder="ex: Scalping, Swing…"
                                        value={(master as any).strategy || ''}
                                        onChange={e => setMaster({ ...master, strategy: e.target.value } as any)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Frais mensuel ($)</label>
                                    <input className="form-control" type="number" min="0" step="0.01"
                                        value={(master as any).monthlyFee || 0}
                                        onChange={e => setMaster({ ...master, monthlyFee: parseFloat(e.target.value) } as any)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Score de risque (1–10)</label>
                                    <input className="form-control" type="number" min="1" max="10"
                                        value={(master as any).riskScore || 1}
                                        onChange={e => setMaster({ ...master, riskScore: parseInt(e.target.value) } as any)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Avatar URL</label>
                                    <input className="form-control" placeholder="https://…"
                                        value={(master as any).avatar || ''}
                                        onChange={e => setMaster({ ...master, avatar: e.target.value } as any)} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Description</label>
                                    <textarea className="form-control" rows={3}
                                        placeholder="Décrivez la stratégie de trading…"
                                        value={(master as any).description || ''}
                                        onChange={e => setMaster({ ...master, description: e.target.value } as any)}
                                        style={{ resize: 'vertical' }} />
                                </div>
                            </div>
                        )}

                        {/* ── Tab: Connexion ───────────────────────────────── */}
                        {activeTab === 'connection' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Broker</label>
                                    <select className="form-control"
                                        value={BROKERS.some(b => b.id === master.broker) ? master.broker : ''}
                                        onChange={e => {
                                            const b = BROKERS.find(x => x.id === e.target.value);
                                            if (b) setMaster({ ...master, broker: b.id, credentials: { ...master.credentials, platform: b.platforms[0] } });
                                        }}>
                                        <option value="">Sélectionner un broker</option>
                                        {BROKERS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Serveur</label>
                                    <select className="form-control"
                                        value={master.credentials?.server || ''}
                                        onChange={e => setMaster({ ...master, credentials: { ...master.credentials, server: e.target.value } })}>
                                        <option value="">Sélectionner un serveur</option>
                                        {(BROKERS.find(b => b.id === master.broker)?.servers || []).map(s => (
                                            <option key={s.name} value={s.name}>{s.name} ({s.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bridge IP</label>
                                    <input className="form-control" placeholder="127.0.0.1"
                                        value={master.credentials?.bridgeIp || ''}
                                        onChange={e => setMaster({ ...master, credentials: { ...master.credentials, bridgeIp: e.target.value } })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bridge Port</label>
                                    <input className="form-control" type="number" placeholder="5000"
                                        value={master.credentials?.bridgePort || ''}
                                        onChange={e => setMaster({ ...master, credentials: { ...master.credentials, bridgePort: parseInt(e.target.value) } })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Login</label>
                                    <input className="form-control"
                                        value={master.credentials?.login || ''}
                                        onChange={e => setMaster({ ...master, credentials: { ...master.credentials, login: e.target.value } })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input className="form-control" type="password"
                                        value={master.credentials?.password || ''}
                                        onChange={e => setMaster({ ...master, credentials: { ...master.credentials, password: e.target.value } })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Platform</label>
                                    <select className="form-control" value={master.credentials?.platform || 'mt5'}
                                        onChange={e => setMaster({ ...master, credentials: { ...master.credentials, platform: e.target.value } })}>
                                        <option value="mt5">MetaTrader 5</option>
                                        <option value="mt4">MetaTrader 4</option>
                                    </select>
                                </div>

                                {/* Test connection */}
                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <button type="button" className="btn btn-outline"
                                        onClick={testConnection} disabled={isTestingConnection}>
                                        <Server size={14} />
                                        {isTestingConnection ? 'Test en cours…' : 'Tester la connexion'}
                                    </button>
                                    {connectionStatus !== 'idle' && (
                                        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
                                            color: connectionStatus === 'valid' ? 'var(--success)' : connectionStatus === 'error' ? 'var(--danger)' : 'var(--warning)' }}>
                                            {connectionStatus === 'valid'   && <CheckCircle size={14} />}
                                            {connectionStatus === 'invalid' && <XCircle size={14} />}
                                            {connectionStatus === 'error'   && <AlertTriangle size={14} />}
                                            {connectionMessage}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Tab: VNC ───────────────────────────────── */}
                        {activeTab === 'vnc' && (
                            <div style={{ height: 600, width: '100%', backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' }}>
                                {master.credentials?.vncPort ? (
                                    <iframe 
                                        src={`http://localhost:${master.credentials.vncPort}`} 
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        title="VNC Terminal"
                                    />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                        <AlertTriangle size={24} style={{ marginRight: 8 }} />
                                        Le port VNC n'est pas configuré pour ce Master.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="divider" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                            onClick={handleDelete}>
                            <Trash2 size={14} /> Supprimer le Master
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {saveSuccess && (
                                <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <CheckCircle size={13} /> Sauvegardé !
                                </span>
                            )}
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/masters')}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                <Save size={14} />
                                {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* ── Trade History ────────────────────────────────────────────── */}
            <div className="card">
                <div className="card-header" style={{ paddingBottom: 14 }}>
                    <div className="card-title">
                        <Activity size={14} style={{ color: 'var(--primary)' }} />
                        Historique des Trades
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-buy">Open Trades</span>
                        <span className="badge badge-standard">Closed Trades</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Derniers 30j</span>
                    </div>
                </div>
                <div className="divider" />
                <ErrorBoundary>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Type</th>
                                <th>Volume</th>
                                <th>Open Price</th>
                                <th>Status</th>
                                <th>Open Time</th>
                                <th style={{ textAlign: 'right' }}>Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.length === 0 ? (
                                <tr><td colSpan={7}>
                                    <div className="empty-state">
                                        <Activity size={28} />
                                        <p>Aucun trade enregistré</p>
                                    </div>
                                </td></tr>
                            ) : trades.map(t => <TradeRow key={t.id} trade={t} />)}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Page {currentPage} / {totalPages}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-outline btn-sm" disabled={currentPage <= 1}
                                    onClick={() => fetchTrades(currentPage - 1)}>
                                    <ChevronLeft size={13} />
                                </button>
                                <button className="btn btn-outline btn-sm" disabled={currentPage >= totalPages}
                                    onClick={() => fetchTrades(currentPage + 1)}>
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    )}
                </ErrorBoundary>
            </div>
        </div>
    );
}
