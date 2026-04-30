import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TrendingUp,
  Bot,
  BarChart3,
  Target,
  Shield,
  Brain,
  Settings,
  Activity,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const BotProfile = () => {
  const navigate = useNavigate();

  const bot = {
    name: "Alpha Scalper Pro",
    strategy: "Scalping AI",
    description: "Bot de scalping haute fréquence utilisant l'intelligence artificielle pour détecter les micro-opportunités de trading.",
    roi: 52.8,
    maxDrawdown: 8.5,
    winRate: 71.2,
    activeUsers: 342,
    totalTrades: 1245,
    avgProfit: 3.2,
    riskScore: 5.5,
    riskLevel: "Moyen",
  };

  const strategyDetails = [
    { label: "Type d'analyse", value: "Analyse technique avancée + ML" },
    { label: "Timeframe", value: "M1, M5, M15" },
    { label: "Paires recommandées", value: "EUR/USD, GBP/USD, USD/JPY" },
    { label: "Capital minimum", value: "$500" },
  ];

  const aiFeatures = [
    { label: "Modèle ML", value: "Réseau neuronal LSTM" },
    { label: "Fréquence apprentissage", value: "Quotidienne" },
    { label: "Détection patterns", value: "120+ configurations" },
    { label: "Rééquilibrage auto", value: "Activé" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <div className="p-6 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-soft-text hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Retour</span>
          </button>

          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{bot.name}</h1>
                <StatusBadge type="profit">IA Actif</StatusBadge>
              </div>
              <p className="text-soft-text mb-3">{bot.strategy}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-soft-text">
                  <Activity className="h-4 w-4" />
                  <span className="tnum">{bot.activeUsers} utilisateurs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-3 p-6 pt-0">
          <div className="card-trader text-center flex flex-col justify-center">
            <p className="caption mb-1">ROI 30j</p>
            <p className="text-xl font-bold tnum text-success">+{bot.roi}%</p>
          </div>
          <div className="card-trader text-center flex flex-col justify-center">
            <p className="caption mb-1">Win Rate</p>
            <p className="text-xl font-bold tnum">{bot.winRate}%</p>
          </div>
          <div className="card-trader text-center flex flex-col justify-center">
            <p className="caption mb-1">Max DD</p>
            <p className="text-xl font-bold tnum text-destructive">{bot.maxDrawdown}%</p>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {/* Description */}
        <section className="card-portfolio">
          <h3 className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-primary" />
            Description
          </h3>
          <p className="text-soft-text leading-relaxed">{bot.description}</p>
        </section>

        {/* Performance Chart */}
        <section className="card-portfolio">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance IA
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded-full bg-primary text-primary-foreground">
                30J
              </button>
              <button className="px-3 py-1 text-xs rounded-full bg-muted text-soft-text">
                90J
              </button>
              <button className="px-3 py-1 text-xs rounded-full bg-muted text-soft-text">
                1A
              </button>
            </div>
          </div>
          <div className="h-56 bg-gradient-chart rounded-lg flex items-center justify-center border border-border">
            <BarChart3 className="h-12 w-12 text-soft-text opacity-50" />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="card-trader">
            <Target className="h-5 w-5 text-primary mb-2" />
            <p className="caption mb-1">Trades Total</p>
            <p className="text-2xl font-bold tnum">{bot.totalTrades}</p>
          </div>
          <div className="card-trader">
            <TrendingUp className="h-5 w-5 text-success mb-2" />
            <p className="caption mb-1">Profit Moyen</p>
            <p className="text-2xl font-bold tnum text-success">+{bot.avgProfit}%</p>
          </div>
          <div className="card-trader">
            <Shield className="h-5 w-5 text-warning mb-2" />
            <p className="caption mb-1">Score Risque</p>
            <p className="text-2xl font-bold tnum">{bot.riskScore}/10</p>
          </div>
          <div className="card-trader">
            <Activity className="h-5 w-5 text-primary mb-2" />
            <p className="caption mb-1">Utilisateurs</p>
            <p className="text-2xl font-bold tnum">{bot.activeUsers}</p>
          </div>
        </section>

        {/* Strategy Details */}
        <section className="card-portfolio">
          <h3 className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            Stratégie IA Détaillée
          </h3>
          <div className="space-y-3">
            {strategyDetails.map((detail, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-soft-text text-sm">{detail.label}</span>
                <span className="font-medium text-foreground">{detail.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* AI Features */}
        <section className="card-portfolio">
          <h3 className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            Paramètres Internes du Bot
          </h3>
          <div className="space-y-3">
            {aiFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-soft-text text-sm">{feature.label}</span>
                <span className="font-medium text-foreground">{feature.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Risk Assessment */}
        <section className="card-portfolio">
          <h3 className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-warning" />
            Risque Estimé
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-soft-text">Niveau de risque</span>
              <StatusBadge type="risk">{bot.riskLevel}</StatusBadge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-soft-text">Score de risque</span>
                <span className="font-medium">{bot.riskScore}/10</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning transition-all"
                  style={{ width: `${(bot.riskScore / 10) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-soft-text">
              Ce bot utilise des stops loss automatiques et un système de gestion des risques avancé basé sur le machine learning.
            </p>
          </div>
        </section>

        {/* AI Processing */}
        <section className="card-portfolio">
          <h3 className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            Traitements IA
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-medium text-sm">Prédiction en cours</span>
              </div>
              <p className="text-xs text-soft-text">Analyse des patterns de marché...</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="font-medium text-sm">Rééquilibrage automatique</span>
              </div>
              <p className="text-xs text-soft-text">Optimisation des positions toutes les 4h</p>
            </div>
          </div>
        </section>
      </main>

      {/* Fixed CTA Button */}
      <div className="fixed bottom-6 left-6 right-6 z-20">
        <Button 
          size="lg" 
          className="w-full shadow-hover"
          onClick={() => navigate("/copy-config")}
        >
          Activer ce bot IA
        </Button>
      </div>
    </div>
  );
};

export default BotProfile;
