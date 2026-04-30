import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Activity,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MT5Status = () => {
  const navigate = useNavigate();

  const connectionStatus = {
    isConnected: true,
    lastSync: "Il y a 2 minutes",
    tradesCopied: 47,
    platform: "MT5",
    server: "Broker-Server",
    login: "12345678",
  };

  const handleResync = () => {
    // Handle resync logic
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-soft-text hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <h1 className="text-2xl font-bold">État de synchronisation</h1>
        <p className="text-soft-text text-sm mt-1">
          Connexion {connectionStatus.platform}
        </p>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Connection Status */}
        <section className="card-portfolio">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Statut de connexion</h3>
            <StatusBadge type={connectionStatus.isConnected ? "profit" : "loss"}>
              {connectionStatus.isConnected ? "Connecté" : "Déconnecté"}
            </StatusBadge>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Connexion active</p>
                <p className="text-sm text-soft-text">
                  Votre compte {connectionStatus.platform} est connecté et synchronisé
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Dernière synchronisation</p>
                <p className="text-sm text-soft-text">{connectionStatus.lastSync}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Trades copiés</p>
                <p className="text-sm text-soft-text">
                  {connectionStatus.tradesCopied} positions synchronisées
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Connection Details */}
        <section className="card-portfolio">
          <h3 className="font-semibold mb-4">Détails de connexion</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-soft-text text-sm">Plateforme</span>
              <span className="font-medium">{connectionStatus.platform}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-soft-text text-sm">Serveur</span>
              <span className="font-medium">{connectionStatus.server}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-soft-text text-sm">Login</span>
              <span className="font-medium">{connectionStatus.login}</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleResync}
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Resynchroniser maintenant
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => navigate("/profile")}
          >
            Déconnecter MT5
          </Button>
        </section>

        {/* Alert */}
        <div className="card-portfolio bg-warning/5 border-warning/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning mb-1">Attention</h4>
              <p className="text-sm text-soft-text">
                Si vous changez votre mot de passe investisseur MT5, vous devrez reconnecter votre compte ici.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MT5Status;
