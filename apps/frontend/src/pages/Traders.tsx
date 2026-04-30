import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { Master, CreateMasterDto } from '../api';
import { Plus, Trash2, User, Bot, TrendingUp } from 'lucide-react';

export default function Traders() {
    const navigate = useNavigate();
    const [masters, setMasters] = useState<Master[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Simplified creation for Traders page - minimal technical requirements
    const [newTrader, setNewTrader] = useState<CreateMasterDto>({
        name: '',
        broker: 'binance', // Defaulting to Binance for simplicity in UI, can be changed later in technical view
        credentials: {},
        type: 'HUMAN',
        description: '',
        monthlyFee: 0,
        riskScore: 5
    });

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // For a "Trader", we create a Master with minimal technical config initially
            // The technical connection can be configured later in the "Masters" view if needed
            await api.post('/masters', newTrader);
            setIsCreating(false);
            setNewTrader({
                name: '',
                broker: 'binance',
                credentials: {},
                type: 'HUMAN',
                description: '',
                monthlyFee: 0,
                riskScore: 5
            });
            fetchMasters();
        } catch (error: any) {
            console.error('Failed to create trader:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create trader';
            alert(`Error: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure? This will delete the Master and all associated data.')) return;
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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Traders Management</h1>
                    <p className="text-gray-500">Manage public profiles for Human Traders and Bots</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    New Trader Profile
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-xl font-semibold mb-4">New Trader Profile</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                <input
                                    type="text"
                                    value={newTrader.name}
                                    onChange={(e) => setNewTrader({ ...newTrader, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                    required
                                    placeholder="e.g. Alpha Strategy"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    value={newTrader.type || 'HUMAN'}
                                    onChange={(e) => setNewTrader({ ...newTrader, type: e.target.value as 'HUMAN' | 'BOT' })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                >
                                    <option value="HUMAN">Human Trader</option>
                                    <option value="BOT">Trading Bot</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
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
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {masters.map((master) => (
                    <div
                        key={master.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                        onClick={() => navigate(`/traders/${master.id}`)}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${master.type === 'BOT' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {master.type === 'BOT' ? <Bot size={24} /> : <User size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{master.name}</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {master.type || 'HUMAN'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(master.id, e)}
                                    className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                                    {master.description || <em>No description provided.</em>}
                                </p>

                                <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-xs">Strategy</span>
                                        <span className="font-medium">{master.strategy || '-'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-gray-500 text-xs">Pricing</span>
                                        <span className="font-medium font-mono">${master.monthlyFee}/mo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                <TrendingUp size={14} />
                                Risk Score: {master.riskScore}/10
                            </div>
                            <span className="text-indigo-600 text-sm font-medium hover:underline">Edit Profile →</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
