import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "@/hooks/useAuth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();

  const { mutate: register, isPending } = useRegister();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    if (!acceptTerms) {
      alert("Veuillez accepter les CGU");
      return;
    }

    register({
      email,
      password,
      firstName,
      lastName,
    });
  };

  return (
    <div className="min-h-screen flex flex-col p-6 justify-center">
      <div className="max-w-md mx-auto w-full space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-foreground">Créer un compte</h1>
          <p className="text-soft-text">
            Rejoignez des milliers de traders performants
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Prénom"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <InputField
              label="Nom"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <InputField
            label="Email"
            type="email"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-5 w-5" />}
            required
          />

          <InputField
            label="Téléphone"
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="h-5 w-5" />}
            required
          />

          <InputField
            label="Mot de passe"
            type="password"
            placeholder="Minimum 8 caractères"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            required
          />

          <InputField
            label="Confirmer le mot de passe"
            type="password"
            placeholder="Retapez votre mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="h-5 w-5" />}
            required
          />

          <div className="flex items-start gap-3 p-4 bg-card rounded-button border border-border">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="mt-0.5"
            />
            <label
              htmlFor="terms"
              className="text-sm text-soft-text leading-relaxed cursor-pointer"
            >
              J'accepte les{" "}
              <Link to="/terms" className="text-primary hover:text-primary/80">
                Conditions Générales d'Utilisation
              </Link>{" "}
              et la{" "}
              <Link to="/privacy" className="text-primary hover:text-primary/80">
                Politique de Confidentialité
              </Link>
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isPending}>
            {isPending ? "Création..." : "Créer mon compte"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-soft-text">
            Vous avez déjà un compte ?{" "}
            <Link
              to="/auth"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
