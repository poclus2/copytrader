import { useState } from "react";
import { TraderCard } from "@/components/trader-card";
import { BotCard } from "@/components/bot-card";
import { ActiveCopyCard } from "@/components/active-copy-card";
import { InputField } from "@/components/ui/input-field";
import { Search, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useMasters } from "@/hooks/useMasters";
import { useSlaves } from "@/hooks/useSlaves";

const Traders = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: masters, isLoading, isError, error } = useMasters();
  const { data: slaves, isLoading: isLoadingSlaves } = useSlaves();

  if (isError) {
    console.error("Error loading masters:", error);
  }
  if (masters) {
    console.log("Masters loaded:", masters.length);
  }

  const traders = masters?.map(master => ({
    id: master.id,
    name: master.name,
    roi: master.stats?.roi30d || 0,
    maxDrawdown: master.stats?.drawdown || 0,
    followers: master.stats?.subscribers || 0,
    style: "Day Trading", // TODO: Add style to backend
    avatar: master.avatar || "",
  })) || [];

  const bots = [
    {
      name: "Alpha Scalper Pro",
      description: "Stratégie scalping haute fréquence",
      roi: 52.8,
      maxDrawdown: 8.5,
      riskLevel: "Moyen",
      strategy: "Scalping AI",
    },
    {
      name: "TrendMaster ML",
      description: "Détection de tendances par Machine Learning",
      roi: 38.4,
      maxDrawdown: 11.2,
      riskLevel: "Faible",
      strategy: "Trend Following",
    },
    {
      name: "Grid Trading Bot",
      description: "Stratégie de grille automatisée",
      roi: 29.7,
      maxDrawdown: 15.8,
      riskLevel: "Élevé",
      strategy: "Grid Trading",
    },
    {
      name: "Neural Predictor",
      description: "Prédictions par réseaux neuronaux",
      roi: 45.1,
      maxDrawdown: 9.3,
      riskLevel: "Moyen",
      strategy: "ML Prediction",
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-soft-text hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-foreground">Traders</h1>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <InputField
                placeholder="Rechercher un trader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-5 w-5" />}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 animate-fade-in">
        <Tabs defaultValue="human" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="human">Human Traders</TabsTrigger>
            <TabsTrigger value="bots">AI Trading Bots</TabsTrigger>
            <TabsTrigger value="my-traders">Mes Traders</TabsTrigger>
          </TabsList>

          <TabsContent value="human" className="mt-0">
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="card-trader text-center">
                <p className="caption mb-1">Total</p>
                <p className="text-2xl font-bold tnum">{traders.length}</p>
              </div>
              <div className="card-trader text-center">
                <p className="caption mb-1">ROI Moyen</p>
                <p className="text-2xl font-bold tnum text-success">+32.4%</p>
              </div>
              <div className="card-trader text-center">
                <p className="caption mb-1">Actifs</p>
                <p className="text-2xl font-bold tnum">124</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {["Tous", "Day Trading", "Swing Trading", "Scalping", "Position"].map(
                (filter) => (
                  <button
                    key={filter}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === "Tous"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-soft-text hover:bg-muted/80"
                      }`}
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-soft-text">Chargement des traders...</div>
                ) : isError ? (
                  <div className="text-center py-8 text-destructive">
                    Erreur de chargement. Vérifiez la connexion backend.
                    <br />
                    <span className="text-xs opacity-70">{(error as any)?.message}</span>
                  </div>
                ) : (
                  traders.map((trader, index) => (
                    <div key={index} onClick={() => navigate(`/trader/${trader.id}`)} className="cursor-pointer">
                      <TraderCard {...trader} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bots" className="mt-0">
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="card-trader text-center">
                <p className="caption mb-1">Total Bots</p>
                <p className="text-2xl font-bold tnum">{bots.length}</p>
              </div>
              <div className="card-trader text-center">
                <p className="caption mb-1">ROI Moyen</p>
                <p className="text-2xl font-bold tnum text-success">+41.5%</p>
              </div>
              <div className="card-trader text-center">
                <p className="caption mb-1">Actifs</p>
                <p className="text-2xl font-bold tnum">87</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {["Tous", "Scalping", "Trend", "Grid", "ML Prediction"].map(
                (filter) => (
                  <button
                    key={filter}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === "Tous"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-soft-text hover:bg-muted/80"
                      }`}
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            <div className="space-y-4">
              {bots.map((bot, index) => (
                <div key={index} onClick={() => navigate("/bot/1")} className="cursor-pointer">
                  <BotCard {...bot} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-traders" className="mt-0">
            <div className="space-y-4 mt-6">
              {isLoadingSlaves ? (
                <div className="text-center py-8 text-soft-text">Chargement des copies...</div>
              ) : slaves && slaves.length > 0 ? (
                slaves
                  .filter((s: any) => s && s.master) // Filter out orphaned slaves
                  .map((slave: any) => (
                    <ActiveCopyCard key={slave.id} slave={slave} />
                  ))
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Aucune copie active</h3>
                  <p className="text-soft-text mb-4">Vous ne copiez aucun trader pour le moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Traders;
