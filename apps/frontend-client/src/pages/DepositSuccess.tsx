import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DepositSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-fade-in text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Dépôt réussi !</h1>
          <p className="text-soft-text text-lg">
            Votre compte a été crédité avec succès
          </p>
        </div>

        <div className="card-portfolio">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-soft-text">Montant déposé</span>
              <span className="font-bold text-success tnum">+$500.00</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-soft-text">Méthode</span>
              <span className="font-medium">Carte bancaire</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-soft-text">Date</span>
              <span className="font-medium">Maintenant</span>
            </div>
          </div>
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
            onClick={() => navigate("/traders")}
          >
            Voir les traders
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DepositSuccess;
