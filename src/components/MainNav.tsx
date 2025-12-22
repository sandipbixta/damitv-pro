
import { cn } from "@/lib/utils";
import { Home, CalendarDays, Tv2, Radio, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";

const MainNav = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { title: "Home", path: "/" },
    { title: "Live", path: "/live" },
    { title: "Schedule", path: "/schedule" },
    { title: "Channels", path: "/channels" }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="flex items-center justify-between w-full">
      {/* Logo */}
      <button 
        onClick={() => navigate("/")} 
        className="cursor-pointer flex items-center gap-2 flex-shrink-0"
      >
        <span className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          DAMI<span className="text-primary">TV</span>
        </span>
      </button>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              location.pathname === item.path 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.title}
          </button>
        ))}
      </div>
      
      {/* Search Icon */}
      <div className="hidden md:flex items-center">
        <button 
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {/* Could implement search modal */}}
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};

export default MainNav;
