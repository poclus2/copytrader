import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import type { Master, Slave } from '../api';
import {
    TrendingUp, TrendingDown, Zap, BarChart2, ArrowUpRight, ArrowDownRight,
    DollarSign, Users, UserCog, Activity, ShieldCheck, MoreHorizontal,
    ArrowUp, ArrowDown, ChevronRight, RefreshCw, AlertCircle,
    CheckCircle, Clock, Eye
} from 'lucide-react';

// ── Simple SVG sparkline ─────────────────────────────────────────────────────
function Sparkline({ data, color = '#3B7EF6', height = 40 }: {
    data: number[]; color?: string; height?: number;
}) {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 100; const h = height;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    }).join(' ');
    const area = `M0,${h} L${pts.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, '$1,$2').split(' ').map((p, i) => i === 0 ? `L${p}` : `L${p}`).join(' ')} L${w},${h} Z`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }} className="overflow-visible">
            <defs>
                <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M0,${h - ((data[0] - min) / range) * h} ` + data.map((v, i) => `L${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).slice(1).join(' ') + ` L${w},${h} L0,${h} Z`}
                fill={`url(#grad-${color.replace('#','')})`} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ── Mini chart for balance card ───────────────────────────────────────────────
function BalanceChart({ balance, equity }: { balance: number[]; equity: number[] }) {
    const allVals = [...balance, ...equity];
    const min = Math.min(...allVals) * 0.97;
    const max = Math.max(...allVals) * 1.01;
    const range = max - min;
    const W = 300; const H = 100;
    const toX = (i: number, len: number) => (i / (len - 1)) * W;
    const toY = (v: number) => H - ((v - min) / range) * H;
    const polyline = (arr: number[]) => arr.map((v, i) => `${toX(i, arr.length)},${toY(v)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H }}>
            <defs>
                <linearGradient id="bal-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B7EF6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3B7EF6" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Equity area */}
            <path
                d={`M0,${toY(equity[0])} ` + equity.map((v, i) => `L${toX(i, equity.length)},${toY(v)}`).slice(1).join(' ') + ` L${W},${H} L0,${H} Z`}
                fill="url(#bal-grad)" opacity="0.5"
            />
            {/* Balance line */}
            <polyline points={polyline(balance)} fill="none" stroke="#3B7EF6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {/* Equity line */}
            <polyline points={polyline(equity)} fill="none" stroke="#F97316" strokeWidth="1.5" strokeDasharray="4 3" strokeLinejoin="round" />
            {/* Dashed vertical at midpoint */}
            <line x1={W / 2} y1="0" x2={W / 2} y2={H} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
            {/* Tooltip dot */}
            <circle cx={W / 2} cy={toY(balance[Math.floor(balance.length / 2)])} r="4" fill="#3B7EF6" stroke="white" strokeWidth="1.5" />
        </svg>
    );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashStats {
    masters: number;
    slaves: number;
    activeSlaves: number;
    propFirmSlaves: number;
    totalBalance: number;
    totalEquity: number;
    activeMasters: number;
}

interface RecentActivity {
    id: string;
    type: 'slave_created' | 'master_added' | 'trade_copied' | 'slave_paused';
    message: string;
    time: string;
    icon: 'success' | 'info' | 'warning' | 'error';
}

// ── Dummy time-series for chart demo ─────────────────────────────────────────
const BALANCE_DATA = [98000, 100500, 99200, 102000, 101000, 103500, 105000, 104200, 106800, 108000, 107500, 110000];
const EQUITY_DATA  = [97000,  98000,100000,  99500,102500, 101500, 104000, 103000, 105500, 106500, 108500, 109000];

export default function Dashboard() {
    const [stats, setStats] = useState<DashStats>({
        masters: 0, slaves: 0, activeSlaves: 0, propFirmSlaves: 0,
        totalBalance: 0, totalEquity: 0, activeMasters: 0,
    });
    const [masters, setMasters] = useState<Master[]>([]);
    const [slaves, setSlaves] = useState<Slave[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, sRes] = await Promise.all([
                api.get<Master[]>('/masters'),
                api.get<Slave[]>('/slaves'),
            ]);
            const m = mRes.data;
            const s = sRes.data;
            setMasters(m.slice(0, 5));
            setSlaves(s.slice(0, 5));
            setStats({
                masters: m.length,
                slaves: s.length,
                activeSlaves: s.filter((x: any) => x.status === 'ACTIVE').length,
                propFirmSlaves: s.filter((x: any) => x.isPropFirm).length,
                totalBalance: s.reduce((acc: number, x: any) => acc + Number(x.balance || 0), 0),
                totalEquity: s.reduce((acc: number, x: any) => acc + Number(x.equity || 0), 0),
                activeMasters: m.filter((x: any) => x.status === 'ACTIVE').length,
            });
        } catch { /* silent */ }
        finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    };

    useEffect(() => { fetchData(); }, []);

    const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;

    const STAT_CARDS = [
        { label: 'Total Masters',    value: stats.masters,       icon: UserCog,    color: 'blue',   badge: `${stats.activeMasters} actifs`,        delta: 'up' },
        { label: 'Total Slaves',     value: stats.slaves,        icon: Users,      color: 'green',  badge: `${stats.activeSlaves} actifs`,          delta: 'up' },
        { label: 'PropFirm Shields', value: stats.propFirmSlaves,icon: ShieldCheck,color: 'purple', badge: 'Shield actif',                         delta: 'flat' },
        { label: 'Balance Totale',   value: fmt(stats.totalBalance), icon: DollarSign, color: 'orange', badge: fmt(stats.totalEquity) + ' equity', delta: stats.totalBalance > 0 ? 'up' : 'flat' },
    ];

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            ACTIVE: 'badge-active', PENDING: 'badge-pending',
            PAUSED: 'badge-paused', STOPPED: 'badge-stopped',
        };
        return `badge ${map[status] || 'badge-pending'}`;
    };

    const colorMap: Record<string, string> = {
        blue: 'icon-wrap-blue', green: 'icon-wrap-green',
        purple: 'icon-wrap-purple', orange: 'icon-wrap-orange',
    };

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Page Header ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                        Welcome back, Admin
                    </h1>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Dernière mise à jour · {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={fetchData}>
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button className="btn btn-primary btn-sm">
                        <Activity size={13} />
                        Copy Engine
                    </button>
                </div>
            </div>

            {/* ── Stat Cards Row ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {STAT_CARDS.map(({ label, value, icon: Icon, color, badge, delta }) => (
                    <div key={label} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div className={`icon-wrap ${colorMap[color]}`} style={{ width: 34, height: 34 }}>
                                <Icon size={16} />
                            </div>
                            <button className="btn-ghost btn-icon" style={{ padding: 4 }}>
                                <MoreHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                        <div className="stat-card-label">{label}</div>
                        <div className="stat-card-value">{value}</div>
                        <div style={{ marginTop: 6 }}>
                            <span className={`stat-card-badge ${delta === 'up' ? 'badge-up' : delta === 'down' ? 'badge-down' : 'badge-flat'}`}>
                                {delta === 'up' && <ArrowUp size={10} />}
                                {delta === 'down' && <ArrowDown size={10} />}
                                {badge}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main grid: Chart left, Cards right ────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>

                {/* Balance chart card */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">
                                <BarChart2 size={15} style={{ color: 'var(--primary)' }} />
                                Total Balance
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginTop: 2 }}>
                                Profit: +0.8%
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Balance</div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {fmt(stats.totalBalance || 120567)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Equity</div>
                                <div style={{ fontWeight: 700, color: '#F97316' }}>
                                    {fmt(stats.totalEquity || 240952)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card-body" style={{ paddingTop: 10 }}>
                        <BalanceChart balance={BALANCE_DATA} equity={EQUITY_DATA} />
                        {/* X axis labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                            {['0','1','2','3','4'].map(l => <span key={l}>{l}</span>)}
                        </div>
                        {/* Legend */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                                <span style={{ width: 20, height: 2, background: '#3B7EF6', display: 'inline-block', borderRadius: 1 }} />
                                Balance
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                                <span style={{ width: 20, height: 2, background: '#F97316', display: 'inline-block', borderRadius: 1, borderTop: '2px dashed #F97316' }} />
                                Equity
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right column: Profit Target + Daily Loss */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Profit Target */}
                    <div className="card" style={{ padding: '16px 18px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="icon-wrap icon-wrap-blue" style={{ width: 30, height: 30 }}>
                                    <TrendingUp size={14} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Profit Target</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Of $12,000.00</div>
                                </div>
                            </div>
                            <MoreHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>$8,908.99</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                            Equity Pass Level <span style={{ color: 'var(--primary)', fontWeight: 600 }}>$124,900.00</span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 4, background: 'var(--border-light)', borderRadius: 2 }}>
                            <div style={{ height: 4, width: '74%', background: 'var(--primary)', borderRadius: 2 }} />
                        </div>
                    </div>

                    {/* Daily Loss Limit */}
                    <div className="card" style={{ padding: '16px 18px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="icon-wrap icon-wrap-orange" style={{ width: 30, height: 30 }}>
                                    <TrendingDown size={14} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Daily Loss Limit</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Of $12,000.00</div>
                                </div>
                            </div>
                            <MoreHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>$12,908.99</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                            Equity Breach Level <span style={{ color: 'var(--danger)', fontWeight: 600 }}>$124,900.00</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--border-light)', borderRadius: 2 }}>
                            <div style={{ height: 4, width: '88%', background: 'var(--danger)', borderRadius: 2 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Performance metrics row ────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
                {[
                    { label: 'Average Win',    value: '$642.00',    badge: '↑ 7%',   badgeType: 'up',   icon: TrendingUp    },
                    { label: 'Average Loss',   value: '$0.00',      badge: '0%',     badgeType: 'flat', icon: TrendingDown  },
                    { label: 'Profit Factor',  value: '6.4',        badge: 'Good',   badgeType: 'up',   icon: BarChart2     },
                    { label: 'Best Trade',     value: '$8,908.99',  badge: 'EURUSD', badgeType: 'up',   icon: Zap           },
                    { label: 'Win Ratio',      value: '-$4,800.90', badge: '↓ 2%',   badgeType: 'down', icon: Activity      },
                    { label: 'Risk Reward',    value: '$3,490.00',  badge: '1:3',    badgeType: 'flat', icon: ShieldCheck   },
                ].map(({ label, value, badge, badgeType, icon: Icon }) => (
                    <div key={label} className="stat-card" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                            <div className="icon-wrap icon-wrap-blue" style={{ width: 26, height: 26 }}>
                                <Icon size={12} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
                        <span className={`stat-card-badge ${badgeType === 'up' ? 'badge-up' : badgeType === 'down' ? 'badge-down' : 'badge-flat'}`}
                            style={{ fontSize: 10 }}>
                            {badge}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Bottom grid: Masters table + Notifications ─────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>

                {/* Recent Masters table */}
                <div className="card">
                    <div className="card-header" style={{ paddingBottom: 12 }}>
                        <div className="card-title">
                            <UserCog size={14} style={{ color: 'var(--primary)' }} />
                            Masters récents
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Derniers 30j</span>
                            <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>
                                Voir tout
                            </button>
                        </div>
                    </div>
                    <div className="divider" />
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Broker</th>
                                <th>Slaves</th>
                                <th>Status</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {masters.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <UserCog size={28} />
                                            <p>Aucun master configuré</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : masters.map((m: any) => (
                                <tr key={m.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="icon-wrap icon-wrap-blue" style={{ width: 28, height: 28, borderRadius: 8 }}>
                                                <UserCog size={12} />
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{m.name}</span>
                                        </div>
                                    </td>
                                    <td><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{m.broker}</span></td>
                                    <td><span style={{ fontWeight: 600 }}>{m.slaveCount || 0}</span></td>
                                    <td><span className={getStatusBadge(m.status)}>{m.status}</span></td>
                                    <td style={{ fontWeight: 600 }}>${Number(m.balance || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Notifications / Slaves summary */}
                <div className="card">
                    <div className="card-header" style={{ paddingBottom: 12 }}>
                        <div className="card-title">
                            <Activity size={14} style={{ color: 'var(--primary)' }} />
                            Activité Récente
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Derniers 30j</span>
                    </div>
                    <div className="divider" />
                    <div style={{ padding: '8px 0' }}>
                        {slaves.length === 0 ? (
                            <div className="empty-state">
                                <Activity size={28} />
                                <p>Aucune activité</p>
                            </div>
                        ) : slaves.map((s: any) => (
                            <div key={s.id} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 18px', borderBottom: '1px solid var(--border-light)'
                            }}>
                                <div className={`icon-wrap ${s.status === 'ACTIVE' ? 'icon-wrap-green' : 'icon-wrap-orange'}`}
                                    style={{ width: 30, height: 30, flexShrink: 0 }}>
                                    {s.status === 'ACTIVE' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                                        {s.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {s.master?.name || 'No master'} · {s.broker}
                                    </div>
                                </div>
                                {s.isPropFirm && (
                                    <span className="badge badge-propfirm" style={{ fontSize: 10 }}>
                                        <ShieldCheck size={9} /> PF
                                    </span>
                                )}
                                <span className={getStatusBadge(s.status)} style={{ fontSize: 10 }}>{s.status}</span>
                            </div>
                        ))}
                    </div>
                    {slaves.length > 0 && (
                        <div style={{ padding: '10px 18px' }}>
                            <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                                Voir tous les slaves <ChevronRight size={13} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
