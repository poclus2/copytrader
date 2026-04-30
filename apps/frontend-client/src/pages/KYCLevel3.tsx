import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, CheckCircle2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const KYCLevel3 = () => {
  const navigate = useNavigate();
  const [selfie, setSelfie] = useState<File | null>(null);

  const handleFileChange = (file: File | null) => {
    setSelfie(file);
  };

  const handleSubmit = () => {
    navigate("/profile/kyc/success");
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
        <h1 className="text-2xl font-bold">KYC Niveau 3</h1>
        <p className="text-soft-text text-sm mt-1">Selfie de validation</p>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-soft-text">Progression</span>
            <span className="font-medium">3/3</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Instructions */}
        <div className="card-portfolio bg-primary/5 border-primary/20">
          <h3 className="font-semibold text-primary mb-2">Instructions</h3>
          <ul className="space-y-1 text-sm text-soft-text">
            <li>• Prenez un selfie clair de votre visage</li>
            <li>• Assurez-vous que votre visage est bien visible</li>
            <li>• Pas de lunettes de soleil ou chapeau</li>
            <li>• Bon éclairage recommandé</li>
          </ul>
        </div>

        {/* Selfie Upload */}
        <section className="space-y-3">
          <label className="text-sm font-medium text-foreground">Photo selfie</label>
          <div className="card-trader relative">
            {selfie ? (
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div className="flex-1">
                  <p className="font-medium">{selfie.name}</p>
                  <p className="text-sm text-soft-text">
                    {(selfie.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileChange(null)}
                >
                  Supprimer
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 py-12 cursor-pointer">
                <Camera className="h-16 w-16 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-foreground mb-1">Prendre un selfie</p>
                  <p className="text-sm text-soft-text">Cliquez pour utiliser votre caméra</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </section>

        {/* Warning */}
        <div className="card-portfolio bg-warning/5 border-warning/20">
          <h3 className="font-semibold text-warning mb-2">Validation finale</h3>
          <p className="text-sm text-soft-text">
            Votre demande sera examinée sous 24-48h. Vous recevrez une notification 
            une fois votre compte vérifié.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!selfie}
        >
          Soumettre la demande
        </Button>
      </main>
    </div>
  );
};

export default KYCLevel3;
