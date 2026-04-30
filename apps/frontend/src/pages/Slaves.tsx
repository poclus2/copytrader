import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Slave, Master, CreateSlaveDto } from '../api';
import { Plus, Trash2, Server, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { BROKERS } from '../brokers.config';

export default function Slaves() {
    const navigate = useNavigate();
    const [slaves, setSlaves] = useState<Slave[]>([]);
    const [masters, setMasters] = useState<Master[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newSlave, setNewSlave] = useState<CreateSlaveDto>({
        name: '',
        broker: 'binance',
        credentials: {},
        masterId: '',
        config: { mode: 'FIXED_RATIO', ratio: 1.0 },
    });
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');

    useEffect(() => {
        fetchSlaves();
        fetchMasters();
    }, []);

    const fetchSlaves = async () => {
        try {
            const response = await api.get<Slave[]>('/slaves');
            setSlaves(response.data);
        } catch (error) {
            console.error('Failed to fetch slaves:', error);
        }
    };

    const fetchMasters = async () => {
        try {
            const response = await api.get<Master[]>('/masters');
            setMasters(response.data);
            if (response.data.length > 0) {
                setNewSlave(prev => ({ ...prev, masterId: response.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch masters:', error);
        }
    };

    const testConnection = async () => {
        setIsTestingConnection(true);
        setConnectionMessage('');
        setConnectionStatus('idle');
        try {
            const response = await api.post('/brokers/metatrader/verify-connection', {
                ...newSlave.credentials,
                platform: newSlave.credentials.platform || 'mt5'
            });
            // New API response format: { success: boolean, balance?: number, equity?: number, error?: string }
            if (response.data.success) {
                setConnectionStatus('valid');
                const balanceInfo = response.data.balance !== undefined
                    ? ` - Balance: ${response.data.balance}, Equity: ${response.data.equity}`
                    : '';
                setConnectionMessage(`Connection successful${balanceInfo}`);
            } else {
                setConnectionStatus('invalid');
                setConnectionMessage(response.data.error || 'Connection failed');
            }
        } catch (error: any) {
            console.error('Connection test failed:', error);
            setConnectionStatus('error');
            setConnectionMessage(error.response?.data?.error || error.response?.data?.message || error.message || 'Connection test failed');
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/slaves', newSlave);
            setIsCreating(false);
            setNewSlave({
                name: '',
                broker: 'binance',
                credentials: {},
                masterId: masters[0]?.id || '',
                config: { mode: 'FIXED_RATIO', ratio: 1.0 },
            });
            fetchSlaves();
        } catch (error: any) {
            console.error('Failed to create slave:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create slave';
            alert(`Error: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/slaves/${id}`);
            fetchSlaves();
        } catch (error) {
            console.error('Failed to delete slave:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Slaves</h1>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <Plus size={20} />
                    Add Slave
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">New Slave</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={newSlave.name}
                                onChange={(e) => setNewSlave({ ...newSlave, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Broker</label>
                                <select
                                    value={BROKERS.some(b => b.id === newSlave.broker) ? 'metatrader' : newSlave.broker}
                                    onChange={(e) => setNewSlave({ ...newSlave, broker: e.target.value, credentials: {} })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                >
                                    <option value="binance">Binance</option>
                                    <option value="metatrader">MetaTrader</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Master</label>
                                <select
                                    value={newSlave.masterId}
                                    onChange={(e) => setNewSlave({ ...newSlave, masterId: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                    required
                                >
                                    {masters.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Copy Mode</label>
                                <select
                                    value={newSlave.config?.mode || 'FIXED_RATIO'}
                                    onChange={(e) => setNewSlave({
                                        ...newSlave,
                                        config: { ...newSlave.config, mode: e.target.value }
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                >
                                    <option value="FIXED_RATIO">Fixed Ratio</option>
                                    <option value="FIXED_LOT">Fixed Lot</option>
                                    <option value="BALANCE_RATIO">Balance Ratio (Auto)</option>
                                    <option value="EQUITY_RATIO">Equity Ratio (Auto)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {newSlave.config?.mode === 'BALANCE_RATIO' && 'Automatically adjusts lot size based on balance ratio'}
                                    {newSlave.config?.mode === 'EQUITY_RATIO' && 'Automatically adjusts lot size based on equity ratio'}
                                </p>
                            </div>

                            {(newSlave.config?.mode === 'FIXED_RATIO' || newSlave.config?.mode === 'BALANCE_RATIO' || newSlave.config?.mode === 'EQUITY_RATIO') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Ratio Multiplier
                                        {(newSlave.config?.mode === 'BALANCE_RATIO' || newSlave.config?.mode === 'EQUITY_RATIO') && (
                                            <span className="text-xs text-gray-500 ml-2">(Applied after auto-calculation)</span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newSlave.config?.ratio || 1.0}
                                        onChange={(e) => setNewSlave({
                                            ...newSlave,
                                            config: { ...newSlave.config, ratio: parseFloat(e.target.value) }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                    />
                                </div>
                            )}

                            {newSlave.config?.mode === 'FIXED_LOT' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fixed Lot Size</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newSlave.config?.fixedLotSize || 0.01}
                                        onChange={(e) => setNewSlave({
                                            ...newSlave,
                                            config: { ...newSlave.config, fixedLotSize: parseFloat(e.target.value) }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                    />
                                </div>
                            )}
                        </div>

                        {newSlave.broker === 'binance' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">API Key</label>
                                    <input
                                        type="text"
                                        value={newSlave.credentials.apiKey || ''}
                                        onChange={(e) => setNewSlave({
                                            ...newSlave,
                                            credentials: { ...newSlave.credentials, apiKey: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">API Secret</label>
                                    <input
                                        type="password"
                                        value={newSlave.credentials.apiSecret || ''}
                                        onChange={(e) => setNewSlave({
                                            ...newSlave,
                                            credentials: { ...newSlave.credentials, apiSecret: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {(newSlave.broker === 'metatrader' || BROKERS.some(b => b.id === newSlave.broker)) && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Broker List</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        value={BROKERS.some(b => b.id === newSlave.broker) ? newSlave.broker : ''}
                                        onChange={(e) => {
                                            const brokerId = e.target.value;
                                            const broker = BROKERS.find(b => b.id === brokerId);
                                            if (broker) {
                                                const defaultPlatform = broker.platforms[0];
                                                setNewSlave(prev => ({
                                                    ...prev,
                                                    broker: brokerId,
                                                    credentials: {
                                                        ...prev.credentials,
                                                        platform: defaultPlatform
                                                    }
                                                }));
                                            }
                                        }}
                                    >
                                        <option value="">Select a Broker</option>
                                        {BROKERS.map(broker => (
                                            <option key={broker.id} value={broker.id}>{broker.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Server</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        value={newSlave.credentials.server || ''}
                                        onChange={(e) => {
                                            const serverName = e.target.value;
                                            const broker = BROKERS.find(b => b.id === newSlave.broker);
                                            const selectedServer = broker?.servers.find(s => s.name === serverName);

                                            if (selectedServer) {
                                                const [host, port] = selectedServer.address.split(':');
                                                setNewSlave(prev => ({
                                                    ...prev,
                                                    credentials: {
                                                        ...prev.credentials,
                                                        server: serverName,
                                                        host: host,
                                                        port: parseInt(port || '443')
                                                    }
                                                }));
                                            } else {
                                                setNewSlave(prev => ({
                                                    ...prev,
                                                    credentials: { ...prev.credentials, server: serverName }
                                                }));
                                            }
                                        }}
                                    >
                                        <option value="">Select a Server</option>
                                        {(() => {
                                            const broker = BROKERS.find(b => b.id === newSlave.broker);
                                            const servers = broker ? broker.servers : [];
                                            return servers.map(server => (
                                                <option key={server.name} value={server.name}>
                                                    {server.name} ({server.type})
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Select a server to auto-fill host/port for MT4</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bridge IP (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="127.0.0.1"
                                            value={newSlave.credentials.bridgeIp || ''}
                                            onChange={(e) => setNewSlave({
                                                ...newSlave,
                                                credentials: { ...newSlave.credentials, bridgeIp: e.target.value }
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bridge Port (Optional)</label>
                                        <input
                                            type="number"
                                            placeholder="3000"
                                            value={newSlave.credentials.bridgePort || ''}
                                            onChange={(e) => setNewSlave({
                                                ...newSlave,
                                                credentials: { ...newSlave.credentials, bridgePort: parseInt(e.target.value) }
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Login</label>
                                    <input
                                        type="text"
                                        value={newSlave.credentials.login || ''}
                                        onChange={(e) => {
                                            setNewSlave({
                                                ...newSlave,
                                                credentials: { ...newSlave.credentials, login: e.target.value }
                                            });
                                            setConnectionStatus('idle');
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={newSlave.credentials.password || ''}
                                        onChange={(e) => {
                                            setNewSlave({
                                                ...newSlave,
                                                credentials: { ...newSlave.credentials, password: e.target.value }
                                            });
                                            setConnectionStatus('idle');
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Platform</label>
                                    <select
                                        value={newSlave.credentials.platform || 'mt5'}
                                        onChange={(e) => {
                                            setNewSlave({
                                                ...newSlave,
                                                credentials: { ...newSlave.credentials, platform: e.target.value }
                                            });
                                            setConnectionStatus('idle');
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                    >
                                        <option value="mt4">MetaTrader 4</option>
                                        <option value="mt5">MetaTrader 5</option>
                                    </select>
                                </div>

                                {newSlave.credentials.platform === 'mt4' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Host</label>
                                            <input
                                                type="text"
                                                value={newSlave.credentials.host || ''}
                                                onChange={(e) => {
                                                    setNewSlave({
                                                        ...newSlave,
                                                        credentials: { ...newSlave.credentials, host: e.target.value }
                                                    });
                                                    setConnectionStatus('idle');
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                                placeholder="e.g. 192.168.1.1"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Port</label>
                                            <input
                                                type="number"
                                                value={newSlave.credentials.port || ''}
                                                onChange={(e) => {
                                                    setNewSlave({
                                                        ...newSlave,
                                                        credentials: { ...newSlave.credentials, port: parseInt(e.target.value) }
                                                    });
                                                    setConnectionStatus('idle');
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                                placeholder="e.g. 443"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mt-4">
                                    <button
                                        type="button"
                                        onClick={testConnection}
                                        disabled={isTestingConnection || !newSlave.credentials.login || !newSlave.credentials.password}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${isTestingConnection ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {isTestingConnection ? (
                                            <>Testing...</>
                                        ) : (
                                            <>
                                                <Server size={16} />
                                                Test Connection
                                            </>
                                        )}
                                    </button>

                                    {connectionStatus !== 'idle' && (
                                        <div className={`flex items-center gap-2 text-sm ${connectionStatus === 'valid' ? 'text-green-600' :
                                            connectionStatus === 'error' ? 'text-red-600' : 'text-amber-600'
                                            }`}>
                                            {connectionStatus === 'valid' && <CheckCircle size={16} />}
                                            {connectionStatus === 'invalid' && <XCircle size={16} />}
                                            {connectionStatus === 'error' && <AlertTriangle size={16} />}
                                            <span>{connectionMessage}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (newSlave.broker === 'metatrader' && connectionStatus !== 'valid')}
                                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${(isSubmitting || (newSlave.broker === 'metatrader' && connectionStatus !== 'valid')) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Slave'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Master</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {slaves.map((slave) => (
                            <tr
                                key={slave.id}
                                onClick={() => navigate(`/slaves/${slave.id}`)}
                                className="hover:bg-gray-50 cursor-pointer"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{slave.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500 capitalize">{slave.broker}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {slave.master?.name || 'Unknown'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(slave.id);
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {slaves.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No slave accounts found. Create one to start copying trades.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
