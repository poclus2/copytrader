import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const KYCLevel2 = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({
    front: null as File | null,
    back: null as File | null,
  });

  const handleFileChange = (type: 'front' | 'back', file: File | null) => {
    setDocuments({ ...documents, [type]: file });
  };

  const handleSubmit = () => {
    navigate("/profile/kyc/level3");
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
        <h1 className="text-2xl font-bold">KYC Niveau 2</h1>
        <p className="text-soft-text text-sm mt-1">Upload de documents</p>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-soft-text">Progression</span>
            <span className="font-medium">2/3</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: "66%" }} />
          </div>
        </div>

        {/* Instructions */}
        <div className="card-portfolio bg-primary/5 border-primary/20">
          <h3 className="font-semibold text-primary mb-2">Documents requis</h3>
          <ul className="space-y-1 text-sm text-soft-text">
            <li>• Carte d'identité, passeport ou permis de conduire</li>
            <li>• Photos claires et lisibles</li>
            <li>• Format: JPG, PNG (max 5MB)</li>
          </ul>
        </div>

        {/* Document Upload - Front */}
        <section className="space-y-3">
          <label className="text-sm font-medium text-foreground">Document recto</label>
          <div className="card-trader relative">
            {documents.front ? (
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div className="flex-1">
                  <p className="font-medium">{documents.front.name}</p>
                  <p className="text-sm text-soft-text">
                    {(documents.front.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileChange('front', null)}
                >
                  Supprimer
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 py-8 cursor-pointer">
                <Upload className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-foreground mb-1">Télécharger le recto</p>
                  <p className="text-sm text-soft-text">Cliquez pour sélectionner</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </section>

        {/* Document Upload - Back */}
        <section className="space-y-3">
          <label className="text-sm font-medium text-foreground">Document verso</label>
          <div className="card-trader relative">
            {documents.back ? (
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div className="flex-1">
                  <p className="font-medium">{documents.back.name}</p>
                  <p className="text-sm text-soft-text">
                    {(documents.back.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileChange('back', null)}
                >
                  Supprimer
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 py-8 cursor-pointer">
                <Upload className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-foreground mb-1">Télécharger le verso</p>
                  <p className="text-sm text-soft-text">Cliquez pour sélectionner</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </section>

        {/* Submit Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!documents.front || !documents.back}
        >
          Continuer
        </Button>
      </main>
    </div>
  );
};

export default KYCLevel2;
