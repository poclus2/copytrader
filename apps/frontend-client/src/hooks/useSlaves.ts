import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface CreateSlaveDto {
    name: string;
    type: 'EXTERNAL' | 'VIRTUAL';
    broker: string;
    credentials?: any;
    masterId: string;
    userId: string;
    initialBalance?: number;
    config?: any;
}

export interface Slave {
    id: string;
    name: string;
    type: 'EXTERNAL' | 'VIRTUAL';
    status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
    master: {
        id: string;
        name: string;
        avatar?: string;
    };
    stats: {
        profit: number;
        roi: number;
    };
    tradeCount?: number;
    balance?: number;
    virtualBalance?: number;
    equity?: number;
    currency?: string;
    config: any;
    createdAt: string;
}

export function useSlaves() {
    return useQuery({
        queryKey: ['slaves'],
        queryFn: async () => {
            const { data } = await api.get<Slave[]>('/slaves');
            return data;
        },
    });
}

export function useCreateSlave() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: CreateSlaveDto) => {
            const response = await api.post('/slaves', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['slaves'] });
            toast({
                title: "Compte de copie créé",
                description: "Votre configuration a été enregistrée avec succès.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erreur",
                description: error.response?.data?.message || "Impossible de créer le compte de copie",
                variant: "destructive",
            });
        },
    });
}
export function useSlave(id: string) {
    return useQuery({
        queryKey: ['slave', id],
        queryFn: async () => {
            const { data } = await api.get<Slave>(`/slaves/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useSlaveTrades(id: string, page = 1) {
    return useQuery({
        queryKey: ['slave-trades', id, page],
        queryFn: async () => {
            // Backend returns { data: Trade[], total: number }
            const { data } = await api.get<{ data: any[], total: number }>(`/slaves/${id}/trades?page=${page}&limit=20`);
            return data;
        },
        enabled: !!id,
    });
}
export function useUpdateSlave() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Slave> }) => {
            const response = await api.patch(`/slaves/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['slaves'] });
            toast({
                title: "Mis à jour",
                description: "Les modifications ont été enregistrées.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour la copie",
                variant: "destructive",
            });
        },
    });
}

export function useDeleteSlave() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/slaves/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['slaves'] });
            toast({
                title: "Copie arrêtée",
                description: "La copie a été supprimée avec succès.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erreur",
                description: "Impossible d'arrêter la copie",
                variant: "destructive",
            });
        },
    });
}
