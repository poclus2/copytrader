import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Transaction {
    id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_PROFIT' | 'TRADE_LOSS' | 'SUBSCRIPTION_FEE';
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
    method?: string;
    accountId?: string;
    metadata?: any;
}

export interface WalletBalance {
    id: string;
    balance: number;
    currency: string;
    updatedAt: string;
}

export const useWallet = () => {
    return useQuery({
        queryKey: ["wallet-balance"],
        queryFn: async () => {
            const { data } = await api.get<WalletBalance>("/wallet/balance");
            return data;
        },
    });
};

export const useTransactions = () => {
    return useQuery({
        queryKey: ["transactions"],
        queryFn: async () => {
            const { data } = await api.get<Transaction[]>("/wallet/transactions");
            return data;
        },
    });
};

export const useDeposit = () => {
    return useMutation({
        mutationFn: async (data: { amount: number; method: string }) => {
            const response = await api.post("/wallet/deposit", data);
            return response.data;
        },
    });
};
