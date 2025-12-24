import React from 'react';
import { Link } from 'react-router-dom';
import MainNav from './MainNav';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';
import LiveScoreTicker from './LiveScoreTicker';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchBar from './SearchBar';
import damitvLogo from "@/assets/damitv-logo.png";

interface PageLayoutProps {
  children: React.ReactNode;
  searchTerm?: string;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children,
  searchTerm,
  onSearch
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* FanCode-style Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto py-3 px-4">
          <div className="flex flex-row justify-between items-center gap-4">
            {isMobile ? (
              <>
                <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                  <img 
                    src={damitvLogo} 
                    alt="DAMITV Logo" 
                    className="h-8 w-8 object-contain" 
                  />
                  <h1 className="text-lg font-extrabold text-foreground tracking-tight uppercase">
                    DAMITV
                  </h1>
                </Link>
                <div className="flex items-center gap-2">
                  {onSearch && (
                    <div className="relative">
                      <SearchBar
                        value={searchTerm || ''}
                        onChange={onSearch}
                        placeholder="Search..."
                        className="w-28"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <MainNav />
                {onSearch && (
                  <div className="relative w-64">
                    <SearchBar
                      value={searchTerm || ''}
                      onChange={onSearch}
                      placeholder="Search matches..."
                      className="w-full"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Live Score Ticker */}
      <LiveScoreTicker />

      <main className="container mx-auto py-6 px-4 pb-24 md:pb-8">
        {children}
      </main>
      
      {/* FanCode-style Footer */}
      <footer className="bg-card border-t border-border py-10 pb-28 md:pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={damitvLogo} 
                  alt="DAMITV Logo" 
                  className="h-8 w-8 object-contain" 
                />
                <h4 className="text-lg font-extrabold text-foreground uppercase">
                  DAMITV
                </h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Your destination for live sports streaming.
              </p>
            </div>
            
            <div>
              <h5 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">About</h5>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Sports</h5>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/live" className="hover:text-primary transition-colors">Football</Link></li>
                <li><Link to="/live" className="hover:text-primary transition-colors">Basketball</Link></li>
                <li><Link to="/live" className="hover:text-primary transition-colors">Tennis</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h5>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/dmca" className="hover:text-primary transition-colors">DMCA</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="border-t border-border pt-8">
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              <span className="font-bold">Disclaimer:</span> Our platform merely displays links to audiovisual content located on servers of third parties. We DO NOT host nor transmit any audiovisual content itself. Any responsibility for this content lies with those who host or transmit it.
            </p>
            <p className="text-xs text-muted-foreground text-center font-medium">
              © 2025 DAMITV - All rights reserved
            </p>
          </div>
        </div>
      </footer>
      
      <MobileBottomNav />
      <ScrollToTop />
    </div>
  );
};

export default PageLayout;
