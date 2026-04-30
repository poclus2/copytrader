import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Upload,
    CheckCircle,
    Clock,
    XCircle,
    FileText,
    CreditCard,
    Home,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface KycDocument {
    id: string;
    type: 'ID_CARD' | 'PASSPORT' | 'PROOF_OF_ADDRESS';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    fileUrl: string;
    createdAt: string;
    rejectionReason?: string;
}

interface KycStatus {
    documents: Record<string, KycDocument | null>;
    overallStatus: string;
    level: number;
}

const KycVerification = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const { data: kycStatus, isLoading } = useQuery<KycStatus>({
        queryKey: ['kyc-status'],
        queryFn: async () => {
            const { data } = await api.get('/kyc/status');
            return data;
        },
    });

    const uploadMutation = useMutation({
        mutationFn: async ({ file, type }: { file: File; type: string }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            const { data } = await api.post('/kyc/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Document envoyé avec succès !");
            setSelectedType(null);
            queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
        },
        onError: () => {
            toast.error("Erreur lors de l'envoi du document.");
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMutation.mutate({ file, type });
        }
    };

    const documentTypes = [
        {
            type: 'ID_CARD',
            label: 'Carte d\'identité',
            icon: CreditCard,
            description: 'Photo recto-verso de votre CNI',
        },
        {
            type: 'PASSPORT',
            label: 'Passeport',
            icon: FileText,
            description: 'Page principale de votre passeport',
        },
        {
            type: 'PROOF_OF_ADDRESS',
            label: 'Justificatif de domicile',
            icon: Home,
            description: 'Facture ou relevé récent (-3 mois)',
        },
    ];

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle className="h-5 w-5 text-success" />;
            case 'PENDING':
                return <Clock className="h-5 w-5 text-warning" />;
            case 'REJECTED':
                return <XCircle className="h-5 w-5 text-destructive" />;
            default:
                return <Upload className="h-5 w-5 text-soft-text" />;
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'APPROVED':
                return 'Approuvé';
            case 'PENDING':
                return 'En attente';
            case 'REJECTED':
                return 'Rejeté';
            default:
                return 'Non envoyé';
        }
    };

    if (isLoading) return <div className="p-6 text-center">Chargement...</div>;

    return (
        <div className="min-h-screen pb-24 bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
                <div className="flex items-start gap-4 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-1 p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Vérification KYC</h1>
                        <p className="text-soft-text text-sm">
                            Complétez votre vérification d'identité
                        </p>
                    </div>
                </div>

                {/* Overall Status */}
                <div className="mt-4 card-portfolio bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Niveau de vérification</p>
                            <p className="text-sm text-soft-text">
                                Niveau {kycStatus?.level || 1} - {kycStatus?.overallStatus === 'VERIFIED' ? 'Vérifié' : 'En cours'}
                            </p>
                        </div>
                        {kycStatus?.overallStatus === 'VERIFIED' ? (
                            <CheckCircle className="h-8 w-8 text-success" />
                        ) : (
                            <Clock className="h-8 w-8 text-warning" />
                        )}
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-4 animate-fade-in">
                {documentTypes.map((docType) => {
                    const doc = kycStatus?.documents[docType.type];
                    const Icon = docType.icon;

                    return (
                        <div key={docType.type} className="card-portfolio space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{docType.label}</p>
                                        <p className="text-xs text-soft-text">{docType.description}</p>
                                        {doc && (
                                            <div className="flex items-center gap-2 mt-2">
                                                {getStatusIcon(doc.status)}
                                                <span className="text-sm">{getStatusText(doc.status)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {(!doc || doc.status === 'REJECTED') && (
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => handleFileUpload(e, docType.type)}
                                            disabled={uploadMutation.isPending}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={uploadMutation.isPending}
                                            asChild
                                        >
                                            <span>
                                                <Upload className="h-4 w-4 mr-2" />
                                                {doc?.status === 'REJECTED' ? 'Renvoyer' : 'Envoyer'}
                                            </span>
                                        </Button>
                                    </label>
                                )}
                            </div>

                            {doc?.status === 'REJECTED' && doc.rejectionReason && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <p className="text-sm text-destructive">
                                        <strong>Raison du rejet :</strong> {doc.rejectionReason}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}

                {kycStatus?.overallStatus === 'VERIFIED' && (
                    <div className="card-portfolio bg-success/10 border-success/20 text-center py-8">
                        <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Compte vérifié !</h3>
                        <p className="text-sm text-soft-text">
                            Votre identité a été vérifiée avec succès.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default KycVerification;
