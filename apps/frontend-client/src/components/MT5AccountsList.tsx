import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Server, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface MT5Account {
    id: string;
    login: string;
    server: string;
    brokerName: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    accountName?: string;
    balance?: number;
    currency?: string;
    lastConnectedAt?: string;
    errorMessage?: string;
}

export const MT5AccountsList = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery<{ accounts: MT5Account[] }>({
        queryKey: ['mt5-accounts'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/brokers/metatrader/accounts');
                return data;
            } catch (error) {
                console.error("Failed to fetch MT5 accounts:", error);
                return { accounts: [] }; // Return empty list on error
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (accountId: string) => {
            await api.delete(`/brokers/metatrader/accounts/${accountId}`);
        },
        onSuccess: () => {
            toast.success("Compte supprimé avec succès");
            queryClient.invalidateQueries({ queryKey: ['mt5-accounts'] });
        },
        onError: () => {
            toast.error("Erreur lors de la suppression du compte");
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONNECTED':
                return <StatusBadge type="profit">Connecté</StatusBadge>;
            case 'DISCONNECTED':
                return <StatusBadge type="neutral">Déconnecté</StatusBadge>;
            case 'ERROR':
                return <StatusBadge type="loss">Erreur</StatusBadge>;
            default:
                return <StatusBadge type="neutral">{status}</StatusBadge>;
        }
    };

    console.log("MT5AccountsList Render:", { isLoading, isError, data });

    if (isLoading) {
        return (
            <div className="card-portfolio text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto text-muted animate-spin mb-2" />
                <p className="text-soft-text text-sm">Chargement...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="card-portfolio text-center py-8 border-destructive/20 bg-destructive/5">
                <Server className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive font-medium">Erreur de chargement</p>
                <p className="text-xs text-destructive/80 mt-2">Impossible de récupérer vos comptes.</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-destructive/20 hover:bg-destructive/10 text-destructive"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['mt5-accounts'] })}
                >
                    Réessayer
                </Button>
            </div>
        );
    }

    // Defensive check: Ensure accounts is an array
    const accounts = (data && Array.isArray(data.accounts)) ? data.accounts : [];

    if (accounts.length === 0) {
        return (
            <div className="card-portfolio text-center py-8 border-dashed">
                <Server className="h-12 w-12 mx-auto text-muted mb-4" />
                <p className="text-soft-text">Aucun compte MT5 connecté</p>
                <p className="text-xs text-soft-text mt-2">Ajoutez un compte pour commencer</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {accounts.map((account) => (
                <div key={account.id} className="card-portfolio">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Server className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold truncate">
                                        {account.accountName || `Compte ${account.login}`}
                                    </p>
                                    {getStatusBadge(account.status)}
                                </div>
                                <p className="text-sm text-soft-text">
                                    {account.brokerName} • {account.server}
                                </p>
                                <p className="text-xs text-soft-text">Login: {account.login}</p>
                                {account.balance != null && (
                                    <p className="text-sm font-medium mt-1">
                                        {Number(account.balance).toFixed(2)} {account.currency || 'USD'}
                                    </p>
                                )}
                                {account.errorMessage && (
                                    <p className="text-xs text-destructive mt-1">{account.errorMessage}</p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(account.id)}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};
