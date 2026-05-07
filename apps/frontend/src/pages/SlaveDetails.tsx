import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Slave, type Master } from '../api';
import {
    ArrowLeft, Save, Trash2, CheckCircle, XCircle, AlertTriangle,
    RefreshCw, UserCog, DollarSign, TrendingUp, TrendingDown,
    Server, Activity, ChevronLeft, ChevronRight, Monitor,
    Play, Wifi, WifiOff, Maximize
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

export default function SlaveDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [slave, setSlave] = useState<Slave | null>(null);
    const [masters, setMasters] = useState<Master[]>([]);
    const [trades, setTrades] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');
    const [accountInfo, setAccountInfo] = useState<{ balance: number; equity: number }>({ balance: 0, equity: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'connection' | 'vnc'>('profile');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const vncContainerRef = useRef<HTMLDivElement>(null);

    // ── Container state ──────────────────────────────────────────────────────
    const [containerStatus, setContainerStatus] = useState<{
        status: 'running' | 'stopped' | 'not_found' | 'error' | 'loading';
        containerName?: string;
        vncPort?: number;
        bridgePort?: number;
        startedAt?: string;
    }>({ status: 'loading' });
    const [isStartingContainer, setIsStartingContainer] = useState(false);
    const [startContainerMsg, setStartContainerMsg] = useState('');

    useEffect(() => {
        fetchSlaveAndMasters();
        fetchTrades(1);
    }, [id]);

    useEffect(() => {
        if (slave?.credentials?.bridgeIp) {
            fetchAccountInfo();
        }
    }, [slave]);

    // Fetch container status when VNC tab is opened
    useEffect(() => {
        if (activeTab === 'vnc' && id) fetchContainerStatus();
    }, [activeTab, id]);

    const fetchSlaveAndMasters = async () => {
        try {
            const [slaveRes, mastersRes] = await Promise.all([
                api.get<Slave>(`/slaves/${id}`),
                api.get<Master[]>('/masters')
            ]);
            const slaveData = slaveRes.data;
            if (slaveData.masters && slaveData.masters.length > 0) {
                (slaveData as any).master = slaveData.masters[0];
            }
            setSlave(slaveData);
            setMasters(mastersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            navigate('/slaves');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrades = async (page: number = 1) => {
        try {
            const response = await api.get(`/slaves/${id}/trades?page=${page}&limit=20`);
            if (response.data?.data && Array.isArray(response.data.data)) {
                setTrades(response.data.data);
                setTotalPages(Math.ceil(response.data.total / 20));
                setCurrentPage(page);
            } else if (Array.isArray(response.data)) {
                setTrades(response.data);
                setTotalPages(1);
                setCurrentPage(1);
            } else {
                setTrades([]);
            }
        } catch (error) {
            setTrades([]);
        }
    };

    const fetchAccountInfo = async () => {
        if (!slave) return;
        try {
            const response = await api.post('/brokers/metatrader/test-connection', {
                ...slave.credentials,
                platform: slave.credentials.platform || 'mt5'
            });
            if (response.data.success && response.data.balance !== undefined) {
                setAccountInfo({
                    balance: response.data.balance,
                    equity: response.data.equity
                });
            }
        } catch (error) {
            /* silent */
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchSlaveAndMasters(),
            fetchTrades(currentPage),
            fetchAccountInfo()
        ]);
        if (activeTab === 'vnc') await fetchContainerStatus();
        setIsRefreshing(false);
    };

    const fetchContainerStatus = async () => {
        setContainerStatus({ status: 'loading' });
        try {
            const r = await api.get(`/slaves/${id}/container-status`);
            setContainerStatus(r.data);
        } catch {
            setContainerStatus({ status: 'error' });
        }
    };

    const handleStartContainer = async () => {
        setIsStartingContainer(true);
        setStartContainerMsg('');
        try {
            const r = await api.post(`/slaves/${id}/start-container`);
            setStartContainerMsg(r.data.message);
            setTimeout(() => fetchContainerStatus(), 3000);
        } catch (err: any) {
            setStartContainerMsg(err.response?.data?.message || 'Erreur lors du démarrage');
        } finally {
            setIsStartingContainer(false);
        }
    };

    const handleCreateContainer = async () => {
        if (!confirm("Voulez-vous créer et provisionner un nouveau container MT5 pour ce Slave ?")) return;
        setIsStartingContainer(true);
        setStartContainerMsg('Création en cours...');
        try {
            const r = await api.post(`/slaves/${id}/create-container`);
            setStartContainerMsg(r.data.message);
            setTimeout(() => fetchContainerStatus(), 2000);
        } catch (err: any) {
            setStartContainerMsg(err.response?.data?.message || 'Erreur lors de la création');
        } finally {
            setIsStartingContainer(false);
        }
    };

    const handleRemoveContainer = async () => {
        if (!confirm("Attention : Voulez-vous vraiment détruire ce container MT5 ? Cela n'affectera pas l'historique mais vous déconnectera du broker.")) return;
        setIsStartingContainer(true);
        setStartContainerMsg('Suppression en cours...');
        try {
            const r = await api.post(`/slaves/${id}/remove-container`);
            setStartContainerMsg(r.data.message);
            setTimeout(() => fetchContainerStatus(), 2000);
        } catch (err: any) {
            setStartContainerMsg(err.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setIsStartingContainer(false);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            vncContainerRef.current?.requestFullscreen().catch(err => {
                alert(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const totalProfit = Array.isArray(trades)
        ? trades.reduce((a, t) => a + Number(t.profit || 0), 0) : 0;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slave) return;
        setIsSaving(true);
        try {
            const updateData = {
                name: slave.name,
                broker: slave.broker,
                credentials: slave.credentials,
                config: slave.config,
                masterIds: slave.master?.id ? [slave.master.id] : []
            };
            await api.patch(`/slaves/${id}`, updateData);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            alert(`Erreur: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Supprimer ce slave ? Cette action supprimera également le conteneur Docker associé de façon irréversible.')) return;
        try {
            await api.delete(`/slaves/${id}`);
            navigate('/slaves');
        } catch (error) {
            alert('Échec de la suppression');
        }
    };

    const testConnection = async () => {
        if (!slave) return;
        setIsTestingConnection(true);
        setConnectionMessage('');
        setConnectionStatus('idle');
        try {
            const r = await api.post('/brokers/metatrader/test-connection', {
                ...slave.credentials,
                platform: slave.credentials.platform || 'mt5'
            });
            if (r.data.success) {
                setConnectionStatus('valid');
                setConnectionMessage(`Connexion réussie · Balance: ${r.data.balance}, Equity: ${r.data.equity}`);
                if (r.data.balance !== undefined) {
                    setAccountInfo({ balance: r.data.balance, equity: r.data.equity });
                }
            } else {
                setConnectionStatus('invalid');
                setConnectionMessage(r.data.error || 'Connexion échouée');
            }
        } catch (err: any) {
            setConnectionStatus('error');
            setConnectionMessage(err.response?.data?.error || err.message || 'Erreur de connexion');
        } finally {
            setIsTestingConnection(false);
        }
    };

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" />
        </div>
    );
    if (!slave) return null;

    const getStatusBadge = (s: string) => {
        const map: Record<string, string> = { ACTIVE: 'badge-active', PENDING: 'badge-pending', PAUSED: 'badge-paused', STOPPED: 'badge-stopped' };
        return `badge ${map[s] || 'badge-pending'}`;
    };

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-outline btn-icon" onClick={() => navigate('/slaves')}>
                        <ArrowLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="icon-wrap icon-wrap-blue" style={{ width: 38, height: 38, borderRadius: 10 }}>
                            <UserCog size={18} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{slave.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                <span className={getStatusBadge((slave as any).status)}>{(slave as any).status || 'PENDING'}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{slave.broker} · {slave.credentials?.platform?.toUpperCase() || 'MT5'}</span>
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
                    { label: 'Balance', value: `$${accountInfo.balance.toFixed(2)}`, icon: DollarSign, color: 'icon-wrap-blue' },
                    { label: 'Equity', value: `$${accountInfo.equity.toFixed(2)}`, icon: TrendingUp, color: 'icon-wrap-green' },
                    { label: 'Total Profit', value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`, icon: Activity, color: totalProfit >= 0 ? 'icon-wrap-green' : 'icon-wrap-red' },
                    { label: 'Retraits', value: '$0.00', icon: TrendingDown, color: 'icon-wrap-orange' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className={`icon-wrap ${color}`} style={{ width: 40, height: 40, borderRadius: 10 }}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="stat-card-label">{label}</div>
                            <div className="stat-card-value" style={{
                                fontSize: 18,
                                color: label === 'Total Profit' ? (totalProfit >= 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-primary)'
                            }}>
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
                        { key: 'profile', label: 'Profil & Stratégie', icon: UserCog },
                        { key: 'connection', label: 'Connexion MetaTrader', icon: Server },
                        { key: 'vnc', label: 'Terminal VNC', icon: Monitor },
                    ].map(({ key, label, icon: Icon }) => (
                        <button key={key}
                            type="button"
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
                                    <input className="form-control" value={slave.name}
                                        onChange={e => setSlave({ ...slave, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Broker</label>
                                    <select className="form-control"
                                        value={BROKERS.some(b => b.id === slave.broker) ? 'metatrader' : slave.broker}
                                        onChange={e => setSlave({ ...slave, broker: e.target.value })}>
                                        <option value="binance">Binance</option>
                                        <option value="metatrader">MetaTrader</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Master Account</label>
                                    <select className="form-control"
                                        value={slave.master?.id || ''}
                                        onChange={e => setSlave({ ...slave, master: masters.find(m => m.id === e.target.value) })}
                                        required>
                                        <option value="">Sélectionner un Master</option>
                                        {masters.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mode de Copie</label>
                                    <select className="form-control"
                                        value={slave.config?.mode || 'FIXED_RATIO'}
                                        onChange={e => setSlave({ ...slave, config: { ...slave.config, mode: e.target.value } })}>
                                        <option value="FIXED_RATIO">Ratio Fixe</option>
                                        <option value="FIXED_LOT">Lot Fixe</option>
                                        <option value="BALANCE_RATIO">Ratio par Balance (Auto)</option>
                                        <option value="EQUITY_RATIO">Ratio par Équité (Auto)</option>
                                    </select>
                                </div>

                                {(slave.config?.mode === 'FIXED_RATIO' || slave.config?.mode === 'BALANCE_RATIO' || slave.config?.mode === 'EQUITY_RATIO') && (
                                    <div className="form-group">
                                        <label className="form-label">Multiplicateur Ratio</label>
                                        <input className="form-control" type="number" step="0.1"
                                            value={slave.config?.ratio || 1.0}
                                            onChange={e => setSlave({ ...slave, config: { ...slave.config, ratio: parseFloat(e.target.value) } })} />
                                    </div>
                                )}

                                {slave.config?.mode === 'FIXED_LOT' && (
                                    <div className="form-group">
                                        <label className="form-label">Taille de Lot Fixe</label>
                                        <input className="form-control" type="number" step="0.01"
                                            value={slave.config?.fixedLotSize || 0.01}
                                            onChange={e => setSlave({ ...slave, config: { ...slave.config, fixedLotSize: parseFloat(e.target.value) } })} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Tab: Connexion ───────────────────────────────── */}
                        {activeTab === 'connection' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Broker</label>
                                    <select className="form-control"
                                        value={BROKERS.some(b => b.id === slave.broker) ? slave.broker : ''}
                                        onChange={e => {
                                            const b = BROKERS.find(x => x.id === e.target.value);
                                            if (b) setSlave({ ...slave, broker: b.id, credentials: { ...slave.credentials, platform: b.platforms[0] } });
                                        }}>
                                        <option value="">Sélectionner un broker</option>
                                        {BROKERS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Serveur</label>
                                    <select className="form-control"
                                        value={slave.credentials?.server || ''}
                                        onChange={e => setSlave({ ...slave, credentials: { ...slave.credentials, server: e.target.value } })}>
                                        <option value="">Sélectionner un serveur</option>
                                        {(BROKERS.find(b => b.id === slave.broker)?.servers || []).map(s => (
                                            <option key={s.name} value={s.name}>{s.name} ({s.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bridge IP</label>
                                    <input className="form-control" placeholder="127.0.0.1"
                                        value={slave.credentials?.bridgeIp || ''}
                                        onChange={e => setSlave({ ...slave, credentials: { ...slave.credentials, bridgeIp: e.target.value } })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bridge Port</label>
                                    <input className="form-control" type="number" placeholder="5000"
                                        value={slave.credentials?.bridgePort || ''}
                                        onChange={e => setSlave({ ...slave, credentials: { ...slave.credentials, bridgePort: parseInt(e.target.value) } })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Login MT5</label>
                                    <input className="form-control"
                                        value={slave.credentials?.login || ''}
                                        onChange={e => setSlave({ ...slave, credentials: { ...slave.credentials, login: e.target.value } })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mot de passe</label>
                                    <input className="form-control" type="password"
                                        value={slave.credentials?.password || ''}
                                        onChange={e => setSlave({ ...slave, credentials: { ...slave.credentials, password: e.target.value } })} />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Platform</label>
                                    <select className="form-control" value={slave.credentials?.platform || 'mt5'}
                                        onChange={e => setSlave({ ...slave, credentials: { ...slave.credentials, platform: e.target.value } })}>
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
                                        <span style={{
                                            fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
                                            color: connectionStatus === 'valid' ? 'var(--success)' : connectionStatus === 'error' ? 'var(--danger)' : 'var(--warning)'
                                        }}>
                                            {connectionStatus === 'valid' && <CheckCircle size={14} />}
                                            {connectionStatus === 'invalid' && <XCircle size={14} />}
                                            {connectionStatus === 'error' && <AlertTriangle size={14} />}
                                            {connectionMessage}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Tab: VNC ───────────────────────────────── */}
                        {activeTab === 'vnc' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Container status banner */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', borderRadius: 10,
                                    background: containerStatus.status === 'running'
                                        ? 'rgba(34,197,94,0.08)' : containerStatus.status === 'loading'
                                            ? 'rgba(99,102,241,0.08)' : 'rgba(239,68,68,0.08)',
                                    border: `1px solid ${containerStatus.status === 'running' ? 'rgba(34,197,94,0.25)'
                                        : containerStatus.status === 'loading' ? 'rgba(99,102,241,0.25)'
                                            : 'rgba(239,68,68,0.25)'}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {containerStatus.status === 'loading' && <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />}
                                        {containerStatus.status === 'running' && <Wifi size={16} style={{ color: 'var(--success)' }} />}
                                        {(containerStatus.status === 'stopped' || containerStatus.status === 'not_found' || containerStatus.status === 'error') && <WifiOff size={16} style={{ color: 'var(--danger)' }} />}
                                        <div>
                                            <div style={{
                                                fontSize: 13, fontWeight: 600,
                                                color: containerStatus.status === 'running' ? 'var(--success)'
                                                    : containerStatus.status === 'loading' ? 'var(--primary)'
                                                        : 'var(--danger)'
                                            }}>
                                                {containerStatus.status === 'loading' && 'Vérification du container…'}
                                                {containerStatus.status === 'running' && '🟢 Container MT5 en cours d\'exécution'}
                                                {containerStatus.status === 'stopped' && '🔴 Container MT5 arrêté'}
                                                {containerStatus.status === 'not_found' && '⚠️ Aucun container trouvé pour ce Slave'}
                                                {containerStatus.status === 'error' && '❌ Erreur de communication avec Docker'}
                                            </div>
                                            {containerStatus.containerName && (
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                                                    {containerStatus.containerName}
                                                    {containerStatus.vncPort && ` · VNC :${containerStatus.vncPort}`}
                                                    {containerStatus.bridgePort && ` · Bridge :${containerStatus.bridgePort}`}
                                                    {containerStatus.startedAt && ` · ${containerStatus.startedAt}`}
                                                </div>
                                            )}
                                            {startContainerMsg && (
                                                <div style={{
                                                    fontSize: 11, marginTop: 4,
                                                    color: containerStatus.status === 'running' ? 'var(--success)' : 'var(--warning)'
                                                }}>
                                                    {startContainerMsg}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {containerStatus.status === 'not_found' && (
                                            <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateContainer} disabled={isStartingContainer}>
                                                {isStartingContainer
                                                    ? <><RefreshCw size={13} className="animate-spin" /> Création…</>
                                                    : <><Server size={13} /> Créer le Container</>}
                                            </button>
                                        )}
                                        {containerStatus.status === 'stopped' && (
                                            <button type="button" className="btn btn-primary btn-sm" onClick={handleStartContainer} disabled={isStartingContainer}>
                                                {isStartingContainer
                                                    ? <><RefreshCw size={13} className="animate-spin" /> Démarrage…</>
                                                    : <><Play size={13} /> Démarrer le Container</>}
                                            </button>
                                        )}
                                        {containerStatus.status !== 'not_found' && containerStatus.status !== 'loading' && containerStatus.status !== 'error' && (
                                            <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={handleRemoveContainer} disabled={isStartingContainer}>
                                                {isStartingContainer
                                                    ? <RefreshCw size={13} className="animate-spin" />
                                                    : <Trash2 size={13} />}
                                            </button>
                                        )}
                                        <button type="button" className="btn btn-outline btn-sm" onClick={fetchContainerStatus} disabled={containerStatus.status === 'loading'}>
                                            <RefreshCw size={13} className={containerStatus.status === 'loading' ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>

                                {/* VNC iframe — only shown when container is running */}
                                <div ref={vncContainerRef} style={{
                                    height: isFullscreen ? '100vh' : 520,
                                    width: isFullscreen ? '100vw' : '100%',
                                    borderRadius: isFullscreen ? 0 : 10,
                                    overflow: 'hidden',
                                    background: '#0d0d0d',
                                    border: isFullscreen ? 'none' : '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    {containerStatus.status === 'running' && (containerStatus.vncPort || slave.credentials?.vncPort) ? (
                                        <>
                                            <iframe
                                                src={`http://localhost:${containerStatus.vncPort || slave.credentials.vncPort}`}
                                                style={{ width: '100%', height: '100%', border: 'none' }}
                                                title="VNC Terminal"
                                            />
                                            <button
                                                type="button"
                                                onClick={toggleFullscreen}
                                                style={{
                                                    position: 'absolute', top: 16, right: 16,
                                                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8,
                                                    color: 'white', padding: 8, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backdropFilter: 'blur(4px)',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                                                onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                                                title="Plein écran"
                                            >
                                                <Maximize size={18} />
                                            </button>
                                        </>
                                    ) : containerStatus.status === 'loading' ? (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: 'var(--primary)' }} />
                                            <p style={{ fontSize: 13 }}>Vérification de l'état du container…</p>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                                            <Monitor size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                                            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Terminal VNC non disponible</p>
                                            <p style={{ fontSize: 12, maxWidth: 320, margin: '0 auto' }}>
                                                {containerStatus.status === 'not_found'
                                                    ? 'Le container Docker MT5 n\'a pas encore été créé. Recréez ce Slave pour provisionner un nouveau container.'
                                                    : containerStatus.status === 'stopped'
                                                        ? 'Le container est arrêté. Cliquez sur "Démarrer le Container" ci-dessus pour le relancer.'
                                                        : 'Impossible de communiquer avec Docker. Vérifiez que Docker Desktop est actif.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="divider" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                            onClick={handleDelete}>
                            <Trash2 size={14} /> Supprimer le Slave
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {saveSuccess && (
                                <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <CheckCircle size={13} /> Sauvegardé !
                                </span>
                            )}
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/slaves')}>
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
