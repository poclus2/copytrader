import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Settings as SettingsIcon, Play, Plus, Trash2 } from 'lucide-react';

interface SymbolMapping {
    id?: string;
    masterSymbol: string;
    slaveSymbol: string;
    brokerName?: string;
}

export default function Settings() {
    const [mappings, setMappings] = useState<SymbolMapping[]>([]);
    const [newMapping, setNewMapping] = useState<SymbolMapping>({ masterSymbol: '', slaveSymbol: '', brokerName: '' });
    const [simMaster, setSimMaster] = useState('');
    const [simBroker, setSimBroker] = useState('');
    const [simResult, setSimResult] = useState('');

    useEffect(() => {
        loadMappings();
    }, []);

    const loadMappings = async () => {
        try {
            const res = await api.get<SymbolMapping[]>('/prop-firm-shield/symbols/mappings');
            setMappings(res.data);
        } catch { /* silent */ }
    };

    const addMapping = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/prop-firm-shield/symbols/mappings', newMapping);
            setNewMapping({ masterSymbol: '', slaveSymbol: '', brokerName: '' });
            loadMappings();
        } catch { alert('Erreur lors de l\'ajout du mapping'); }
    };

    const deleteMapping = async (id?: string) => {
        if (!id) return;
        if (!confirm('Supprimer cette règle ?')) return;
        try {
            await api.delete(`/prop-firm-shield/symbols/mappings/${id}`);
            loadMappings();
        } catch { alert('Erreur lors de la suppression'); }
    };

    const simulate = async () => {
        if (!simMaster) return;
        try {
            const res = await api.get(`/prop-firm-shield/symbols/simulate?masterSymbol=${encodeURIComponent(simMaster)}&brokerName=${encodeURIComponent(simBroker)}`);
            setSimResult(res.data.result);
        } catch { setSimResult('Erreur'); }
    };

    return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="icon-wrap icon-wrap-gray" style={{ width: 40, height: 40, borderRadius: 10 }}>
                        <SettingsIcon size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Paramètres Globaux</h1>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            Configuration globale du système CopyTrading
                        </p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{ paddingBottom: 16 }}>
                    <div className="card-title">
                        <SettingsIcon size={16} style={{ color: 'var(--primary)' }} />
                        Global Symbol Mapping
                    </div>
                </div>
                <div className="divider" />
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
                    {/* CRUD List */}
                    <div>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Règles de traduction (Master → Slave)</h3>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Ces règles sont appliquées globalement à tous les trades (VIRTUAL et EXTERNAL) copiés par le système, quel que soit l'état du PropFirm Shield.
                        </p>
                        <form onSubmit={addMapping} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                            <input className="form-control" placeholder="Master Symbol (ex: XAUUSD+)"
                                value={newMapping.masterSymbol} onChange={e => setNewMapping({ ...newMapping, masterSymbol: e.target.value })} required />
                            <input className="form-control" placeholder="Slave Symbol (ex: XAUUSD)"
                                value={newMapping.slaveSymbol} onChange={e => setNewMapping({ ...newMapping, slaveSymbol: e.target.value })} required />
                            <input className="form-control" placeholder="Broker (optionnel)"
                                value={newMapping.brokerName || ''} onChange={e => setNewMapping({ ...newMapping, brokerName: e.target.value })} />
                            <button type="submit" className="btn btn-primary" style={{ padding: '0 16px' }}><Plus size={16} /></button>
                        </form>
                        
                        <div style={{ background: 'var(--bg-page)', borderRadius: 8, overflow: 'hidden' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--border-light)', fontSize: 11, color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '8px 12px' }}>Master Symbol</th>
                                        <th style={{ padding: '8px 12px' }}>Slave Symbol</th>
                                        <th style={{ padding: '8px 12px' }}>Broker Spécifique</th>
                                        <th style={{ padding: '8px 12px', width: 40 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mappings.length === 0 ? (
                                        <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Aucune règle manuelle. L'auto-clean est actif.</td></tr>
                                    ) : mappings.map(m => (
                                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{m.masterSymbol}</td>
                                            <td style={{ padding: '8px 12px', color: 'var(--success)' }}>{m.slaveSymbol}</td>
                                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{m.brokerName || 'Tous'}</td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: 4 }}
                                                    onClick={() => deleteMapping(m.id)}><Trash2 size={13} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Simulator */}
                    <div style={{ background: 'var(--bg-page)', padding: 16, borderRadius: 8 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--primary)' }}>Simulateur</h3>
                        <div className="form-group">
                            <label className="form-label">Symbole original (Master)</label>
                            <input className="form-control" value={simMaster} onChange={e => setSimMaster(e.target.value)} placeholder="ex: CASH_IND_US30" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Broker Slave (optionnel)</label>
                            <input className="form-control" value={simBroker} onChange={e => setSimBroker(e.target.value)} placeholder="ex: ic-markets" />
                        </div>
                        <button className="btn btn-outline" style={{ width: '100%', marginBottom: 16 }} onClick={simulate}>
                            <Play size={14} /> Tester
                        </button>
                        {simResult && (
                            <div style={{ padding: 12, background: 'var(--primary-light)', borderRadius: 6, border: '1px solid var(--primary)', textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Résultat</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{simResult}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
