import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, Play, Pause, XCircle } from 'lucide-react';

interface Slave {
    id: string;
    name: string;
    type: 'EXTERNAL' | 'VIRTUAL';
    status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'STOPPED';
    broker: string;
    balance: number;
    virtualBalance: number;
    master: {
        name: string;
        id: string;
    };
    createdAt: string;
}

interface UserDetail {
    id: string;
    username: string;
    email: string;
    role: string;
    walletBalance: string;
    slaves: Slave[];
}

const UserDetail = () => {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            const { data } = await api.get<UserDetail>(`/users/${id}`);
            return data;
        },
    });

    const activateMutation = useMutation({
        mutationFn: async (slaveId: string) => {
            await api.patch(`/slaves/${slaveId}/validate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            alert("Copie activée avec succès !");
        },
        onError: () => alert("Erreur lors de l'activation")
    });

    if (isLoading) return <div>Chargement...</div>;
    if (!user) return <div>Utilisateur introuvable</div>;

    return (
        <div className="space-y-6">
            <Link to="/users" className="flex items-center text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour aux utilisateurs
            </Link>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
                        <p className="text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Solde Portefeuille</p>
                        <p className="text-2xl font-bold text-blue-600">{Number(user.walletBalance).toFixed(2)}$</p>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold mt-8">Copies de Trading ({user.slaves?.length || 0})</h2>

            <div className="grid gap-4">
                {user.slaves?.map(slave => (
                    <div key={slave.id} className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-lg">{slave.master?.name || 'Inconnu'}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                                    ${slave.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        slave.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {slave.status}
                                </span>
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{slave.type}</span>
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p>Broker: <span className="font-medium text-gray-900">{slave.broker}</span></p>
                                <p>Solde Copie: <span className="font-medium text-gray-900">
                                    {slave.type === 'VIRTUAL' ? slave.virtualBalance : slave.balance}$
                                </span></p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {slave.status === 'PENDING' && (
                                <button
                                    onClick={() => activateMutation.mutate(slave.id)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Check className="h-4 w-4" />
                                    VALIDER L'ACTIVATION
                                </button>
                            )}
                            {slave.status === 'PENDING' && (
                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded border border-yellow-200 text-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                    En attente de validation manuelle
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {(!user.slaves || user.slaves.length === 0) && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        Aucune copie active pour cet utilisateur.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDetail;
