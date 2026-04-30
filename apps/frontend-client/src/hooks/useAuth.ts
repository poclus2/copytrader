import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function useLogin() {
    const navigate = useNavigate();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (credentials: { email: string; password: string }) => {
            const { data } = await api.post('/auth/login', credentials);
            return data;
        },
        onSuccess: (data) => {
            localStorage.setItem('authToken', data.accessToken);
            toast({
                title: "Connexion réussie",
                description: `Bienvenue ${data.user.firstName}!`,
            });
            navigate('/dashboard');
        },
        onError: (error: any) => {
            toast({
                title: "Erreur de connexion",
                description: error.response?.data?.message || "Email ou mot de passe incorrect",
                variant: "destructive",
            });
        },
    });
}

export function useRegister() {
    const navigate = useNavigate();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (userData: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
        }) => {
            const { data } = await api.post('/auth/register', userData);
            return data;
        },
        onSuccess: (data) => {
            localStorage.setItem('authToken', data.accessToken);
            toast({
                title: "Inscription réussie",
                description: "Votre compte a été créé avec succès!",
            });
            navigate('/dashboard');
        },
        onError: (error: any) => {
            toast({
                title: "Erreur d'inscription",
                description: error.response?.data?.message || "Une erreur est survenue",
                variant: "destructive",
            });
        },
    });
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const { data } = await api.get('/auth/me');
            return data;
        },
        enabled: !!localStorage.getItem('authToken'),
        retry: false,
    });
}

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return () => {
        localStorage.removeItem('authToken');
        queryClient.clear();
        toast({
            title: "Déconnexion",
            description: "À bientôt!",
        });
        navigate('/auth');
    };
}
