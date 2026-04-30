import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Subscription {
    id: string;
    userId: string;
    masterId: string;
    status: 'active' | 'paused' | 'cancelled' | 'expired';
    monthlyFee: number;
    copySettings: {
        mt5AccountId: string;
        mode: 'FIXED_RATIO' | 'BALANCE_RATIO' | 'EQUITY_RATIO' | 'FIXED_LOT';
        ratio?: number;
        fixedLotSize?: number;
        maxDailyLoss?: number;
        maxOpenTrades?: number;
    };
    startDate: string;
    nextBillingDate: string;
    endDate?: string;
    createdAt: string;
    master?: any;
}

export function useMySubscriptions() {
    return useQuery({
        queryKey: ['my-subscriptions'],
        queryFn: async () => {
            const { data } = await api.get<Subscription[]>('/subscriptions');
            return data;
        },
    });
}

export function useSubscription(id: string) {
    return useQuery({
        queryKey: ['subscription', id],
        queryFn: async () => {
            const { data } = await api.get<Subscription>(`/subscriptions/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateSubscription() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (subscriptionData: {
            masterId: string;
            copySettings: any;
        }) => {
            const { data } = await api.post('/subscriptions', subscriptionData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
            toast({
                title: "Abonnement créé",
                description: "Vous êtes maintenant abonné à ce trader!",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erreur",
                description: error.response?.data?.message || "Impossible de créer l'abonnement",
                variant: "destructive",
            });
        },
    });
}

export function usePauseSubscription() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.put(`/subscriptions/${id}/pause`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
            toast({
                title: "Abonnement mis en pause",
            });
        },
    });
}

export function useResumeSubscription() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.put(`/subscriptions/${id}/resume`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
            toast({
                title: "Abonnement repris",
            });
        },
    });
}

export function useCancelSubscription() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/subscriptions/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
            toast({
                title: "Abonnement annulé",
                description: "Votre abonnement a été annulé avec succès",
            });
        },
    });
}
