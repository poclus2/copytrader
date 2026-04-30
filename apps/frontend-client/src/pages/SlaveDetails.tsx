import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Settings, Trash2, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { useSlave, useSlaveTrades, useUpdateSlave, useDeleteSlave } from "@/hooks/useSlaves";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PerformanceChart } from "@/components/performance-chart";

const SlaveDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: slave, isLoading: isLoadingSlave } = useSlave(id!);
    const { data: tradesData, isLoading: isLoadingTrades } = useSlaveTrades(id!);

    const { mutate: updateSlave } = useUpdateSlave();
    const { mutate: deleteSlave } = useDeleteSlave();

    if (isLoadingSlave) return <div className="p-8 text-center">Chargement...</div>;
    if (!slave) return <div className="p-8 text-center text-red-500">Copie introuvable.</div>;

    const isPaused = slave.status === 'PAUSED';
    const balance = slave.type === 'VIRTUAL' ? slave.virtualBalance : slave.balance;
    const profit = slave.stats?.profit || 0;
    const isProfit = profit >= 0;

    const handleTogglePause = () => {
        updateSlave({
            id: slave.id,
            data: { status: isPaused ? 'ACTIVE' : 'PAUSED' }
        });
    };

    const handleDelete = () => {
        deleteSlave(slave.id, {
            onSuccess: () => navigate('/traders')
        });
    };

    return (
        <div className="min-h-screen pb-24 bg-background">
            <header className="border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                            <ArrowLeft className="h-5 w-5 text-soft-text" />
                        </button>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={slave.master?.avatar} />
                                <AvatarFallback>{slave.master?.name?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-lg font-bold leading-tight">{slave.master?.name}</h1>
                                <div className="flex items-center gap-2 text-xs">
                                    <StatusBadge type={isPaused ? "neutral" : "active"} className="py-0 px-2 h-5 text-[10px]">
                                        {isPaused ? "PAUSE" : "ACTIF"}
                                    </StatusBadge>
                                    <span className="text-soft-text uppercase tracking-wider text-[10px]">{slave.type} • {slave.config?.mode}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleTogglePause}>
                            {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                            {isPaused ? "Reprendre" : "Pause"}
                        </Button>
                        <Button variant="outline" size="icon" disabled={!slave.master} onClick={() => navigate('/copy-config', { state: { masterId: slave.master?.id, slaveId: slave.id } })}>
                            <Settings className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Arrêter la copie ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Confirmer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-portfolio p-4">
                        <p className="caption mb-1">Profit Total</p>
                        <p className={`text-xl font-bold flex items-center gap-1 ${isProfit ? "text-success" : "text-destructive"}`}>
                            {isProfit ? "+" : ""}{Number(profit).toFixed(2)}$
                        </p>
                    </div>
                    <div className="card-portfolio p-4">
                        <p className="caption mb-1">Solde</p>
                        <p className="text-xl font-bold text-foreground">{Number(balance || 0).toFixed(2)}$</p>
                    </div>
                    <div className="card-portfolio p-4">
                        <p className="caption mb-1">ROI</p>
                        <p className={`text-xl font-bold ${isProfit ? "text-success" : "text-destructive"}`}>
                            {slave.stats?.roi || 0}%
                        </p>
                    </div>
                    <div className="card-portfolio p-4">
                        <p className="caption mb-1">Trades Totaux</p>
                        <p className="text-xl font-bold text-foreground">{tradesData?.total || 0}</p>
                    </div>
                </div>

                {/* Chart Placeholder (can be enhanced later with real history) */}
                <div className="card-portfolio p-6 h-[300px] flex items-center justify-center bg-muted/20 border-dashed">
                    <p className="text-soft-text">Graphique de performance (Bientôt disponible)</p>
                </div>

                {/* Trades History */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Historique des Trades
                    </h2>

                    {isLoadingTrades ? (
                        <div className="text-center py-8 text-soft-text">Chargement des trades...</div>
                    ) : tradesData && tradesData.data.length > 0 ? (
                        <div className="space-y-2">
                            {tradesData.data.map((trade: any) => {
                                const isWin = trade.profit >= 0;
                                return (
                                    <div key={trade.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10 ${trade.type === 'BUY' ? 'bg-success text-success' : 'bg-destructive text-destructive'}`}>
                                                {trade.type === 'BUY' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold flex items-center gap-2">
                                                    {trade.symbol}
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${trade.type === 'BUY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                                        {trade.type}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-soft-text">
                                                    {format(new Date(trade.createdAt), 'dd MMM HH:mm')} • Vol: {trade.volume}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold font-mono ${isWin ? 'text-success' : 'text-destructive'}`}>
                                                {isWin ? '+' : ''}{trade.profit}$
                                            </p>
                                            <p className="text-xs text-soft-text">
                                                {trade.openPrice} ➜ {trade.closePrice}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-lg text-soft-text">
                            Aucun trade enregistré pour le moment.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SlaveDetails;
