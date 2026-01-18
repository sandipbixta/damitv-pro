import { Link } from 'react-router-dom';
import { Play, Calendar, Users, Tv, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSportsData } from '@/contexts/SportsDataContext';

const HeroSection = () => {
  const { allMatches } = useSportsData();
  
  const liveCount = allMatches.filter(m => m.sources && m.sources.length > 0).length;
  
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/20" />
      
      {/* Animated particles/grid effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,73,39,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,73,39,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-sm font-medium text-primary">{liveCount}+ Live Streams Now</span>
        </div>
        
        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Watch Any Sport.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-primary">
            Live. Free. HD.
          </span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Stream football, basketball, tennis, UFC & more from anywhere. 
          No signup required. Just click and watch.
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
            <Link to="/live">
              <Play className="mr-2 h-5 w-5" />
              Watch Live Now
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10">
            <Link to="/schedule">
              <Calendar className="mr-2 h-5 w-5" />
              Browse Schedule
            </Link>
          </Button>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Tv className="h-5 w-5" />
              <span className="text-2xl md:text-3xl font-bold">500+</span>
            </div>
            <p className="text-sm text-muted-foreground">Channels</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Users className="h-5 w-5" />
              <span className="text-2xl md:text-3xl font-bold">50K+</span>
            </div>
            <p className="text-sm text-muted-foreground">Daily Viewers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Zap className="h-5 w-5" />
              <span className="text-2xl md:text-3xl font-bold">HD</span>
            </div>
            <p className="text-sm text-muted-foreground">Quality Streams</p>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
