import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import onboardingHero from "@/assets/onboarding-hero.png";
import securityIcon from "@/assets/security-icon.png";
import affiliationIcon from "@/assets/affiliation-icon.png";

const slides = [
  {
    image: onboardingHero,
    title: "Copiez les meilleurs traders en un clic",
    description: "Automatisez vos investissements en copiant les stratégies des traders professionnels les plus performants.",
  },
  {
    image: securityIcon,
    title: "Automatisation & protection avancée",
    description: "Contrôlez vos risques avec nos outils de protection automatique : stop loss, take profit, et limites de drawdown.",
  },
  {
    image: affiliationIcon,
    title: "Gagnez en invitant votre communauté",
    description: "Programme d'affiliation sur 3 niveaux. Générez des revenus passifs en parrainant de nouveaux traders.",
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/auth");
    }
  };

  const handleSkip = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col p-6 pb-8">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleSkip}
          className="text-soft-text hover:text-foreground transition-colors text-sm font-medium"
        >
          Passer
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full animate-fade-in">
        <div className="mb-8 w-full aspect-square max-w-sm flex items-center justify-center">
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-full object-contain animate-scale-in"
          />
        </div>

        <div className="text-center mb-12 space-y-4">
          <h1 className="text-foreground animate-slide-up">
            {slides[currentSlide].title}
          </h1>
          <p className="text-soft-text text-base leading-relaxed animate-slide-up">
            {slides[currentSlide].description}
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <Button
        size="lg"
        onClick={handleNext}
        className="w-full max-w-md mx-auto"
      >
        {currentSlide === slides.length - 1 ? "Commencer" : "Suivant"}
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};

export default Onboarding;
