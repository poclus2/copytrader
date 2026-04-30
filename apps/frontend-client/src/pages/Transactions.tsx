import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Transaction {
    id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_PROFIT' | 'TRADE_LOSS' | 'SUBSCRIPTION_FEE';
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    createdAt: string;
    method?: string;
    accountId?: string;
    metadata?: any;
}

const Transactions = () => {
    const navigate = useNavigate();

    const { data: transactions, isLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const { data } = await api.get<Transaction[]>('/wallet/transactions');
            return data;
        },
    });

    // Séparer les transactions wallet et trading
    const walletTransactions = transactions?.filter(t =>
        t.type === 'DEPOSIT' || t.type === 'WITHDRAWAL' || t.type === 'SUBSCRIPTION_FEE'
    ) || [];

    const tradingTransactions = transactions?.filter(t =>
        t.type === 'TRADE_PROFIT' || t.type === 'TRADE_LOSS'
    ) || [];

    // Calculer les stats
    const totalDeposits = walletTransactions.filter(t => t.type === 'DEPOSIT').reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = walletTransactions.filter(t => t.type === 'WITHDRAWAL').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalTradingProfit = tradingTransactions.filter(t => t.type === 'TRADE_PROFIT').reduce((sum, t) => sum + t.amount, 0);
    const totalTradingLoss = tradingTransactions.filter(t => t.type === 'TRADE_LOSS').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netTrading = totalTradingProfit - totalTradingLoss;

    const getWalletIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'DEPOSIT':
                return <ArrowDownLeft className="h-5 w-5 text-success" />;
            case 'WITHDRAWAL':
                return <ArrowUpRight className="h-5 w-5 text-destructive" />;
            case 'SUBSCRIPTION_FEE':
                return <DollarSign className="h-5 w-5 text-primary" />;
            default:
                return <DollarSign className="h-5 w-5 text-primary" />;
        }
    };

    const getTradingIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'TRADE_PROFIT':
                return <TrendingUp className="h-5 w-5 text-success" />;
            case 'TRADE_LOSS':
                return <TrendingDown className="h-5 w-5 text-destructive" />;
            default:
                return <DollarSign className="h-5 w-5 text-primary" />;
        }
    };

    const getLabel = (type: Transaction['type']) => {
        switch (type) {
            case 'DEPOSIT': return 'Dépôt';
            case 'WITHDRAWAL': return 'Retrait';
            case 'TRADE_PROFIT': return 'Gain Trading';
            case 'TRADE_LOSS': return 'Perte Trading';
            case 'SUBSCRIPTION_FEE': return 'Frais Abonnement';
            default: return type;
        }
    };

    return (
        <div className="min-h-screen pb-24 bg-background">
            {/* Header */}
            <header className="border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-soft-text hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold">Historique</h1>
                </div>
                <p className="text-soft-text text-sm">Vos transactions et trades</p>
            </header>

            <main className="p-6 animate-fade-in">
                <Tabs defaultValue="transactions" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-6">
                        <TabsTrigger value="transactions">Transactions</TabsTrigger>
                        <TabsTrigger value="trading">Trading</TabsTrigger>
                    </TabsList>

                    {/* Tab Transactions (Wallet) */}
                    <TabsContent value="transactions" className="mt-0">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="card-trader text-center">
                                <p className="caption mb-1">Total</p>
                                <p className="text-2xl font-bold tnum">{walletTransactions.length}</p>
                            </div>
                            <div className="card-trader text-center">
                                <p className="caption mb-1">Dépôts</p>
                                <p className="text-2xl font-bold tnum text-success">+${totalDeposits.toFixed(2)}</p>
                            </div>
                            <div className="card-trader text-center">
                                <p className="caption mb-1">Retraits</p>
                                <p className="text-2xl font-bold tnum text-destructive">-${totalWithdrawals.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            {["Tous", "Dépôts", "Retraits", "Frais"].map((filter) => (
                                <button
                                    key={filter}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === "Tous"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-soft-text hover:bg-muted/80"
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Transaction List */}
                        <div className="space-y-3">
                            {isLoading ? (
                                <p className="text-center text-soft-text py-8">Chargement...</p>
                            ) : walletTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <DollarSign className="h-12 w-12 mx-auto text-muted mb-4" />
                                    <p className="text-soft-text">Aucune transaction trouvée</p>
                                    <p className="text-xs text-soft-text mt-2">Vos dépôts et retraits apparaîtront ici</p>
                                </div>
                            ) : (
                                walletTransactions.map((tx) => (
                                    <div key={tx.id} className="card-trader flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted/50">
                                                {getWalletIcon(tx.type)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{getLabel(tx.type)}</p>
                                                <p className="text-xs text-soft-text">
                                                    {new Date(tx.createdAt).toLocaleDateString()} • {tx.method || 'Système'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold tnum ${tx.type === 'DEPOSIT' ? 'text-success' : 'text-foreground'
                                                }`}>
                                                {tx.type === 'DEPOSIT' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                            </p>
                                            <StatusBadge type={tx.status === 'COMPLETED' ? 'profit' : 'risk'}>
                                                {tx.status}
                                            </StatusBadge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab Trading */}
                    <TabsContent value="trading" className="mt-0">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="card-trader text-center">
                                <p className="caption mb-1">Trades</p>
                                <p className="text-2xl font-bold tnum">{tradingTransactions.length}</p>
                            </div>
                            <div className="card-trader text-center">
                                <p className="caption mb-1">Gains</p>
                                <p className="text-2xl font-bold tnum text-success">+${totalTradingProfit.toFixed(2)}</p>
                            </div>
                            <div className="card-trader text-center">
                                <p className="caption mb-1">Net</p>
                                <p className={`text-2xl font-bold tnum ${netTrading >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {netTrading >= 0 ? '+' : ''}${netTrading.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            {["Tous", "Gains", "Pertes", "MT5", "Binance"].map((filter) => (
                                <button
                                    key={filter}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === "Tous"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-soft-text hover:bg-muted/80"
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {/* Trading List */}
                        <div className="space-y-3">
                            {isLoading ? (
                                <p className="text-center text-soft-text py-8">Chargement...</p>
                            ) : tradingTransactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <TrendingUp className="h-12 w-12 mx-auto text-muted mb-4" />
                                    <p className="text-soft-text">Aucun trade enregistré</p>
                                    <p className="text-xs text-soft-text mt-2">L'historique de vos trades apparaîtra ici</p>
                                </div>
                            ) : (
                                tradingTransactions.map((tx) => (
                                    <div key={tx.id} className="card-trader">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted/50">
                                                    {getTradingIcon(tx.type)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {tx.metadata?.symbol || 'Trade'}
                                                    </p>
                                                    <p className="text-xs text-soft-text">
                                                        {tx.accountId || 'Compte'} • {new Date(tx.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold tnum ${tx.type === 'TRADE_PROFIT' ? 'text-success' : 'text-destructive'
                                                    }`}>
                                                    {tx.type === 'TRADE_PROFIT' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                                </p>
                                                <StatusBadge type={tx.type === 'TRADE_PROFIT' ? 'profit' : 'loss'}>
                                                    {tx.type === 'TRADE_PROFIT' ? 'GAIN' : 'PERTE'}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                        {tx.metadata && (
                                            <div className="flex gap-4 text-xs text-soft-text pt-2 border-t border-border">
                                                {tx.metadata.lots && <span>Lots: {tx.metadata.lots}</span>}
                                                {tx.metadata.entryPrice && <span>Entry: ${tx.metadata.entryPrice}</span>}
                                                {tx.metadata.exitPrice && <span>Exit: ${tx.metadata.exitPrice}</span>}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default Transactions;

