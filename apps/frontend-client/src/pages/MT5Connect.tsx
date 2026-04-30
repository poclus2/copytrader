import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { ArrowLeft, CheckCircle, AlertCircle, Server, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

interface BrokerServer {
  name: string;
  address: string;
  type: 'demo' | 'live';
}

interface Broker {
  id: string;
  name: string;
  servers: BrokerServer[];
}

const MT5Connect = () => {
  const navigate = useNavigate();
  const [selectedBroker, setSelectedBroker] = useState("");
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    server: "",
    platform: "mt5" as const,
  });

  const { data: brokersData } = useQuery({
    queryKey: ["brokers"],
    queryFn: async () => {
      const { data } = await api.get<{ brokers: Broker[] }>("/brokers/metatrader/list");
      return data;
    },
  });

  // Get available servers for selected broker
  const availableServers = useMemo(() => {
    if (!selectedBroker || !brokersData?.brokers) return [];
    const broker = brokersData.brokers.find(b => b.id === selectedBroker);
    return broker?.servers || [];
  }, [selectedBroker, brokersData]);

  const connectMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post("/brokers/metatrader/verify-connection", data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Connexion réussie !");
        // Redirect after a short delay
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      }
    },
    onError: (error: any) => {
      // Error is already shown via the UI
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    connectMutation.mutate(formData);
  };

  const handleBrokerChange = (brokerId: string) => {
    setSelectedBroker(brokerId);
    // Reset server selection when broker changes
    setFormData({ ...formData, server: "" });
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-soft-text hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Connexion MT5</h1>
        </div>
        <p className="text-soft-text text-sm">Connectez votre compte de trading MetaTrader 5</p>
      </header>

      <main className="p-6 max-w-md mx-auto animate-fade-in">
        <div className="card-portfolio space-y-6">
          <div className="text-center mb-6">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Server className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Identifiants du Compte</h2>
            <p className="text-sm text-soft-text">Entrez vos informations de connexion MT5</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Broker Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Broker</label>
              <select
                className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                value={selectedBroker}
                onChange={(e) => handleBrokerChange(e.target.value)}
                required
              >
                <option value="">Sélectionner un broker</option>
                {brokersData?.brokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Server Selection (only shown after broker is selected) */}
            {selectedBroker && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Serveur</label>
                <select
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={availableServers.some(s => s.name === formData.server) ? formData.server : (formData.server ? 'manual' : '')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'manual') {
                      setFormData({ ...formData, server: '' });
                    } else {
                      setFormData({ ...formData, server: value });
                    }
                  }}
                  required={!formData.server}
                >
                  <option value="">Sélectionner un serveur</option>
                  {availableServers.map((server) => (
                    <option key={server.name} value={server.name}>
                      {server.name} ({server.type === 'demo' ? 'Démo' : 'Réel'})
                    </option>
                  ))}
                  <option value="manual">Entrer manuellement...</option>
                </select>

                {(!formData.server || !availableServers.some(s => s.name === formData.server)) && (
                  <InputField
                    label=""
                    value={formData.server}
                    onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                    placeholder="Entrez le nom du serveur (ex: MetaQuotes-Demo)"
                    required
                  />
                )}
                <p className="text-xs text-soft-text">Sélectionnez un serveur ou entrez son nom manuellement.</p>
              </div>
            )}

            <InputField
              label="Login (Numéro de compte)"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              placeholder="ex: 12345678"
              icon={<User className="h-4 w-4" />}
              required
            />

            <InputField
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              required
            />

            {connectMutation.isError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Échec de la connexion. Vérifiez vos identifiants.</span>
              </div>
            )}

            {connectMutation.isSuccess && !connectMutation.data?.success && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{connectMutation.data?.error || 'Échec de la connexion'}</span>
              </div>
            )}

            {connectMutation.isSuccess && connectMutation.data?.success && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Connexion réussie ! Redirection...</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={connectMutation.isPending || (connectMutation.isSuccess && connectMutation.data?.success)}
            >
              {connectMutation.isPending ? "Connexion en cours..." : "Connecter le Compte"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default MT5Connect;
