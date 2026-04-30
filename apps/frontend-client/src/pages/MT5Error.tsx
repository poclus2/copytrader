import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MT5Error = () => {
  const navigate = useNavigate();

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
        <h1 className="text-2xl font-bold">Erreur de connexion</h1>
      </header>

      <main className="p-6 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>

        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl font-bold">Connexion échouée</h2>
          <p className="text-soft-text max-w-md">
            Impossible de se connecter à votre compte MT5. Veuillez vérifier vos identifiants et réessayer.
          </p>
        </div>

        <div className="card-portfolio w-full max-w-md bg-destructive/5 border-destructive/20">
          <h3 className="font-semibold mb-3 text-destructive">Raisons possibles</h3>
          <ul className="space-y-2 text-sm text-soft-text">
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Identifiant ou mot de passe incorrect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Nom de serveur invalide</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Mot de passe investisseur non activé</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              <span>Serveur MT5 temporairement indisponible</span>
            </li>
          </ul>
        </div>

        <div className="w-full max-w-md space-y-3 mt-8">
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/mt5/connect")}
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Réessayer
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/profile")}
          >
            Retour au profil
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MT5Error;
