import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { ArrowLeft, DollarSign, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DepositForm = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const method = "Carte bancaire";
  const minAmount = 50;
  const maxAmount = 10000;
  const fees = 2.5; // percentage

  const calculatedFees = amount ? (parseFloat(amount) * fees) / 100 : 0;
  const totalAmount = amount ? parseFloat(amount) + calculatedFees : 0;

  const handleSubmit = () => {
    navigate("/deposit/success");
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
        <h1 className="text-2xl font-bold">Dépôt</h1>
        <p className="text-soft-text text-sm mt-1">{method}</p>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Amount Input */}
        <section className="space-y-4">
          <InputField
            label="Montant du dépôt"
            type="number"
            placeholder={`Min. $${minAmount} - Max. $${maxAmount}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            icon={<DollarSign className="h-5 w-5" />}
          />

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 250, 500, 1000].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="py-2 px-3 rounded-button bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all text-sm font-medium"
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </section>

        {/* Fee Details */}
        {amount && (
          <section className="card-portfolio space-y-3">
            <h3 className="font-semibold mb-2">Détails des frais</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-soft-text">Montant</span>
                <span className="font-medium tnum">${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-soft-text">Frais ({fees}%)</span>
                <span className="font-medium tnum">${calculatedFees.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary tnum text-lg">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Info Card */}
        <div className="card-portfolio bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-primary mb-1">Information</h4>
              <p className="text-sm text-soft-text">
                Votre dépôt sera crédité instantanément après validation du paiement. 
                Les frais sont automatiquement inclus dans le montant total.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) < minAmount || parseFloat(amount) > maxAmount}
        >
          Valider le dépôt
        </Button>
      </main>
    </div>
  );
};

export default DepositForm;
