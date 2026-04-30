import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WithdrawSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Retrait en cours !</h1>
          <p className="text-soft-text text-lg">
            Votre demande de retrait a été enregistrée
          </p>
        </div>

        <div className="card-portfolio">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-soft-text">Montant</span>
              <span className="font-bold text-foreground tnum">$500.00</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-soft-text">Frais</span>
              <span className="font-medium tnum">$7.50</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-soft-text">Méthode</span>
              <span className="font-medium">Carte bancaire</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-soft-text">Statut</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="font-medium text-warning">En attente</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-portfolio bg-primary/5 border-primary/20 text-left">
          <h3 className="font-semibold text-primary mb-2">Prochaines étapes</h3>
          <p className="text-sm text-soft-text">
            Votre retrait sera traité dans les 24-48h ouvrées. Vous recevrez une notification 
            lorsque le virement sera effectué sur votre compte.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/dashboard")}
          >
            Retour au tableau de bord
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/dashboard")}
          >
            Voir l'historique
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawSuccess;
