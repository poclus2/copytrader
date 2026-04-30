import { Button } from "@/components/ui/button";
import { PortfolioCard } from "@/components/portfolio-card";
import { TraderCard } from "@/components/trader-card";
import { PerformanceChart } from "@/components/performance-chart";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  TrendingUp,
  Wallet,
  Users,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMasters } from "@/hooks/useMasters";
import { useWallet, useTransactions } from "@/hooks/useWallet";
import { useMT5Accounts } from "@/hooks/useMT5Accounts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: masters } = useMasters();

  // Real data integration
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions();
  const { data: mt5Accounts } = useMT5Accounts();

  // Calculate Portfolio Stats
  const portfolioBalance = wallet?.balance || 0;

  // Calculate Trading Balance (Sum of all connected MT5 accounts equity)
  const tradingBalance = mt5Accounts?.reduce((sum, acc) => sum + (acc.equity || 0), 0) || 0;

  // Calculate Monthly Gains (from transactions)
  const currentMonth = new Date().getMonth();
  const monthlyGains = transactions
    ?.filter(t =>
      t.type === 'TRADE_PROFIT' &&
      new Date(t.createdAt).getMonth() === currentMonth
    )
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  // Calculate Trading Change % (Simple estimation based on equity vs balance)
  // In a real scenario, this should come from a specialized backend endpoint
  const totalMT5Balance = mt5Accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
  const tradingChange = totalMT5Balance > 0
    ? ((tradingBalance - totalMT5Balance) / totalMT5Balance) * 100
    : 0;

  const topTraders = masters?.slice(0, 3).map(master => ({
    id: master.id,
    name: master.name,
    roi: master.stats.roi30d,
    maxDrawdown: master.stats.drawdown,
    followers: master.stats.subscribers,
    style: "Day Trading", // TODO: Add style to backend model
    avatar: master.avatar || "",
  })) || [];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground mb-1">Bienvenue {user?.firstName} 👋</h2>
            <p className="text-sm text-soft-text">Voici votre tableau de bord</p>
          </div>
          <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <Users className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-8 animate-fade-in">
        {/* Portfolio Section */}
        <section className="space-y-4">
          <PortfolioCard
            title="Solde Portefeuille"
            subtitle="Disponible pour investir"
            balance={portfolioBalance}
            change={0} // TODO: Add wallet history change calculation
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="card-trader">
              <Wallet className="h-5 w-5 text-primary mb-2" />
              <p className="caption mb-1">Trading (Equity)</p>
              <p className="text-xl font-bold tnum">${tradingBalance.toFixed(2)}</p>
              <p className={`text-sm ${tradingChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                {tradingChange >= 0 ? '+' : ''}{tradingChange.toFixed(2)}%
              </p>
            </div>
            <div className="card-trader">
              <TrendingUp className="h-5 w-5 text-primary mb-2" />
              <p className="caption mb-1">Gains (Mois)</p>
              <p className="text-xl font-bold tnum text-success">+${monthlyGains.toFixed(2)}</p>
              <p className="text-sm text-success">Ce mois</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2"
            onClick={() => navigate("/deposit")}
          >
            <ArrowDownToLine className="h-5 w-5" />
            <span className="text-xs">Dépôt</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2"
            onClick={() => navigate("/withdraw")}
          >
            <ArrowUpFromLine className="h-5 w-5" />
            <span className="text-xs">Retrait</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-col h-auto py-4 gap-2"
            onClick={() => navigate("/settings", { state: { defaultTab: "copy" } })}
          >
            <Copy className="h-5 w-5" />
            <span className="text-xs">Copier</span>
          </Button>
        </section>

        {/* Performance Chart Placeholder */}
        <section className="card-portfolio">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">Performance</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-xs rounded-full bg-primary text-primary-foreground">
                7J
              </button>
              <button className="px-3 py-1 text-xs rounded-full bg-muted text-soft-text hover:bg-muted/80">
                30J
              </button>
              <button className="px-3 py-1 text-xs rounded-full bg-muted text-soft-text hover:bg-muted/80">
                1A
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 bg-background/50">
            <PerformanceChart />
          </div>
        </section>

        {/* Top Traders */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground">Traders Populaires</h3>
            <button
              onClick={() => navigate("/traders")}
              className="text-sm text-primary hover:text-primary/80"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-4">
            {topTraders.map((trader, index) => (
              <div key={index} onClick={() => navigate(`/trader/${trader.id}`)} className="cursor-pointer">
                <TraderCard {...trader} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 bg-card border border-border rounded-[20px] shadow-hover z-20">
        <div className="grid grid-cols-5 p-2">
          {[
            { icon: "🏠", label: "Accueil", active: true, path: "/dashboard" },
            { icon: "👥", label: "Traders", active: false, path: "/traders" },
            { icon: "📜", label: "Historique", active: false, path: "/transactions" },
            { icon: "🎯", label: "Affiliation", active: false, path: "/affiliation" },
            { icon: "⚙️", label: "Paramètres", active: false, path: "/settings" },
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${item.active
                ? "bg-primary/10 text-primary"
                : "text-soft-text hover:text-foreground"
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
