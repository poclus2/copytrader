import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Master, CreateMasterDto } from '../api';
import { Plus, Trash2, Server, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { BROKERS } from '../brokers.config';

export default function Masters() {
    const navigate = useNavigate();
    const [masters, setMasters] = useState<Master[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newMaster, setNewMaster] = useState<CreateMasterDto>({
        name: '',
        broker: 'binance',
        credentials: {},
    });
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'valid' | 'invalid' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');

    useEffect(() => {
        fetchMasters();
    }, []);

    const fetchMasters = async () => {
        try {
            const response = await api.get<Master[]>('/masters');
            setMasters(response.data);
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
                ...newMaster.credentials,
                platform: newMaster.credentials.platform || 'mt5'
            });
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
            await api.post('/masters', newMaster);
            setIsCreating(false);
            setNewMaster({ name: '', broker: 'binance', credentials: {} });
            fetchMasters();
        } catch (error: any) {
            console.error('Failed to create master:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create master';
            alert(`Error: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/masters/${id}`);
            fetchMasters();
        } catch (error) {
            console.error('Failed to delete master:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Masters</h1>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Master
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">New Master</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={newMaster.name}
                                onChange={(e) => setNewMaster({ ...newMaster, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Broker</label>
                            <select
                                value={BROKERS.some(b => b.id === newMaster.broker) ? 'metatrader' : newMaster.broker}
                                onChange={(e) => setNewMaster({ ...newMaster, broker: e.target.value, credentials: {} })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            >
                                <option value="binance">Bin ance</option>
                                <option value="metatrader">MetaTrader</option>
                            </select>
                        </div>

                        {newMaster.broker === 'binance' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">API Key</label>
                                    <input
                                        type="text"
                                        value={newMaster.credentials.apiKey || ''}
                                        onChange={(e) => setNewMaster({
                                            ...newMaster,
                                            credentials: { ...newMaster.credentials, apiKey: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">API Secret</label>
                                    <input
                                        type="password"
                                        value={newMaster.credentials.apiSecret || ''}
                                        onChange={(e) => setNewMaster({
                                            ...newMaster,
                                            credentials: { ...newMaster.credentials, apiSecret: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {(newMaster.broker === 'metatrader' || BROKERS.some(b => b.id === newMaster.broker)) && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Broker List</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={BROKERS.some(b => b.id === newMaster.broker) ? newMaster.broker : ''}
                                        onChange={(e) => {
                                            const brokerId = e.target.value;
                                            const broker = BROKERS.find(b => b.id === brokerId);
                                            if (broker) {
                                                const defaultPlatform = broker.platforms[0];
                                                setNewMaster(prev => ({
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
                                    <div className="space-y-2">
                                        <select
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            value={newMaster.credentials.server && BROKERS.find(b => b.id === newMaster.broker)?.servers.some(s => s.name === newMaster.credentials.server) ? newMaster.credentials.server : 'manual'}
                                            onChange={(e) => {
                                                const serverName = e.target.value;
                                                if (serverName === 'manual') {
                                                    setNewMaster(prev => ({
                                                        ...prev,
                                                        credentials: { ...prev.credentials, server: '' }
                                                    }));
                                                    return;
                                                }

                                                const broker = BROKERS.find(b => b.id === newMaster.broker);
                                                const selectedServer = broker?.servers.find(s => s.name === serverName);

                                                if (selectedServer) {
                                                    const [host, port] = selectedServer.address.split(':');
                                                    setNewMaster(prev => ({
                                                        ...prev,
                                                        credentials: {
                                                            ...prev.credentials,
                                                            server: serverName,
                                                            host,
                                                            port: parseInt(port)
                                                        }
                                                    }));
                                                }
                                            }}
                                        >
                                            <option value="">Select a Server</option>
                                            {(() => {
                                                const broker = BROKERS.find(b => b.id === newMaster.broker);
                                                const servers = broker ? broker.servers : [];
                                                return servers.map(server => (
                                                    <option key={server.name} value={server.name}>
                                                        {server.name} ({server.type})
                                                    </option>
                                                ));
                                            })()}
                                            <option value="manual">Enter Manually...</option>
                                        </select>

                                        {(!newMaster.credentials.server || !BROKERS.find(b => b.id === newMaster.broker)?.servers.some(s => s.name === newMaster.credentials.server)) && (
                                            <input
                                                type="text"
                                                placeholder="Enter server name (e.g., MetaQuotes-Demo)"
                                                value={newMaster.credentials.server || ''}
                                                onChange={(e) => setNewMaster({
                                                    ...newMaster,
                                                    credentials: { ...newMaster.credentials, server: e.target.value }
                                                })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Select a server or enter name manually</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bridge IP (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="127.0.0.1"
                                            value={newMaster.credentials.bridgeIp || ''}
                                            onChange={(e) => setNewMaster({
                                                ...newMaster,
                                                credentials: { ...newMaster.credentials, bridgeIp: e.target.value }
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bridge Port (Optional)</label>
                                        <input
                                            type="number"
                                            placeholder="3000"
                                            value={newMaster.credentials.bridgePort || ''}
                                            onChange={(e) => setNewMaster({
                                                ...newMaster,
                                                credentials: { ...newMaster.credentials, bridgePort: parseInt(e.target.value) || '' }
                                            })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Login</label>
                                    <input
                                        type="text"
                                        value={newMaster.credentials.login || ''}
                                        onChange={(e) => setNewMaster({
                                            ...newMaster,
                                            credentials: { ...newMaster.credentials, login: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={newMaster.credentials.password || ''}
                                        onChange={(e) => setNewMaster({
                                            ...newMaster,
                                            credentials: { ...newMaster.credentials, password: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        required
                                    />
                                </div>

                                {newMaster.credentials.platform === 'mt4' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Host</label>
                                            <input
                                                type="text"
                                                value={newMaster.credentials.host || ''}
                                                onChange={(e) => setNewMaster({
                                                    ...newMaster,
                                                    credentials: { ...newMaster.credentials, host: e.target.value }
                                                })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Port</label>
                                            <input
                                                type="number"
                                                value={newMaster.credentials.port || ''}
                                                onChange={(e) => setNewMaster({
                                                    ...newMaster,
                                                    credentials: { ...newMaster.credentials, port: parseInt(e.target.value) }
                                                })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Connection Test */}
                                <div className="flex items-center gap-4 mt-4">
                                    <button
                                        type="button"
                                        onClick={testConnection}
                                        disabled={isTestingConnection || !newMaster.credentials.login || !newMaster.credentials.password}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isTestingConnection && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        Test Connection
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

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {masters.map((master) => (
                    <div
                        key={master.id}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/masters/${master.id}`)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Server className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{master.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{master.broker}</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(master.id);
                                }}
                                className="text-gray-400 hover:text-red-600"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div className="text-sm text-gray-500">
                            ID: {master.id.slice(0, 8)}...
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
