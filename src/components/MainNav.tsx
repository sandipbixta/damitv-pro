
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import damitvLogo from "@/assets/damitv-logo.png";

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
        className="cursor-pointer flex items-center gap-3 flex-shrink-0"
      >
        <img 
          src={damitvLogo} 
          alt="DAMITV Logo" 
          className="h-10 w-10 object-contain" 
        />
        <span className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight uppercase">
          DAMITV
        </span>
      </button>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors",
              location.pathname === item.path 
                ? "text-primary" 
                : "text-foreground hover:text-primary"
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
