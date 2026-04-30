import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Slave, type Master } from '../api';
import { ArrowLeft, Save, Trash2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { BROKERS } from '../brokers.config';
import TradeHistory from '../components/TradeHistory';
import AccountSummaryCards from '../components/AccountSummaryCards';
import ErrorBoundary from '../components/ErrorBoundary';

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

    useEffect(() => {
        fetchSlaveAndMasters();
        fetchTrades(1);
    }, [id]);

    useEffect(() => {
        if (slave?.credentials?.bridgeIp) {
            fetchAccountInfo();
        }
    }, [slave]);

    const fetchSlaveAndMasters = async () => {
        try {
            const [slaveRes, mastersRes] = await Promise.all([
                api.get<Slave>(`/slaves/${id}`),
                api.get<Master[]>('/masters')
            ]);
            setSlave(slaveRes.data);
            setMasters(mastersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            alert('Failed to load slave details');
            navigate('/slaves');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrades = async (page: number = 1) => {
        try {
            const response = await api.get(`/slaves/${id}/trades?page=${page}&limit=20`);
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
            setTrades([]);
        }
    };

    const fetchAccountInfo = async () => {
        if (!slave) return;
        try {
            const response = await api.post('/brokers/metatrader/verify-connection', {
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
            console.error('Failed to fetch account info:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchSlaveAndMasters(),
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
                if (trade.profit) {
                    totalProfit += Number(trade.profit);
                }
            });
        }

        return { totalProfit, withdrawals };
    };

    const { totalProfit, withdrawals } = calculateStats();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slave) return;
        setIsSaving(true);
        try {
            // The backend expects masterId in the update DTO, extract it from master object
            const updateData = {
                name: slave.name,
                broker: slave.broker,
                credentials: slave.credentials,
                config: slave.config,
                masterId: slave.master?.id || ''
            };
            await api.patch(`/slaves/${id}`, updateData);
            alert('Slave updated successfully');
        } catch (error: any) {
            console.error('Failed to update slave:', error);
            alert(`Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this slave? This action cannot be undone.')) return;
        try {
            await api.delete(`/slaves/${id}`);
            navigate('/slaves');
        } catch (error) {
            console.error('Failed to delete slave:', error);
            alert('Failed to delete slave');
        }
    };

    const testConnection = async () => {
        if (!slave) return;
        setIsTestingConnection(true);
        setConnectionMessage('');
        setConnectionStatus('idle');
        try {
            const response = await api.post('/brokers/metatrader/verify-connection', {
                ...slave.credentials,
                platform: slave.credentials.platform || 'mt5'
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
    if (!slave) return <div className="p-6">Slave not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/slaves')}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Slave Details</h1>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={slave.name}
                                onChange={(e) => setSlave({ ...slave, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Broker</label>
                            <select
                                value={BROKERS.some(b => b.id === slave.broker) ? 'metatrader' : slave.broker}
                                onChange={(e) => setSlave({ ...slave, broker: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                            >
                                <option value="binance">Binance</option>
                                <option value="metatrader">MetaTrader</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Master Account</label>
                            <select
                                value={slave.master?.id || ''}
                                onChange={(e) => setSlave({
                                    ...slave,
                                    master: masters.find(m => m.id === e.target.value)
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                required
                            >
                                <option value="">Select Master</option>
                                {masters.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Copy Mode</label>
                            <select
                                value={slave.config?.mode || 'FIXED_RATIO'}
                                onChange={(e) => setSlave({
                                    ...slave,
                                    config: { ...slave.config, mode: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                            >
                                <option value="FIXED_RATIO">Fixed Ratio</option>
                                <option value="FIXED_LOT">Fixed Lot</option>
                                <option value="BALANCE_RATIO">Balance Ratio (Auto)</option>
                                <option value="EQUITY_RATIO">Equity Ratio (Auto)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {slave.config?.mode === 'BALANCE_RATIO' && 'Automatically adjusts lot size based on balance ratio'}
                                {slave.config?.mode === 'EQUITY_RATIO' && 'Automatically adjusts lot size based on equity ratio'}
                            </p>
                        </div>

                        {(slave.config?.mode === 'FIXED_RATIO' || slave.config?.mode === 'BALANCE_RATIO' || slave.config?.mode === 'EQUITY_RATIO') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Ratio Multiplier
                                    {(slave.config?.mode === 'BALANCE_RATIO' || slave.config?.mode === 'EQUITY_RATIO') && (
                                        <span className="text-xs text-gray-500 ml-2">(Applied after auto-calculation)</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={slave.config?.ratio || 1.0}
                                    onChange={(e) => setSlave({
                                        ...slave,
                                        config: { ...slave.config, ratio: parseFloat(e.target.value) }
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                />
                            </div>
                        )}

                        {slave.config?.mode === 'FIXED_LOT' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fixed Lot Size</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={slave.config?.fixedLotSize || 0.01}
                                    onChange={(e) => setSlave({
                                        ...slave,
                                        config: { ...slave.config, fixedLotSize: parseFloat(e.target.value) }
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                />
                            </div>
                        )}
                    </div>

                    {(slave.broker === 'metatrader' || BROKERS.some(b => b.id === slave.broker)) && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-medium">MetaTrader Connection</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Broker List</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        value={BROKERS.some(b => b.id === slave.broker) ? slave.broker : ''}
                                        onChange={(e) => {
                                            const brokerId = e.target.value;
                                            const broker = BROKERS.find(b => b.id === brokerId);
                                            if (broker) {
                                                setSlave({
                                                    ...slave,
                                                    broker: brokerId,
                                                    credentials: {
                                                        ...slave.credentials,
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
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        value={slave.credentials.server || ''}
                                        onChange={(e) => setSlave({
                                            ...slave,
                                            credentials: { ...slave.credentials, server: e.target.value }
                                        })}
                                    >
                                        <option value="">Select a Server</option>
                                        {(() => {
                                            const broker = BROKERS.find(b => b.id === slave.broker);
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
                                        value={slave.credentials.bridgeIp || ''}
                                        onChange={(e) => setSlave({
                                            ...slave,
                                            credentials: { ...slave.credentials, bridgeIp: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        placeholder="127.0.0.1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bridge Port</label>
                                    <input
                                        type="number"
                                        value={slave.credentials.bridgePort || ''}
                                        onChange={(e) => setSlave({
                                            ...slave,
                                            credentials: { ...slave.credentials, bridgePort: parseInt(e.target.value) }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        placeholder="3000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Login</label>
                                    <input
                                        type="text"
                                        value={slave.credentials.login || ''}
                                        onChange={(e) => setSlave({
                                            ...slave,
                                            credentials: { ...slave.credentials, login: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        value={slave.credentials.password || ''}
                                        onChange={(e) => setSlave({
                                            ...slave,
                                            credentials: { ...slave.credentials, password: e.target.value }
                                        })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
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
                            Delete Slave
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/slaves')}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
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
                        showMaster={true}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => fetchTrades(page)}
                    />
                </ErrorBoundary>
            </div>
        </div>
    );
}
