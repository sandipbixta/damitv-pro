
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, CalendarDays, Tv2, Tv, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
    { title: "Home", icon: Home, path: "/" },
    { title: "Live", icon: Tv2, path: "/live" },
    { title: "Schedule", icon: CalendarDays, path: "/schedule" },
    { title: "Channels", icon: Tv, path: "/channels" },
    { title: "Search", icon: Search, path: "/install" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 transition-colors", 
                  isActive ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span className={cn(
                "text-[10px] mt-1 transition-colors font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
