import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import {
    Shield, ShieldCheck, ShieldOff, Activity,
    AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slave {
    id: string;
    name: string;
    broker: string;
    status: string;
    master?: { name: string };
}

interface PropFirmConfig {
    slaveId: string;
    isEnabled: boolean;
    minJitter: number;
    maxJitter: number;
    lotVariation: number;
    dailyLossLimit: number;
    totalLossLimit: number;
    customCommentPrefix: string;
}

interface ShieldStats {
    totalOrders: number;
    blockedOrders: number;
    avgJitterMs: number;
}

interface ShieldLog {
    id: string;
    symbol: string;
    side: string;
    originalVolume: number;
    shieldedVolume: number;
    jitterMs: number;
    comment: string;
    action: string;
    blockedByEquityGuard: boolean;
    blockReason?: string;
    createdAt: string;
}

// ─── Default config values ────────────────────────────────────────────────────

const DEFAULT_CONFIG: Omit<PropFirmConfig, 'slaveId'> = {
    isEnabled: false,
    minJitter: 1000,
    maxJitter: 5000,
    lotVariation: 1.5,
    dailyLossLimit: 0,
    totalLossLimit: 0,
    customCommentPrefix: 'MNL_',
};

// ─── Slider helper ────────────────────────────────────────────────────────────

function Slider({
    label, min, max, step, value, unit, onChange,
}: {
    label: string; min: number; max: number; step: number;
    value: number; unit: string; onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                <span className="text-sm font-bold text-emerald-400">
                    {value}{unit}
                </span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: '#10b981' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PropFirmProtection() {
    const [slaves, setSlaves] = useState<Slave[]>([]);
    const [selectedSlaveId, setSelectedSlaveId] = useState<string | null>(null);
    const [config, setConfig] = useState<Omit<PropFirmConfig, 'slaveId'>>(DEFAULT_CONFIG);
    const [stats, setStats] = useState<ShieldStats | null>(null);
    const [logs, setLogs] = useState<ShieldLog[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ── Load slaves ──────────────────────────────────────────────────────────
    useEffect(() => {
        api.get<Slave[]>('/slaves').then(r => {
            setSlaves(r.data);
            if (r.data.length > 0) setSelectedSlaveId(r.data[0].id);
        });
    }, []);

    // ── Load config + stats when slave changes ────────────────────────────────
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
            setConfig(DEFAULT_CONFIG);
            setStats(null);
            setLogs([]);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        if (selectedSlaveId) loadSlaveData(selectedSlaveId);
    }, [selectedSlaveId, loadSlaveData]);

    // ── Save config ───────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedSlaveId) return;
        setSaving(true);
        setSaveMessage(null);
        try {
            await api.post(`/prop-firm-shield/${selectedSlaveId}`, config);
            setSaveMessage({ type: 'success', text: 'Configuration saved!' });
            loadSlaveData(selectedSlaveId);
        } catch {
            setSaveMessage({ type: 'error', text: 'Failed to save configuration.' });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    // ── Toggle shield ─────────────────────────────────────────────────────────
    const handleToggle = async () => {
        if (!selectedSlaveId) return;
        const newEnabled = !config.isEnabled;
        try {
            await api.patch(`/prop-firm-shield/${selectedSlaveId}/toggle`, { enabled: newEnabled });
            setConfig(prev => ({ ...prev, isEnabled: newEnabled }));
        } catch {
            setSaveMessage({ type: 'error', text: 'Failed to toggle shield.' });
        }
    };

    const selectedSlave = slaves.find(s => s.id === selectedSlaveId);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 space-y-6">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <Shield size={28} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">PropFirm Protection</h1>
                        <p className="text-sm text-gray-400">
                            Anti-detection shield for prop firm accounts
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => selectedSlaveId && loadSlaveData(selectedSlaveId)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                    <RefreshCw size={14} className={loadingStats ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* ── Slave Selector with Shield Badges ───────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {slaves.map(slave => (
                    <button
                        key={slave.id}
                        onClick={() => setSelectedSlaveId(slave.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                            selectedSlaveId === slave.id
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-sm">{slave.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {slave.master?.name || 'No master'} · {slave.broker}
                                </p>
                            </div>
                            {/* Shield badge — will reflect actual config once loaded */}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                selectedSlaveId === slave.id && config.isEnabled
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-gray-700 text-gray-400'
                            }`}>
                                {selectedSlaveId === slave.id && config.isEnabled ? '🛡 Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className={`mt-2 w-full h-1 rounded-full ${
                            slave.status === 'ACTIVE' ? 'bg-emerald-500' :
                            slave.status === 'PAUSED' ? 'bg-amber-500' : 'bg-gray-600'
                        }`} />
                    </button>
                ))}
            </div>

            {selectedSlave && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Configuration Panel ─────────────────────────────────── */}
                    <div className="lg:col-span-2 bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Configuration — {selectedSlave.name}
                            </h2>
                            {/* Master Toggle */}
                            <button
                                onClick={handleToggle}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                                    config.isEnabled
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                            >
                                {config.isEnabled
                                    ? <><ShieldCheck size={16} /> Shield ON</>
                                    : <><ShieldOff size={16} /> Shield OFF</>
                                }
                            </button>
                        </div>

                        {/* Jitter Section */}
                        <div className="space-y-4 p-4 bg-gray-800/50 rounded-xl">
                            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                                ⏱ Temporal Jitter
                            </h3>
                            <p className="text-xs text-gray-400">
                                Random delay applied before each order to mask execution timing patterns.
                            </p>
                            <Slider
                                label="Minimum Delay"
                                min={500} max={10000} step={100}
                                value={config.minJitter} unit="ms"
                                onChange={v => setConfig(p => ({ ...p, minJitter: v }))}
                            />
                            <Slider
                                label="Maximum Delay"
                                min={1000} max={30000} step={500}
                                value={config.maxJitter} unit="ms"
                                onChange={v => setConfig(p => ({ ...p, maxJitter: v }))}
                            />
                        </div>

                        {/* Volume Variation Section */}
                        <div className="space-y-4 p-4 bg-gray-800/50 rounded-xl">
                            <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                                📊 Volume Variation
                            </h3>
                            <p className="text-xs text-gray-400">
                                Applies ± random noise to the lot size on every order.
                                A 1.5% variation on 1.00 lot gives between 0.98 and 1.02.
                            </p>
                            <Slider
                                label="Lot Variation"
                                min={0} max={5} step={0.1}
                                value={config.lotVariation} unit="%"
                                onChange={v => setConfig(p => ({ ...p, lotVariation: v }))}
                            />
                        </div>

                        {/* Equity Guard Section */}
                        <div className="space-y-4 p-4 bg-gray-800/50 rounded-xl">
                            <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                                🛡 Equity Guard (Prop Firm Rules)
                            </h3>
                            <p className="text-xs text-gray-400">
                                Automatically PAUSES this account if a loss limit is breached.
                                Set to 0 to disable. Use account currency (USD, EUR…).
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-1">
                                        Daily Loss Limit ($)
                                    </label>
                                    <input
                                        type="number" min={0} step={100}
                                        value={config.dailyLossLimit}
                                        onChange={e => setConfig(p => ({ ...p, dailyLossLimit: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        placeholder="e.g. 4500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">0 = disabled</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-1">
                                        Total Loss Limit ($)
                                    </label>
                                    <input
                                        type="number" min={0} step={100}
                                        value={config.totalLossLimit}
                                        onChange={e => setConfig(p => ({ ...p, totalLossLimit: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        placeholder="e.g. 10000"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">0 = disabled</p>
                                </div>
                            </div>
                        </div>

                        {/* Comment Prefix */}
                        <div className="p-4 bg-gray-800/50 rounded-xl space-y-2">
                            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                                🏷 Order Comment Prefix
                            </h3>
                            <p className="text-xs text-gray-400">
                                Each order comment will be "{config.customCommentPrefix}XXXX" (e.g. MNL_4829).
                            </p>
                            <input
                                type="text" maxLength={10}
                                value={config.customCommentPrefix}
                                onChange={e => setConfig(p => ({ ...p, customCommentPrefix: e.target.value }))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                placeholder="MNL_"
                            />
                            <p className="text-xs text-gray-500">
                                Preview: <span className="font-mono text-purple-300">{config.customCommentPrefix}4829</span>
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center justify-between pt-2">
                            {saveMessage && (
                                <span className={`text-sm font-medium ${
                                    saveMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                    {saveMessage.type === 'success' ? '✓' : '✗'} {saveMessage.text}
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="ml-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                            >
                                {saving ? 'Saving…' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>

                    {/* ── Monitoring Widget ───────────────────────────────────── */}
                    <div className="space-y-4">
                        {/* Stats Cards */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Activity size={18} className="text-emerald-400" />
                                <h3 className="font-semibold">Shield Monitoring</h3>
                            </div>

                            {loadingStats ? (
                                <div className="text-center text-gray-500 py-6 text-sm">Loading…</div>
                            ) : stats ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                        <span className="text-sm text-gray-400">Orders Shielded</span>
                                        <span className="text-xl font-bold text-emerald-400">
                                            {stats.totalOrders}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                        <span className="text-sm text-gray-400">Blocked by Guard</span>
                                        <span className={`text-xl font-bold ${stats.blockedOrders > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                            {stats.blockedOrders}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-gray-400">Avg. Jitter</span>
                                        <span className="text-xl font-bold text-blue-400">
                                            {(stats.avgJitterMs / 1000).toFixed(1)}s
                                        </span>
                                    </div>

                                    {/* Simple visual bar for blocked ratio */}
                                    {stats.totalOrders > 0 && (
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Success rate</span>
                                                <span>{(((stats.totalOrders - stats.blockedOrders) / stats.totalOrders) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${((stats.totalOrders - stats.blockedOrders) / stats.totalOrders) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-6 text-sm">
                                    No data yet. Enable the shield to start monitoring.
                                </div>
                            )}
                        </div>

                        {/* Recent Logs */}
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                                onClick={() => setShowLogs(v => !v)}
                            >
                                <span className="font-semibold text-sm">Recent Shield Logs</span>
                                {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {showLogs && (
                                <div className="border-t border-gray-800 divide-y divide-gray-800 max-h-80 overflow-y-auto">
                                    {logs.length === 0 ? (
                                        <p className="text-center text-gray-500 text-sm py-6">No logs yet.</p>
                                    ) : logs.map(log => (
                                        <div key={log.id} className="px-4 py-3 text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="font-mono font-semibold text-gray-200">
                                                    {log.action} {log.side} {log.symbol}
                                                </span>
                                                {log.blockedByEquityGuard && (
                                                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                                                        <AlertTriangle size={10} /> BLOCKED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-4 text-gray-400">
                                                <span>
                                                    Vol: <span className="text-gray-300">{log.originalVolume}</span>
                                                    {' → '}
                                                    <span className="text-emerald-400">{log.shieldedVolume}</span>
                                                </span>
                                                <span>Jitter: <span className="text-blue-400">{log.jitterMs}ms</span></span>
                                            </div>
                                            <div className="text-gray-500 font-mono">
                                                comment: "{log.comment}" · magic: {log.jitterMs}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
