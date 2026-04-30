import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Copy, Users, DollarSign, TrendingUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ReferralStats {
  code: string | null;
  usageCount: number;
  totalEarnings: number;
  recentReferrals: Array<{
    id: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }>;
}

const Affiliation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery<ReferralStats>({
    queryKey: ['affiliation-stats'],
    queryFn: async () => {
      const response = await api.get('/affiliation/stats');
      return response.data;
    }
  });

  const { mutate: generateCode, isPending: isGenerating } = useMutation({
    mutationFn: async () => {
      await api.post('/affiliation/generate-code');
    },
    onSuccess: () => {
      toast.success("Code de parrainage généré !");
      queryClient.invalidateQueries({ queryKey: ['affiliation-stats'] });
    },
    onError: () => {
      toast.error("Erreur lors de la génération du code.");
    }
  });

  const copyToClipboard = () => {
    if (stats?.code) {
      const link = `${window.location.origin}/register?ref=${stats.code}`;
      navigator.clipboard.writeText(link);
      toast.success("Lien copié !");
    }
  };

  if (isLoading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-24">
      <header className="mb-8 flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold mb-2">Programme d'Affiliation</h1>
          <p className="text-soft-text">Invitez des amis et gagnez des commissions sur leurs trades.</p>
        </div>
      </header>

      {!stats?.code ? (
        <div className="card-portfolio text-center py-12">
          <Users className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Commencez à parrainer</h2>
          <p className="text-soft-text mb-6">Générez votre code unique pour commencer à inviter des traders.</p>
          <Button onClick={() => generateCode()} disabled={isGenerating}>
            {isGenerating ? "Génération..." : "Générer mon code"}
          </Button>
        </div>
      ) : (
        <>
          <section className="card-portfolio space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              Votre Lien de Parrainage
            </h3>
            <div className="flex gap-2">
              <InputField
                value={`${window.location.origin}/register?ref=${stats.code}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <div className="card-portfolio p-4">
              <div className="flex items-center gap-2 mb-2 text-soft-text">
                <Users className="h-4 w-4" />
                <span className="text-sm">Parrainages</span>
              </div>
              <p className="text-2xl font-bold">{stats.usageCount}</p>
            </div>
            <div className="card-portfolio p-4">
              <div className="flex items-center gap-2 mb-2 text-soft-text">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Gains</span>
              </div>
              <p className="text-2xl font-bold text-success">+${stats.totalEarnings}</p>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Derniers Inscrits
            </h3>
            {stats.recentReferrals.length > 0 ? (
              <div className="card-portfolio divide-y divide-border">
                {stats.recentReferrals.map((ref) => (
                  <div key={ref.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium">{ref.firstName} {ref.lastName}</p>
                      <p className="text-xs text-soft-text">Inscrit le {new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Actif</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-soft-text bg-card/50 rounded-lg border border-dashed border-border">
                Aucun parrainage pour le moment.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Affiliation;
