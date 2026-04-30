import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import {
    Shield, ShieldCheck, ShieldOff, Activity,
    AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
    MoreHorizontal, Search, Save
} from 'lucide-react';

interface Slave { id: string; name: string; broker: string; status: string; master?: { name: string }; }
interface PropFirmConfig {
    slaveId: string; isEnabled: boolean; minJitter: number; maxJitter: number;
    lotVariation: number; dailyLossLimit: number; totalLossLimit: number; customCommentPrefix: string;
}
interface ShieldStats { totalOrders: number; blockedOrders: number; avgJitterMs: number; }
interface ShieldLog {
    id: string; symbol: string; side: string; originalVolume: number; shieldedVolume: number;
    jitterMs: number; comment: string; action: string; blockedByEquityGuard: boolean;
    blockReason?: string; createdAt: string;
}

const DEFAULT_CONFIG: Omit<PropFirmConfig, 'slaveId'> = {
    isEnabled: false, minJitter: 1000, maxJitter: 5000,
    lotVariation: 1.5, dailyLossLimit: 0, totalLossLimit: 0, customCommentPrefix: 'MNL_',
};

function Slider({ label, min, max, step, value, unit, onChange }: {
    label: string; min: number; max: number; step: number; value: number; unit: string; onChange: (v: number) => void;
}) {
    return (
        <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', height: 4, cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                <span>{min}{unit}</span><span>{max}{unit}</span>
            </div>
        </div>
    );
}

