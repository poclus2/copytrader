import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Link2,
  Settings,
  Globe,
  Bell,
  Moon,
  FileCheck,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  const user = {
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    phone: "+33 6 12 34 56 78",
    avatar: "",
    kycLevel: 1,
  };

  const menuItems = [
    {
      section: "Informations utilisateur",
      items: [
        { icon: User, label: "Nom complet", value: user.name, action: "/profile/edit-name" },
        { icon: Mail, label: "Email", value: user.email, action: "/profile/edit-email" },
        { icon: Phone, label: "Téléphone", value: user.phone, action: "/profile/edit-phone" },
      ],
    },
    {
      section: "Sécurité",
      items: [
        { icon: Lock, label: "Modifier mot de passe", action: "/profile/change-password" },
        { icon: Shield, label: "Modifier PIN", action: "/profile/change-pin" },
        { icon: Shield, label: "Double authentification (2FA)", value: "Désactivé", action: "/profile/2fa" },
      ],
    },
    {
      section: "Comptes connectés",
      items: [
        { icon: Link2, label: "Connexion MT4/MT5", action: "/mt5/connect" },
        { icon: User, label: "Compte maître trader", value: "Non connecté", action: "/master/connect" },
      ],
    },
    {
      section: "Paramètres",
      items: [
        { icon: Globe, label: "Langue", value: "Français", action: "/profile/language" },
        { icon: Bell, label: "Notifications", action: "/profile/notifications" },
        { icon: Moon, label: "Thème", value: "Sombre", action: "/profile/theme" },
      ],
    },
    {
      section: "Vérification KYC",
      items: [
        { 
          icon: FileCheck, 
          label: "Vérification d'identité", 
          value: `Niveau ${user.kycLevel}/3`, 
          action: "/profile/kyc" 
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-card/95">
        <div className="p-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 text-soft-text hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Retour</span>
          </button>

          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
              <p className="text-soft-text text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6 animate-fade-in">
        {menuItems.map((section, sectionIndex) => (
          <section key={sectionIndex} className="space-y-3">
            <h3 className="text-sm font-medium text-soft-text px-2">{section.section}</h3>
            <div className="card-portfolio divide-y divide-border">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => navigate(item.action)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors first:rounded-t-card last:rounded-b-card"
                >
                  <item.icon className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.value && (
                      <p className="text-sm text-soft-text">{item.value}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-soft-text shrink-0" />
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* Logout Button */}
        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={() => {
            // Handle logout
            navigate("/auth");
          }}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Déconnexion
        </Button>
      </main>
    </div>
  );
};

export default Profile;
