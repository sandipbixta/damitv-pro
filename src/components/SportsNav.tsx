import { cn } from "@/lib/utils";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { CircleDot, Dribbble, Trophy, Swords, Target, Flag, Dumbbell } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface SportCategory {
  title: string;
  sportId: string;
  icon: LucideIcon;
}

const sportsCategories: SportCategory[] = [
  { title: "Football", sportId: "1", icon: CircleDot },
  { title: "Basketball", sportId: "2", icon: Dribbble },
  { title: "Ice Hockey", sportId: "3", icon: Target },
  { title: "Cricket", sportId: "4", icon: Trophy },
  { title: "MMA", sportId: "mma", icon: Swords },
  { title: "Boxing", sportId: "boxing", icon: Dumbbell },
  { title: "Motor Sports", sportId: "motorsports", icon: Flag },
];

const SportsNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const currentSportFilter = searchParams.get('sport') || 'all';
  const isOnLivePage = location.pathname === '/live';

  const handleSportClick = (sportId: string) => {
    if (sportId === 'all') {
      navigate('/live');
    } else {
      navigate(`/live?sport=${sportId}`);
    }
  };

  const isActive = (sportId: string) => {
    if (!isOnLivePage) return false;
    return currentSportFilter === sportId;
  };

  return (
    <nav className="hidden md:flex items-center justify-center gap-1 py-2 border-t border-border/50 overflow-x-auto">
      <button
        onClick={() => handleSportClick('all')}
        className={cn(
          "px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap",
          isOnLivePage && currentSportFilter === 'all'
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All Sports
      </button>
      {sportsCategories.map((sport) => {
        const Icon = sport.icon;
        return (
          <button
            key={sport.sportId}
            onClick={() => handleSportClick(sport.sportId)}
            className={cn(
              "px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-1.5 whitespace-nowrap",
              isActive(sport.sportId)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={16} />
            {sport.title}
          </button>
        );
      })}
    </nav>
  );
};

export default SportsNav;
