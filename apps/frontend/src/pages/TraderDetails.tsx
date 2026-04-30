import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Master } from '../api';
import { ArrowLeft, Save, Briefcase, User, Bot, Layout, DollarSign, ShieldAlert, Image, FileText } from 'lucide-react';

export default function TraderDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [master, setMaster] = useState<Master | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchMaster();
    }, [id]);

    const fetchMaster = async () => {
        try {
            const response = await api.get<Master>(`/masters/${id}`);
            setMaster(response.data);
        } catch (error) {
            console.error('Failed to fetch master:', error);
            alert('Failed to load trader details');
            navigate('/traders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!master) return;
        setIsSaving(true);
        try {
            await api.patch(`/masters/${id}`, master);
            // Show a simpler notification or use a toast if available
            alert('Trader profile updated successfully');
        } catch (error: any) {
            console.error('Failed to update trader:', error);
            alert(`Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    if (!master) return <div className="p-8 text-center text-red-500">Trader not found</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/traders')}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Trader Profile</h1>
                        <p className="text-gray-500 mt-1">Manage public facing information for {master.name}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50/50 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-indigo-600" />
                            General Information
                        </h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4" />
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={master.name}
                                    onChange={(e) => setMaster({ ...master, name: e.target.value })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">The name displayed to users on the marketplace.</p>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Bot className="w-4 h-4" />
                                    Trader Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMaster({ ...master, type: 'HUMAN' })}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${master.type === 'HUMAN' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <User size={18} />
                                        Human
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMaster({ ...master, type: 'BOT' })}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${master.type === 'BOT' ? 'bg-purple-50 border-purple-200 text-purple-700 ring-1 ring-purple-200' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Bot size={18} />
                                        Bot
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Image className="w-4 h-4" />
                                    Avatar URL
                                </label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={master.avatar || ''}
                                            onChange={(e) => setMaster({ ...master, avatar: e.target.value })}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                        {master.avatar ? (
                                            <img src={master.avatar} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Description (Bio)
                                </label>
                                <textarea
                                    value={master.description || ''}
                                    onChange={(e) => setMaster({ ...master, description: e.target.value })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                    rows={4}
                                    placeholder="Describe the trading experience, history, and goals..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strategy Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="border-b border-gray-200 bg-gray-50/50 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                            Strategy & Pricing
                        </h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                Strategy Name
                            </label>
                            <input
                                type="text"
                                value={master.strategy || ''}
                                onChange={(e) => setMaster({ ...master, strategy: e.target.value })}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                placeholder="e.g. Scalping EURUSD"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Monthly Fee ($)
                            </label>
                            <input
                                type="number"
                                value={master.monthlyFee || 0}
                                onChange={(e) => setMaster({ ...master, monthlyFee: parseFloat(e.target.value) })}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <ShieldAlert className="w-4 h-4" />
                                Risk Score (1-10)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={master.riskScore || 5}
                                    onChange={(e) => setMaster({ ...master, riskScore: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="font-bold text-lg text-indigo-600 w-8 text-center">{master.riskScore || 5}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                        <Briefcase size={18} />
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Technical Configuration</p>
                        <p>
                            To configure the Broker, Server, and MT4/MT5 connection details (IP, Port), please use the <span className="font-mono bg-blue-100 px-1 rounded">Masters</span> page.
                            The changes made here strictly affect the public profile of the trader.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/traders')}
                        className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium shadow-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}
