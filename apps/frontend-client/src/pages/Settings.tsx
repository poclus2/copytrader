import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User,
    Mail,
    Phone,
    Lock,
    Shield,
    Globe,
    Bell,
    Moon,
    FileCheck,
    LogOut,
    Info,
    Save,
    ArrowLeft,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useAuth";
import { useCreateSubscription } from "@/hooks/useSubscriptions";
import { MT5AccountsList } from "@/components/MT5AccountsList";

const Settings = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const defaultTab = location.state?.defaultTab || "profile";

    const { data: currentUser } = useCurrentUser();
    const { mutate: createSubscription, isPending: isSubmitting } = useCreateSubscription();

    // Copy Config State
    const [copyMode, setCopyMode] = useState("multiplier");
    const [multiplier, setMultiplier] = useState(1);
    const [stopLoss, setStopLoss] = useState([20]);
    const [takeProfit, setTakeProfit] = useState([50]);
    const [minCapital, setMinCapital] = useState("1000");
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleSaveCopyConfig = () => {
        // TODO: Implement update logic
        alert("Configuration sauvegardée !");
    };

    const calculateRisk = () => {
        const accountBalance = 5000; // TODO: Get real balance
        const riskAmount = (accountBalance * stopLoss[0]) / 100;
        return riskAmount.toFixed(2);
    };

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-screen pb-24 bg-background">
            {/* Header */}
            <header className="border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-card/95">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <ArrowLeft className="h-6 w-6 text-foreground" />
                        </button>
                        <Avatar className="h-20 w-20 border-2 border-primary">
                            <AvatarImage src="" alt={currentUser?.user?.firstName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                                {currentUser?.user?.firstName?.substring(0, 2).toUpperCase() || "ME"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-1">
                                {currentUser?.user?.firstName} {currentUser?.user?.lastName}
                            </h1>
                            <p className="text-soft-text text-sm">{currentUser?.user?.email}</p>
                        </div>
                    </div>

                    <TabsList className="w-full grid grid-cols-4 bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger value="profile">Profil</TabsTrigger>
                        <TabsTrigger value="copy">Copie</TabsTrigger>
                        <TabsTrigger value="security">Sécurité</TabsTrigger>
                        <TabsTrigger value="prefs">Prefs</TabsTrigger>
                    </TabsList>
                </div>
            </header>

            <main className="p-6">
                <TabsContent value="profile" className="space-y-6 mt-0">
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Informations Personnelles
                        </h3>
                        <div className="card-portfolio space-y-4">
                            <InputField label="Prénom" value={currentUser?.user?.firstName} readOnly icon={<User className="h-4 w-4" />} />
                            <InputField label="Nom" value={currentUser?.user?.lastName} readOnly icon={<User className="h-4 w-4" />} />
                            <InputField label="Email" value={currentUser?.user?.email} readOnly icon={<Mail className="h-4 w-4" />} />
                            <InputField label="Téléphone" value={currentUser?.user?.phone || ""} placeholder="Non renseigné" icon={<Phone className="h-4 w-4" />} />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-primary" />
                            Vérification KYC
                        </h3>
                        <div className="card-portfolio flex items-center justify-between">
                            <div>
                                <p className="font-medium">Niveau Actuel</p>
                                <p className="text-sm text-soft-text">Niveau 1 - Vérifié</p>
                            </div>
                            <Button variant="outline" onClick={() => navigate('/profile/kyc')}>
                                Voir détails
                            </Button>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="copy" className="space-y-6 mt-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-primary" />
                            Configuration Globale du Copie
                        </h3>
                        <Button size="sm" onClick={handleSaveCopyConfig}>
                            <Save className="h-4 w-4 mr-2" />
                            Sauvegarder
                        </Button>
                    </div>

                    <section className="card-portfolio space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Mode de Copie par Défaut</h4>
                            <Info className="h-4 w-4 text-soft-text" />
                        </div>

                        <RadioGroup value={copyMode} onValueChange={setCopyMode} className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <RadioGroupItem value="multiplier" id="multiplier" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="multiplier" className="font-medium cursor-pointer">Multiplicateur</Label>
                                    <p className="text-xs text-soft-text">Proportionnel à la taille du trade du master</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="fixed" className="font-medium cursor-pointer">Lot Fixe</Label>
                                    <p className="text-xs text-soft-text">Taille fixe pour chaque trade</p>
                                </div>
                            </div>
                        </RadioGroup>

                        {copyMode === "multiplier" && (
                            <div className="space-y-3 pt-2">
                                <Label>Multiplicateur: {multiplier}x</Label>
                                <Slider value={[multiplier]} onValueChange={(v) => setMultiplier(v[0])} min={0.1} max={5} step={0.1} />
                            </div>
                        )}
                    </section>

                    <section className="card-portfolio space-y-4">
                        <h4 className="font-medium">Gestion des Risques</h4>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label>Stop Loss Global ({stopLoss[0]}%)</Label>
                                    <span className="text-xs text-destructive">-${calculateRisk()}</span>
                                </div>
                                <Slider value={stopLoss} onValueChange={setStopLoss} min={5} max={50} step={5} />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <Label>Take Profit Global ({takeProfit[0]}%)</Label>
                                    <span className="text-xs text-success">Target</span>
                                </div>
                                <Slider value={takeProfit} onValueChange={setTakeProfit} min={10} max={100} step={5} />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5 text-primary" />
                            Comptes de Trading
                        </h3>
                        <div className="card-portfolio flex items-center justify-between">
                            <div>
                                <p className="font-medium">MetaTrader 5</p>
                                <p className="text-sm text-soft-text">Connectez votre compte pour le copy trading</p>
                            </div>
                            <Button variant="default" onClick={() => navigate('/mt5-connect')}>
                                Connecter
                            </Button>
                        </div>

                        <div className="mt-4">
                            {/* Defensive check for MT5AccountsList */}
                            <MT5AccountsList />
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-0">
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Sécurité du Compte
                        </h3>

                        <div className="card-portfolio space-y-4">
                            <Button variant="outline" className="w-full justify-between" onClick={() => navigate('/profile/change-password')}>
                                <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Changer mot de passe</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            <Button variant="outline" className="w-full justify-between">
                                <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Double Authentification (2FA)</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded">Désactivé</span>
                            </Button>
                        </div>
                    </section>
                </TabsContent>

                <TabsContent value="prefs" className="space-y-6 mt-0">
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            Préférences
                        </h3>

                        <div className="card-portfolio space-y-4">
                            <div className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-2">
                                    <Moon className="h-4 w-4" />
                                    <span>Mode Sombre</span>
                                </div>
                                {/* Switch component would go here */}
                                <span className="text-sm text-primary">Activé</span>
                            </div>

                            <div className="flex items-center justify-between p-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <span>Langue</span>
                                </div>
                                <span className="text-sm">Français</span>
                            </div>
                        </div>

                        <Button variant="destructive" className="w-full mt-8" onClick={() => navigate('/auth')}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Déconnexion
                        </Button>
                    </section>
                </TabsContent>
            </main>
        </Tabs>
    );
};

// Helper component for ChevronRight since it was missing in imports
const ChevronRight = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);

// Renaming Settings icon to SettingsIcon to avoid conflict with component name
const SettingsIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export default Settings;
