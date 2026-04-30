import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Master } from '../api';
import { ArrowLeft, Save, Trash2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { BROKERS } from '../brokers.config';
import TradeHistory from '../components/TradeHistory';
import AccountSummaryCards from '../components/AccountSummaryCards';
import ErrorBoundary from '../components/ErrorBoundary';

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
    const [accountInfo, setAccountInfo] = useState<{ balance: number; equity: number }>({ balance: 0, equity: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchMaster();
        fetchTrades(1);
    }, [id]);

    useEffect(() => {
        if (master?.credentials?.bridgeIp) {
            fetchAccountInfo();
        }
    }, [master]);

    const fetchMaster = async () => {
        try {
            const response = await api.get<Master>(`/masters/${id}`);
            setMaster(response.data);
        } catch (error) {
            console.error('Failed to fetch master:', error);
            alert('Failed to load master details');
            navigate('/masters');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrades = async (page: number = 1) => {
        try {
            const response = await api.get(`/masters/${id}/trades?page=${page}&limit=20`);
            // Handle both old array format and new paginated format
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                setTrades(response.data.data);
                setTotalPages(Math.ceil(response.data.total / 20));
                setCurrentPage(page);
            } else if (Array.isArray(response.data)) {
                // Fallback for non-paginated response
                setTrades(response.data);
                setTotalPages(1);
                setCurrentPage(1);
            } else {
                setTrades([]);
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error);
            // Set to empty array on error to prevent rendering issues
            setTrades([]);
        }
    };

    const fetchAccountInfo = async () => {
        if (!master) return;
        try {
            const response = await api.post('/brokers/metatrader/verify-connection', {
                ...master.credentials,
                platform: master.credentials.platform || 'mt5'
            });
            if (response.data.success && response.data.balance !== undefined) {
                setAccountInfo({
                    balance: response.data.balance,
                    equity: response.data.equity
                });
            }
        } catch (error) {
            console.error('Failed to fetch account info:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchMaster(),
            fetchTrades(currentPage),
            fetchAccountInfo()
        ]);
        setIsRefreshing(false);
    };

    const calculateStats = () => {
        let totalProfit = 0;
        let withdrawals = 0;

        // Safety check: ensure trades is an array
        if (trades && Array.isArray(trades)) {
            trades.forEach(trade => {
                // Assuming trade structure matches backend entity
                // Profit is stored in 'profit' field
                if (trade.profit) {
                    totalProfit += Number(trade.profit);
                }
                // If we had withdrawal info, we would sum it here.
                // Currently backend Trade entity doesn't explicitly flag withdrawals unless we check type/comment
                // For now, we'll sum negative profit as loss, but user asked for "Withdrawals".
                // Since we don't have explicit withdrawal tracking in Trade entity yet (only BUY/SELL),
                // we will leave withdrawals as 0 for now or try to infer it if we had type 'BALANCE'.
                // The current Trade entity filters for BUY/SELL only in CopyEngineService.
            });
        }

        return { totalProfit, withdrawals };
    };

    const { totalProfit, withdrawals } = calculateStats();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!master) return;
        setIsSaving(true);
        try {
            await api.patch(`/masters/${id}`, master);
            alert('Master updated successfully');
        } catch (error: any) {
            console.error('Failed to update master:', error);
            alert(`Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this master? This action cannot be undone.')) return;
        try {
            await api.delete(`/masters/${id}`);
            navigate('/masters');
        } catch (error) {
            console.error('Failed to delete master:', error);
            alert('Failed to delete master');
        }
    };

    const testConnection = async () => {
        if (!master) return;
        setIsTestingConnection(true);
        setConnectionMessage('');
        setConnectionStatus('idle');
        try {
            const response = await api.post('/brokers/metatrader/verify-connection', {
                ...master.credentials,
                platform: master.credentials.platform || 'mt5'
            });
            if (response.data.success) {
                setConnectionStatus('valid');
                const balanceInfo = response.data.balance !== undefined
                    ? ` - Balance: ${response.data.balance}, Equity: ${response.data.equity}`
                    : '';
                setConnectionMessage(`Connection successful${balanceInfo}`);

                if (response.data.balance !== undefined) {
                    setAccountInfo({
                        balance: response.data.balance,
                        equity: response.data.equity
                    });
                }
            } else {
                setConnectionStatus('invalid');
                setConnectionMessage(response.data.error || 'Connection failed');
            }
        } catch (error: any) {
            console.error('Connection test failed:', error);
            setConnectionStatus('error');
            setConnectionMessage(error.response?.data?.error || error.message || 'Connection test failed');
        } finally {
            setIsTestingConnection(false);
        }
    };

    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!master) return <div className="p-6">Master not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/masters')}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Master Details</h1>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    title="Refresh Data"
                >
                    <RefreshCw size={24} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            <ErrorBoundary>
                <AccountSummaryCards
                    balance={accountInfo.balance}
                    equity={accountInfo.equity}
                    profit={totalProfit}
                    withdrawals={withdrawals}
                />
            </ErrorBoundary>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Public Profile Section */}
                        <div className="md:col-span-2 border-b pb-6 mb-2">
                            <h3 className="text-lg font-medium mb-4">Public Profile Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <input
                                        type="text"
                                        value={master.name}
                                        onChange={(e) => setMaster({ ...master, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        value={master.type || 'HUMAN'}
                                        onChange={(e) => setMaster({ ...master, type: e.target.value as 'HUMAN' | 'BOT' })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    >
                                        <option value="HUMAN">Human Trader</option>
                                        <option value="BOT">Trading Bot</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Strategy</label>
                                    <input
                                        type="text"
                                        value={master.strategy || ''}
                                        onChange={(e) => setMaster({ ...master, strategy: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="e.g. Day Trading, Scalping"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Monthly Fee ($)</label>
                                    <input
                                        type="number"
                                        value={master.monthlyFee || 0}
                                        onChange={(e) => setMaster({ ...master, monthlyFee: parseFloat(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Risk Score (1-10)</label>
                                    <input
                                        type="number"
                                        value={master.riskScore || 1}
                                        onChange={(e) => setMaster({ ...master, riskScore: parseInt(e.target.value) })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        min="1"
                                        max="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                                    <input
                                        type="text"
                                        value={master.avatar || ''}
                                        onChange={(e) => setMaster({ ...master, avatar: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={master.description || ''}
                                        onChange={(e) => setMaster({ ...master, description: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        rows={3}
                                        placeholder="Describe the trading strategy and background..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Broker</label>
                            <select
                                value={BROKERS.some(b => b.id === master.broker) ? 'metatrader' : master.broker}
                                onChange={(e) => setMaster({ ...master, broker: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            >
                                <option value="binance">Binance</option>
                                <option value="metatrader">MetaTrader</option>
                            </select>
                        </div>
                    </div>

                    {master.broker === 'binance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">API Key</label>
                                <input
                                    type="text"
                                    value={master.credentials.apiKey || ''}
                                    onChange={(e) => setMaster({
                                        ...master,
                                        credentials: { ...master.credentials, apiKey: e.target.value }
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">API Secret</label>
                                <input
                                    type="password"
                                    value={master.credentials.apiSecret || ''}
                                    onChange={(e) => setMaster({
                                        ...master,
                                        credentials: { ...master.credentials, apiSecret: e.target.value }
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                />
                            </div>
                        </div>
                    )}

                    {(master.broker === 'metatrader' || BROKERS.some(b => b.id === master.broker)) && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-medium">MetaTrader Connection</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Broker List</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={BROKERS.some(b => b.id === master.broker) ? master.broker : ''}
                                        onChange={(e) => {
                                            const brokerId = e.target.value;
                                            const broker = BROKERS.find(b => b.id === brokerId);
                                            if (broker) {
                                                setMaster({
                                                    ...master,
                                                    broker: brokerId,
                                                    credentials: {
                                                        ...master.credentials,
                                                        platform: broker.platforms[0]
                                                    }
                                                });
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
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={master.credentials.server || ''}
                                        onChange={(e) => setMaster({
                                            ...master,
                                            credentials: { ...master.credentials, server: e.target.value }
                                        })}
                                    >
                                        <option value="">Select a Server</option>
                                        {(() => {
                                            const broker = BROKERS.find(b => b.id === master.broker);
                                            const servers = broker ? broker.servers : [];
                                            return servers.map(server => (
                                                <option key={server.name} value={server.name}>
                                                    {server.name} ({server.type})
                                                </option>
                                            ));
                                        })()}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bridge IP</label>
                                    <input
                                        type="text"
                                        value={master.credentials.bridgeIp || ''}
                                        onChange={(e) => setMaster({
                                            ...master,
                                            credentials: { ...master.credentials, bridgeIp: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="127.0.0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bridge Port</label>
                                    <input
                                        type="number"
                                        value={master.credentials.bridgePort || ''}
                                        onChange={(e) => setMaster({
                                            ...master,
                                            credentials: { ...master.credentials, bridgePort: parseInt(e.target.value) }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        placeholder="3000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Login</label>
                                    <input
                                        type="text"
                                        value={master.credentials.login || ''}
                                        onChange={(e) => setMaster({
                                            ...master,
                                            credentials: { ...master.credentials, login: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={master.credentials.password || ''}
                                        onChange={(e) => setMaster({
                                            ...master,
                                            credentials: { ...master.credentials, password: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={testConnection}
                                    disabled={isTestingConnection}
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
                        </div>
                    )}

                    <div className="flex justify-between pt-6 border-t">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 text-red-600 hover:text-red-800 flex items-center gap-2"
                        >
                            <Trash2 size={20} />
                            Delete Master
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/masters')}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save size={20} />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Trade History */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Trade History</h2>
                <ErrorBoundary>
                    <TradeHistory
                        trades={trades}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => fetchTrades(page)}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
}
