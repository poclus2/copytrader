import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { ArrowLeft, User, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const KYCLevel1 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const handleSubmit = () => {
    navigate("/profile/kyc/level2");
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
        <h1 className="text-2xl font-bold">KYC Niveau 1</h1>
        <p className="text-soft-text text-sm mt-1">Informations personnelles</p>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-soft-text">Progression</span>
            <span className="font-medium">1/3</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: "33%" }} />
          </div>
        </div>

        {/* Form */}
        <section className="space-y-4">
          <InputField
            label="Prénom"
            placeholder="Votre prénom"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            icon={<User className="h-5 w-5" />}
          />

          <InputField
            label="Nom"
            placeholder="Votre nom"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            icon={<User className="h-5 w-5" />}
          />

          <InputField
            label="Date de naissance"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            icon={<Calendar className="h-5 w-5" />}
          />

          <InputField
            label="Nationalité"
            placeholder="ex: Française"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            icon={<MapPin className="h-5 w-5" />}
          />

          <InputField
            label="Adresse"
            placeholder="Numéro et rue"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            icon={<MapPin className="h-5 w-5" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Ville"
              placeholder="Ville"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />

            <InputField
              label="Code postal"
              placeholder="Code postal"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
          </div>
        </section>

        {/* Submit Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!formData.firstName || !formData.lastName || !formData.dateOfBirth}
        >
          Continuer
        </Button>
      </main>
    </div>
  );
};

export default KYCLevel1;
