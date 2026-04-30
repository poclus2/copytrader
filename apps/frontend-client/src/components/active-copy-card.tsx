import { Play, Pause, Settings, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Slave, useUpdateSlave, useDeleteSlave } from "@/hooks/useSlaves";
import { useNavigate } from "react-router-dom";
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

interface ActiveCopyCardProps {
    slave: Slave;
}

export function ActiveCopyCard({ slave }: ActiveCopyCardProps) {
    const navigate = useNavigate();
    const { mutate: updateSlave, isPending: isUpdating } = useUpdateSlave();
    const { mutate: deleteSlave, isPending: isDeleting } = useDeleteSlave();

    const isPaused = slave.status === 'PAUSED';
    const profit = slave.stats?.profit || 0;
    const isProfit = profit >= 0;

    const handleTogglePause = () => {
        updateSlave({
            id: slave.id,
            data: { status: isPaused ? 'ACTIVE' : 'PAUSED' }
        });
    };

    const handleDelete = () => {
        deleteSlave(slave.id);
    };

    return (
        <div className="card-portfolio group hover:shadow-hover transition-all duration-300">
            {/* Header: Master Info */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={slave.master?.avatar} alt={slave.master?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {slave.master?.name?.substring(0, 2).toUpperCase() || 'TR'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-foreground">{slave.master?.name}</h3>
                        <div className="flex gap-2 text-xs text-soft-text items-center">
                            <span className="capitalize">{(slave.type || 'external').toLowerCase()}</span>
                            <span>•</span>
                            <span className={isPaused ? "text-warning" : "text-success"}>
                                {isPaused ? "En Pause" : "Actif"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleTogglePause} disabled={isUpdating}>
                        {isPaused ? <Play className="h-4 w-4 text-success" /> : <Pause className="h-4 w-4 text-warning" />}
                    </Button>
                    <Button variant="ghost" size="icon" disabled={!slave.master} onClick={() => navigate('/copy-config', { state: { masterId: slave.master?.id, slaveId: slave.id } })}>
                        <Settings className="h-4 w-4 text-soft-text" />
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Arrêter la copie ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Voulez-vous vraiment arrêter de copier {slave.master?.name} ?
                                    Cette action fermera la liaison de copie. Vos positions ouvertes devront être gérées manuellement ou fermées.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Arrêter la copie
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg cursor-pointer" onClick={() => navigate(`/copy/${slave.id}`)}>
                <div>
                    <p className="caption mb-1">Profit Généré</p>
                    <p className={`text-lg font-bold tnum flex items-center gap-1 ${isProfit ? "text-success" : "text-destructive"}`}>
                        {isProfit ? "+" : ""}${Number(profit).toFixed(2)}
                        <TrendingUp className="h-4 w-4" />
                    </p>
                </div>
                <div>
                    <p className="caption mb-1">ROI</p>
                    <p className={`text-lg font-bold tnum ${isProfit ? "text-success" : "text-destructive"}`}>
                        {isProfit ? "+" : ""}{slave.stats?.roi || 0}%
                    </p>
                </div>
                <div>
                    <p className="caption mb-1">Solde Actuel</p>
                    <p className="text-lg font-bold tnum text-foreground">
                        ${Number((slave.type === 'VIRTUAL' ? slave.virtualBalance : slave.balance) || 0).toFixed(2)}
                    </p>
                </div>
                <div>
                    <p className="caption mb-1">Trades</p>
                    <p className="text-lg font-bold tnum text-foreground">
                        {slave.tradeCount || 0}
                    </p>
                </div>
            </div>
        </div>
    );
}