export default function PropFirmProtection() {
    const [slaves, setSlaves] = useState<Slave[]>([]);
    const [selectedSlaveId, setSelectedSlaveId] = useState<string | null>(null);
    const [config, setConfig] = useState<Omit<PropFirmConfig, 'slaveId'>>(DEFAULT_CONFIG);
    const [stats, setStats] = useState<ShieldStats | null>(null);
    const [logs, setLogs] = useState<ShieldLog[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [loadingSlaves, setLoadingSlaves] = useState(true);
    const [showLogs, setShowLogs] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        setLoadingSlaves(true);
        api.get<Slave[]>('/slaves')
            .then(r => {
                const pf = r.data.filter((s: any) => s.isPropFirm === true);
                setSlaves(pf);
                if (pf.length > 0) setSelectedSlaveId(pf[0].id);
            })
            .catch(() => setSlaves([]))
            .finally(() => setLoadingSlaves(false));
    }, []);

    const loadSlaveData = useCallback(async (slaveId: string) => {
        setLoadingStats(true);
        try {
            const [cfgRes, statsRes, logsRes] = await Promise.all([
                api.get<PropFirmConfig>(`/prop-firm-shield/${slaveId}`),
                api.get<ShieldStats>(`/prop-firm-shield/${slaveId}/stats`),
                api.get<ShieldLog[]>(`/prop-firm-shield/${slaveId}/logs?limit=20`),
            ]);
            const { slaveId: _, ...rest } = cfgRes.data;
            setConfig({ ...DEFAULT_CONFIG, ...rest });
            setStats(statsRes.data);
            setLogs(logsRes.data);
        } catch {
            setConfig(DEFAULT_CONFIG); setStats(null); setLogs([]);
        } finally { setLoadingStats(false); }
    }, []);

    useEffect(() => { if (selectedSlaveId) loadSlaveData(selectedSlaveId); }, [selectedSlaveId, loadSlaveData]);

    const handleSave = async () => {
        if (!selectedSlaveId) return;
        setSaving(true); setSaveMessage(null);
        try {
            await api.post(`/prop-firm-shield/${selectedSlaveId}`, config);
            setSaveMessage({ type: 'success', text: 'Configuration sauvegardée !' });
            loadSlaveData(selectedSlaveId);
        } catch { setSaveMessage({ type: 'error', text: 'Échec de la sauvegarde.' }); }
        finally { setSaving(false); setTimeout(() => setSaveMessage(null), 3000); }
    };

    const handleToggle = async () => {
        if (!selectedSlaveId) return;
        const newEnabled = !config.isEnabled;
        try {
            await api.patch(`/prop-firm-shield/${selectedSlaveId}/toggle`, { enabled: newEnabled });
            setConfig(p => ({ ...p, isEnabled: newEnabled }));
        } catch { setSaveMessage({ type: 'error', text: 'Échec du toggle.' }); }
    };

    const selectedSlave = slaves.find(s => s.id === selectedSlaveId);

    const statusColor: Record<string, string> = {
        ACTIVE: 'var(--success)', PAUSED: 'var(--warning)', STOPPED: 'var(--danger)', PENDING: 'var(--text-muted)'
    };

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="icon-wrap icon-wrap-green" style={{ width: 40, height: 40, borderRadius: 10 }}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700 }}>PropFirm Shield</h1>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            Anti-detection shield for prop firm accounts
                        </p>
                    </div>
                </div>
                <button className="btn btn-outline btn-sm"
                    onClick={() => selectedSlaveId && loadSlaveData(selectedSlaveId)}>
                    <RefreshCw size={13} className={loadingStats ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                    { label: 'Comptes PropFirm', value: slaves.length,                          icon: Shield,     color: 'icon-wrap-green' },
                    { label: 'Shields Actifs',   value: slaves.length > 0 && config.isEnabled ? 1 : 0, icon: ShieldCheck, color: 'icon-wrap-blue' },
                    { label: 'Ordres Shieldés',  value: stats?.totalOrders ?? '—',              icon: Activity,   color: 'icon-wrap-purple' },
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

            {/* Slave selector */}
            {loadingSlaves ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Chargement des comptes PropFirm…
                </div>
            ) : slaves.length === 0 ? (
                <div className="card" style={{ padding: 48 }}>
                    <div className="empty-state">
                        <ShieldOff size={40} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 8 }}>
                            Aucun compte PropFirm trouvé
                        </p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>
                            Lors de la création d'un Slave, activez le toggle{' '}
                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Compte Prop Firm</span>{' '}
                            pour qu'il apparaisse ici.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Slave cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                        {slaves.map(slave => (
                            <button key={slave.id}
                                onClick={() => setSelectedSlaveId(slave.id)}
                                style={{
                                    background: selectedSlaveId === slave.id ? 'var(--primary-light)' : 'var(--bg-card)',
                                    border: `2px solid ${selectedSlaveId === slave.id ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'left',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{slave.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                            {slave.master?.name || 'No master'} · {slave.broker}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                        background: selectedSlaveId === slave.id && config.isEnabled ? '#DCFCE7' : 'var(--border-light)',
                                        color: selectedSlaveId === slave.id && config.isEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {selectedSlaveId === slave.id && config.isEnabled ? '🛡 ON' : 'OFF'}
                                    </span>
                                </div>
                                <div style={{ height: 3, borderRadius: 2, background: statusColor[slave.status] || 'var(--border)' }} />
                            </button>
                        ))}
                    </div>

                    {/* Config + Monitor */}
                    {selectedSlave && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

                            {/* Config Panel */}
                            <div className="card">
                                <div className="card-header" style={{ paddingBottom: 14 }}>
                                    <div className="card-title">
                                        <Shield size={14} style={{ color: 'var(--primary)' }} />
                                        Configuration — {selectedSlave.name}
                                    </div>
                                    {/* Shield toggle */}
                                    <button onClick={handleToggle}
                                        className={`btn btn-sm ${config.isEnabled ? 'btn-primary' : 'btn-outline'}`}>
                                        {config.isEnabled
                                            ? <><ShieldCheck size={13} /> Shield ON</>
                                            : <><ShieldOff size={13} /> Shield OFF</>}
                                    </button>
                                </div>
                                <div className="divider" />
                                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                    {/* Jitter */}
                                    <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                            ⏱ Temporal Jitter
                                        </div>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                                            Délai aléatoire avant chaque ordre pour masquer les patterns d'exécution.
                                        </p>
                                        <Slider label="Délai minimum" min={500} max={10000} step={100} value={config.minJitter} unit="ms"
                                            onChange={v => setConfig(p => ({ ...p, minJitter: v }))} />
                                        <Slider label="Délai maximum" min={1000} max={30000} step={500} value={config.maxJitter} unit="ms"
                                            onChange={v => setConfig(p => ({ ...p, maxJitter: v }))} />
                                    </div>

                                    {/* Volume */}
                                    <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                            📊 Volume Variation
                                        </div>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                                            Bruit aléatoire ± sur la taille des lots à chaque ordre.
                                        </p>
                                        <Slider label="Variation de lot" min={0} max={5} step={0.1} value={config.lotVariation} unit="%"
                                            onChange={v => setConfig(p => ({ ...p, lotVariation: v }))} />
                                    </div>

                                    {/* Equity Guard */}
                                    <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                            🛡 Equity Guard
                                        </div>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                                            Pause automatique si une limite de perte est atteinte. 0 = désactivé.
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div className="form-group">
                                                <label className="form-label">Perte journalière max ($)</label>
                                                <input className="form-control" type="number" min={0} step={100}
                                                    value={config.dailyLossLimit} placeholder="ex: 4500"
                                                    onChange={e => setConfig(p => ({ ...p, dailyLossLimit: parseFloat(e.target.value) || 0 }))} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Perte totale max ($)</label>
                                                <input className="form-control" type="number" min={0} step={100}
                                                    value={config.totalLossLimit} placeholder="ex: 10000"
                                                    onChange={e => setConfig(p => ({ ...p, totalLossLimit: parseFloat(e.target.value) || 0 }))} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comment Prefix */}
                                    <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9333EA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                            🏷 Préfixe de commentaire
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 6 }}>
                                            <input className="form-control font-mono" type="text" maxLength={10}
                                                value={config.customCommentPrefix} placeholder="MNL_"
                                                onChange={e => setConfig(p => ({ ...p, customCommentPrefix: e.target.value }))} />
                                        </div>
                                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            Aperçu : <span className="font-mono" style={{ color: '#9333EA' }}>{config.customCommentPrefix}4829</span>
                                        </p>
                                    </div>

                                    {/* Save */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                                        {saveMessage && (
                                            <span style={{ fontSize: 12, fontWeight: 600,
                                                color: saveMessage.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                                                {saveMessage.type === 'success' ? '✓' : '✗'} {saveMessage.text}
                                            </span>
                                        )}
                                        <button className="btn btn-primary" style={{ marginLeft: 'auto' }}
                                            onClick={handleSave} disabled={saving}>
                                            <Save size={13} />
                                            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Monitoring */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                                {/* Stats */}
                                <div className="card">
                                    <div className="card-header" style={{ paddingBottom: 12 }}>
                                        <div className="card-title">
                                            <Activity size={14} style={{ color: 'var(--primary)' }} />
                                            Shield Monitoring
                                        </div>
                                    </div>
                                    <div className="divider" />
                                    <div className="card-body">
                                        {loadingStats ? (
                                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                                                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto' }} />
                                            </div>
                                        ) : stats ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {[
                                                    { label: 'Ordres Shieldés', value: stats.totalOrders, color: 'var(--success)' },
                                                    { label: 'Bloqués (Guard)', value: stats.blockedOrders, color: stats.blockedOrders > 0 ? 'var(--danger)' : 'var(--text-muted)' },
                                                    { label: 'Jitter Moyen', value: `${(stats.avgJitterMs / 1000).toFixed(1)}s`, color: 'var(--primary)' },
                                                ].map(({ label, value, color }) => (
                                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                                                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                                                        <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
                                                    </div>
                                                ))}
                                                {stats.totalOrders > 0 && (
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                                                            <span>Taux de succès</span>
                                                            <span>{(((stats.totalOrders - stats.blockedOrders) / stats.totalOrders) * 100).toFixed(0)}%</span>
                                                        </div>
                                                        <div style={{ height: 5, background: 'var(--border-light)', borderRadius: 3 }}>
                                                            <div style={{ height: 5, borderRadius: 3, background: 'var(--success)',
                                                                width: `${((stats.totalOrders - stats.blockedOrders) / stats.totalOrders) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="empty-state" style={{ padding: '20px 0' }}>
                                                <ShieldOff size={24} />
                                                <p style={{ fontSize: 11 }}>Activez le shield pour commencer le monitoring.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Logs */}
                                <div className="card" style={{ overflow: 'hidden' }}>
                                    <button onClick={() => setShowLogs(v => !v)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Activity size={14} style={{ color: 'var(--primary)' }} />
                                            Logs récents
                                        </span>
                                        {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {showLogs && (
                                        <>
                                            <div className="divider" />
                                            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                {logs.length === 0 ? (
                                                    <div className="empty-state" style={{ padding: '20px 0' }}>
                                                        <p style={{ fontSize: 11 }}>Aucun log disponible.</p>
                                                    </div>
                                                ) : logs.map(log => (
                                                    <div key={log.id} style={{ padding: '10px 18px', borderBottom: '1px solid var(--border-light)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                                                                {log.action} {log.side} {log.symbol}
                                                            </span>
                                                            {log.blockedByEquityGuard && (
                                                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)',
                                                                    display: 'flex', alignItems: 'center', gap: 3 }}>
                                                                    <AlertTriangle size={10} /> BLOCKED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                                                            <span>Vol: <strong style={{ color: 'var(--text-primary)' }}>{log.originalVolume}</strong>
                                                                {' → '}<strong style={{ color: 'var(--success)' }}>{log.shieldedVolume}</strong>
                                                            </span>
                                                            <span>Jitter: <strong style={{ color: 'var(--primary)' }}>{log.jitterMs}ms</strong></span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
