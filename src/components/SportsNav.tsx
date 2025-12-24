import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

const sportsCategories = [
  { title: "Football", path: "/live?sport=football" },
  { title: "Basketball", path: "/live?sport=basketball" },
  { title: "Tennis", path: "/live?sport=tennis" },
  { title: "Cricket", path: "/live?sport=cricket" },
  { title: "Hockey", path: "/live?sport=hockey" },
  { title: "MMA", path: "/live?sport=mma" },
  { title: "Boxing", path: "/live?sport=boxing" },
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
    <nav className="hidden md:flex items-center justify-center gap-1 py-2 border-t border-border/50">
      {sportsCategories.map((sport) => (
        <button
          key={sport.path}
          onClick={() => navigate(sport.path)}
          className={cn(
            "px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors",
            isActive(sport.path)
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {sport.title}
        </button>
      ))}
    </nav>
  );
};

export default SportsNav;
