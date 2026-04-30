import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MT5Account {
    id: string;
    login: string;
    server: string;
    brokerName: string;
    balance: number;
    equity: number;
    currency: string;
    leverage: number;
    name: string;
    status: 'connected' | 'disconnected' | 'error';
}

export const useMT5Accounts = () => {
    return useQuery({
        queryKey: ['mt5-accounts'],
        queryFn: async () => {
            const { data } = await api.get<{ accounts: MT5Account[] }>('/brokers/metatrader/accounts');
            return data.accounts;
        },
    });
};
