import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { Master, Slave } from '../api';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        masters: 0,
        slaves: 0,
        activeSlaves: 0,
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [mastersRes, slavesRes] = await Promise.all([
                api.get<Master[]>('/masters'),
                api.get<Slave[]>('/slaves'),
            ]);

            setStats({
                masters: mastersRes.data.length,
                slaves: slavesRes.data.length,
                activeSlaves: slavesRes.data.filter(s => s.isActive).length,
            });
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Masters</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.masters}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Slaves</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.slaves}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Active Slaves</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeSlaves}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
