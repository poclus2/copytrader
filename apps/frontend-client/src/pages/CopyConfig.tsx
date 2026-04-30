import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Info, Wallet, Server, ShieldCheck, Plus, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMaster } from "@/hooks/useMasters";
import { useCreateSlave } from "@/hooks/useSlaves";
import { useWallet } from "@/hooks/useWallet";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMT5Accounts } from "@/hooks/useMT5Accounts";

const CopyConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const masterId = location.state?.masterId;
  const { data: user } = useCurrentUser();
  const { data: master } = useMaster(masterId);
  const { data: wallet } = useWallet();
  const { data: accounts } = useMT5Accounts();
  const { mutate: createSlave, isPending } = useCreateSlave();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'VIRTUAL' | 'EXTERNAL'>('VIRTUAL');

  // Virtual Mode State
  const [allocation, setAllocation] = useState<number>(1000);

  // External Mode State
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [broker, setBroker] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');

  // Common Settings
  const [copyMode, setCopyMode] = useState("multiplier");
  const [multiplier, setMultiplier] = useState(1);
  const [stopLoss, setStopLoss] = useState([20]);

  // Auto-select first account/logic if needed, but safer to let user choose
  // useEffect(() => { ... }, [accounts]);

  const selectAccount = (account: any) => {
    setSelectedAccountId(account.id);
    setBroker(account.brokerName);
    setLogin(account.login); // Assuming UseMT5Accounts returns login
    setServer(account.server);
    setPassword(''); // User must confirm password
  };

  if (!masterId) {
    return <div className="p-8 text-center text-red-500">Erreur: Aucun trader sélectionné.</div>;
  }

  const maxAllocation = wallet?.balance || 0;

  const handleSubmit = () => {
    if (!user) return;

    const config = {
      mode: copyMode === 'multiplier' ? 'FIXED_RATIO' : copyMode,
      ratio: multiplier,
      maxDailyLoss: stopLoss[0],
    };

    createSlave({
      name: `${user.firstName}'s Copy of ${master?.name}`,
      type: mode,
      masterId,
      userId: user.id,
      broker: mode === 'VIRTUAL' ? 'Harestech Virtual' : broker,
      initialBalance: mode === 'VIRTUAL' ? allocation : undefined,
      credentials: mode === 'EXTERNAL' ? { login, password, server } : {},
      config
    }, {
      onSuccess: () => navigate('/dashboard')
    });
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="border-b border-border p-6 sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-soft-text hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Retour</span>
        </button>
        <h1 className="text-foreground text-xl font-bold">Configuration du Copie</h1>
        <p className="text-sm text-soft-text">Trader: {master?.name}</p>
      </header>

      <main className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Step 1: Mode Selection */}
        {step === 1 && (
          <section className="space-y-6 animate-fade-in">
            <div className="card-portfolio">
              <h2 className="text-lg font-semibold mb-4">Choisir le mode de copie</h2>
              <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${mode === 'VIRTUAL' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setMode('VIRTUAL')}>
                  <div className="flex items-center gap-2 mb-2">
                    <RadioGroupItem value="VIRTUAL" id="virtual" />
                    <Label htmlFor="virtual" className="font-bold cursor-pointer">Compte Virtuel</Label>
                  </div>
                  <p className="text-sm text-soft-text ml-6">
                    Créez un compte instantanément financé par votre Wallet. Idéal pour débuter sans configuration complexe.
                  </p>
                  <div className="mt-3 ml-6 flex gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Recommandé</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Zéro Latence</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${mode === 'EXTERNAL' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setMode('EXTERNAL')}>
                  <div className="flex items-center gap-2 mb-2">
                    <RadioGroupItem value="EXTERNAL" id="external" />
                    <Label htmlFor="external" className="font-bold cursor-pointer">Compte Externe</Label>
                  </div>
                  <p className="text-sm text-soft-text ml-6">
                    Connectez vos comptes MT4/MT5 ou Binance existants. Gardez vos fonds chez votre broker.
                  </p>
                  <div className="mt-3 ml-6">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Expert</span>
                  </div>
                </div>
              </RadioGroup>
            </div>
            <Button className="w-full" size="lg" onClick={() => setStep(2)}>Continuer</Button>
          </section>
        )}

        {/* Step 2: Virtual Allocation */}
        {step === 2 && mode === 'VIRTUAL' && (
          <section className="space-y-6 animate-fade-in">
            <div className="card-portfolio">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Wallet className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Allocation des Fonds</h2>
              </div>

              <div className="mb-6 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                <span className="text-sm text-soft-text">Solde Wallet Disponible</span>
                <span className="font-bold text-lg">${maxAllocation.toLocaleString()}</span>
              </div>

              <div className="space-y-4">
                <Label>Montant à allouer ($)</Label>
                <div className="flex gap-4">
                  <InputField
                    type="number"
                    value={allocation}
                    onChange={(e) => setAllocation(Number(e.target.value))}
                    max={maxAllocation}
                    className="text-lg font-bold"
                  />
                </div>
                <Slider
                  value={[allocation]}
                  max={maxAllocation}
                  step={10}
                  onValueChange={(v) => setAllocation(v[0])}
                />
                {allocation > maxAllocation && <p className="text-sm text-red-500">Solde insuffisant.</p>}
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Retour</Button>
              <Button className="w-full" disabled={allocation > maxAllocation || allocation <= 0} onClick={() => setStep(3)}>Suivant</Button>
            </div>
          </section>
        )}

        {/* Step 2: External Account Selection */}
        {step === 2 && mode === 'EXTERNAL' && (
          <section className="space-y-6 animate-fade-in">
            <div className="card-portfolio">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Server className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Sélection du Compte</h2>
              </div>

              {/* Existing Accounts List */}
              {accounts && accounts.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <Label>Comptes Connectés</Label>
                  <div className="grid gap-3">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer flex items-center justify-between transition-all ${selectedAccountId === account.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                        onClick={() => selectAccount(account)}
                      >
                        <div>
                          <p className="font-semibold">{account.login}</p>
                          <p className="text-sm text-soft-text">{account.brokerName} • {account.server}</p>
                        </div>
                        {selectedAccountId === account.id && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button variant="link" size="sm" onClick={() => navigate('/mt5-connect')} className="text-soft-text">
                      <Plus className="w-4 h-4 mr-1" /> Connecter un autre compte
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed border-border mb-6">
                  <Server className="w-10 h-10 text-soft-text mx-auto mb-3" />
                  <p className="text-foreground font-medium">Aucun compte connecté</p>
                  <p className="text-sm text-soft-text mb-4">Vous devez d'abord connecter un compte MT4/MT5.</p>
                  <Button onClick={() => navigate('/mt5-connect')}>Connecter un compte</Button>
                </div>
              )}

              {/* Credentials Confirmation */}
              {selectedAccountId && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <Label>Confirmation de sécurité</Label>
                  <p className="text-xs text-soft-text mb-2">
                    Veuillez confirmer le mot de passe de ce compte de trading.
                    <br />
                    Le login <strong>{login}</strong> et le serveur <strong>{server}</strong> sont pré-remplis.
                  </p>
                  <InputField
                    label="Mot de passe du compte MT5"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}

              {/* Manual Fallback (Hidden if account selected to reduce clutter, or optional) */}
              {!selectedAccountId && accounts && accounts.length > 0 && (
                <p className="text-xs text-center text-soft-text">Sélectionnez un compte pour continuer.</p>
              )}

            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Retour</Button>
              <Button className="w-full" disabled={!selectedAccountId || !password} onClick={() => setStep(3)}>Suivant</Button>
            </div>
          </section>
        )}

        {/* Step 3: Copy Settings */}
        {step === 3 && (
          <section className="space-y-6 animate-fade-in">
            <div className="card-portfolio">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Paramètres de Copie</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Gestion du Risque (Stop Loss Global %)</Label>
                  <Slider
                    value={stopLoss}
                    min={5} max={50} step={5}
                    onValueChange={setStopLoss}
                  />
                  <p className="text-right font-medium text-destructive">{stopLoss[0]}%</p>
                </div>

                <div className="space-y-3">
                  <Label>Multiplicateur de Taille</Label>
                  <Slider
                    value={[multiplier]}
                    min={0.1} max={5} step={0.1}
                    onValueChange={(v) => setMultiplier(v[0])}
                  />
                  <p className="text-right font-medium text-primary">x{multiplier}</p>
                  <p className="text-xs text-soft-text">Adapte la taille des positions du trader à votre capital.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="w-full" onClick={() => setStep(2)}>Retour</Button>
              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Création..." : "Confirmer et Démarrer"}
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default CopyConfig;
