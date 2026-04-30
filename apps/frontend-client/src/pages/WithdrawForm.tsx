import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { ArrowLeft, DollarSign, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WithdrawForm = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const method = "Carte bancaire";
  const minAmount = 50;
  const availableBalance = 12580.45;
  const fees = 1.5; // percentage

  const calculatedFees = amount ? (parseFloat(amount) * fees) / 100 : 0;
  const totalDeducted = amount ? parseFloat(amount) + calculatedFees : 0;

  const handleSubmit = () => {
    navigate("/withdraw/success");
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
        <h1 className="text-2xl font-bold">Retrait</h1>
        <p className="text-soft-text text-sm mt-1">{method}</p>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Available Balance */}
        <div className="card-portfolio bg-primary/5 border-primary/20">
          <div className="text-center">
            <p className="text-soft-text text-sm mb-1">Solde disponible</p>
            <p className="text-3xl font-bold text-primary tnum">${availableBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Amount Input */}
        <section className="space-y-4">
          <InputField
            label="Montant du retrait"
            type="number"
            placeholder={`Min. $${minAmount}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            icon={<DollarSign className="h-5 w-5" />}
          />

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="py-2 px-3 rounded-button bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all text-sm font-medium"
                disabled={quickAmount > availableBalance}
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
                <span className="font-semibold">Total déduit</span>
                <span className="font-bold text-destructive tnum text-lg">-${totalDeducted.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 pt-3 border-t border-border">
                <span className="text-soft-text">Vous recevrez</span>
                <span className="font-bold text-success tnum text-lg">${parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Warning Card */}
        <div className="card-portfolio bg-warning/5 border-warning/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-warning mb-1">Attention</h4>
              <p className="text-sm text-soft-text">
                Les retraits sont traités sous 24-48h ouvrées. Assurez-vous que vos informations bancaires sont correctes.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) < minAmount || parseFloat(amount) > availableBalance}
        >
          Confirmer le retrait
        </Button>
      </main>
    </div>
  );
};

export default WithdrawForm;
