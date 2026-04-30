import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Coins, ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WithdrawMethod = () => {
  const navigate = useNavigate();

  const paymentMethods = [
    {
      icon: CreditCard,
      label: "Carte bancaire",
      description: "Visa, Mastercard",
      action: "/withdraw/card",
    },
    {
      icon: Smartphone,
      label: "Orange Money",
      description: "Paiement mobile",
      action: "/withdraw/orange",
    },
    {
      icon: Smartphone,
      label: "MTN Money",
      description: "Paiement mobile",
      action: "/withdraw/mtn",
    },
    {
      icon: Coins,
      label: "Bitcoin (BTC)",
      description: "Crypto - Réseau Bitcoin",
      action: "/withdraw/btc",
    },
    {
      icon: Coins,
      label: "USDT (TRC20)",
      description: "Crypto - Réseau Tron",
      action: "/withdraw/usdt-trc20",
    },
    {
      icon: Coins,
      label: "USDT (BEP20)",
      description: "Crypto - Binance Smart Chain",
      action: "/withdraw/usdt-bep20",
    },
  ];

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
        <p className="text-soft-text text-sm mt-1">Choisissez votre méthode de paiement</p>
      </header>

      <main className="p-6 space-y-4 animate-fade-in">
        {paymentMethods.map((method, index) => (
          <button
            key={index}
            onClick={() => navigate(method.action)}
            className="card-trader w-full flex items-center gap-4 hover:shadow-hover transition-all hover:-translate-y-1"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <method.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">{method.label}</p>
              <p className="text-sm text-soft-text">{method.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-soft-text shrink-0" />
          </button>
        ))}
      </main>
    </div>
  );
};

export default WithdrawMethod;
