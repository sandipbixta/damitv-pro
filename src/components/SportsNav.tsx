import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { CircleDot, Dribbble, Trophy, Swords, Target, Bike, Flag, Dumbbell } from "lucide-react";

const sportsCategories = [
  { title: "Football", path: "/live?sport=football", icon: CircleDot },
  { title: "Basketball", path: "/live?sport=basketball", icon: Dribbble },
  { title: "Ice Hockey", path: "/live?sport=hockey", icon: Target },
  { title: "Cricket", path: "/live?sport=cricket", icon: Trophy },
  { title: "MMA", path: "/live?sport=mma", icon: Swords },
  { title: "Boxing", path: "/live?sport=boxing", icon: Dumbbell },
  { title: "Motor Sports", path: "/live?sport=motorsports", icon: Flag },
  { title: "Cycling", path: "/live?sport=cycling", icon: Bike },
];

const SportsNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    const searchParams = new URLSearchParams(location.search);
    const currentSport = searchParams.get('sport');
    const pathSport = new URLSearchParams(path.split('?')[1]).get('sport');
    return location.pathname === '/live' && currentSport === pathSport;
  };

  return (
    <nav className="hidden md:flex items-center justify-center gap-1 py-2 border-t border-border/50 overflow-x-auto">
      {sportsCategories.map((sport) => (
        <button
          key={sport.path}
          onClick={() => navigate(sport.path)}
          className={cn(
            "px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-1.5 whitespace-nowrap",
            isActive(sport.path)
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <sport.icon size={16} />
          {sport.title}
        </button>
      ))}
    </nav>
  );
};

export default SportsNav;
