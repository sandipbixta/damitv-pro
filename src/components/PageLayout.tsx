import React from 'react';
import { Link } from 'react-router-dom';
import MainNav from './MainNav';
import MobileBottomNav from './MobileBottomNav';
import ScrollToTop from './ScrollToTop';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchBar from './SearchBar';
import { Search } from 'lucide-react';

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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto py-3 px-4">
          <div className="flex flex-row justify-between items-center gap-4">
            {isMobile ? (
              <>
                <Link to="/" className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-foreground tracking-tight">
                    DAMI<span className="text-primary">TV</span>
                  </h1>
                </Link>
                <div className="flex items-center gap-2">
                  {onSearch && (
                    <div className="relative">
                      <SearchBar
                        value={searchTerm || ''}
                        onChange={onSearch}
                        placeholder="Search..."
                        className="w-32"
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

      <main className="container mx-auto py-4 px-4 pb-20 md:pb-8">
        {children}
      </main>
      
      {/* FanCode-style Footer */}
      <footer className="bg-card border-t border-border py-8 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <h4 className="text-lg font-bold text-foreground mb-3">
                DAMI<span className="text-primary">TV</span>
              </h4>
              <p className="text-sm text-muted-foreground">
                Your destination for live sports streaming.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">About</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Sports</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/live" className="hover:text-foreground transition-colors">Football</Link></li>
                <li><Link to="/live" className="hover:text-foreground transition-colors">Basketball</Link></li>
                <li><Link to="/live" className="hover:text-foreground transition-colors">Tennis</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Legal</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/dmca" className="hover:text-foreground transition-colors">DMCA</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="border-t border-border pt-6">
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              <span className="font-semibold">Disclaimer:</span> Our platform merely displays links to audiovisual content located on servers of third parties. We DO NOT host nor transmit any audiovisual content itself. Any responsibility for this content lies with those who host or transmit it.
            </p>
            <p className="text-xs text-muted-foreground text-center">
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
