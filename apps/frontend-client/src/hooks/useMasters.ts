import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Master {
    id: string;
    name: string;
    description: string;
    avatar: string | null;
    stats: {
        roi30d: number;
        totalReturn: number;
        drawdown: number;
        subscribers: number;
        winRate: number;
        avgWin?: number;
        avgLoss?: number;
        totalTrades?: number;
    };
    monthlyFee: number;
    riskLevel: 'low' | 'medium' | 'high';
}

export function useMasters() {
    return useQuery({
        queryKey: ['masters'],
        queryFn: async () => {
            const { data } = await api.get<Master[]>('/public/masters');
            return data;
        },
    });
}

export function useMaster(id: string) {
    return useQuery({
        queryKey: ['master', id],
        queryFn: async () => {
            const { data } = await api.get<Master>(`/public/masters/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export interface Trade {
    id: string;
    ticket: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    volume: number;
    openPrice: number;
    closePrice?: number;
    profit?: number;
    openTime: string;
    closeTime?: string;
    sl: number;
    tp: number;
}

export function useMasterPerformance(id: string) {
    return useQuery({
        queryKey: ['masterPerformance', id],
        queryFn: async () => {
            const { data } = await api.get(`/public/masters/${id}/performance`);
            return data;
        },
        enabled: !!id,
    });
}

export function useMasterTrades(id: string) {
    return useQuery({
        queryKey: ['masterTrades', id],
        queryFn: async () => {
            const { data } = await api.get<{ data: Trade[], total: number }>(`/public/masters/${id}/trades`);
            return data;
        },
        enabled: !!id,
    });
}
