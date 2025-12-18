import { cn } from "@/lib/utils";
import { Home, CalendarDays, Tv2, Radio, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import Clock from "./Clock";
import ThemeToggle from "./ThemeToggle";
import PushNotifications from "./PushNotifications";
import { Button } from "./ui/button";
import damitvLogo from "@/assets/damitv-logo.png";

const MainNav = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { title: "HOME", icon: Home, path: "/" },
    { title: "SCHEDULE", icon: CalendarDays, path: "/schedule" },
    { title: "LIVE", icon: Tv2, path: "/live" },
    { title: "CHANNELS", icon: Radio, path: "/channels" }
  ];

  const handleNavigate = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(path);
  };

  return (
    <div className="flex items-center gap-6 w-full md:w-auto">
      <button onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); navigate("/"); }} className="cursor-pointer flex items-center gap-2 flex-shrink-0" aria-label="Go to homepage">
        <img 
          src={damitvLogo} 
          alt="DamiTV - Free Sports Streaming" 
          width={48}
          height={48}
          loading="eager"
          decoding="async"
          className="h-12 w-12 object-cover" 
        />
        <span className="text-xl font-bold text-white tracking-tight">
          DAMITV
        </span>
      </button>
      
      {/* FanCode-style horizontal nav */}
      <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={cn(
              "px-4 py-2 text-sm font-semibold tracking-wide transition-colors text-white",
              "hover:text-white/80",
              location.pathname === item.path && "text-white underline underline-offset-4"
            )}
            aria-label={`Navigate to ${item.title}`}
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            {item.title}
          </button>
        ))}
      </nav>
      
      <div className="hidden md:flex items-center gap-3 ml-auto">
        <span className="text-white/80 text-sm">Download the app:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/install")}
          className="text-white hover:text-white/80 hover:bg-white/10 p-2"
          title="Install DamiTV App"
        >
          <Download className="h-5 w-5" />
        </Button>
        <PushNotifications />
        <ThemeToggle />
        <Clock />
      </div>
    </div>
  );
};

export default MainNav;
