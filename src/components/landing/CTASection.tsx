import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,73,39,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(245,73,39,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      {/* Glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Watch?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10">
            Don't miss another moment. Start streaming your favorite sports now – it's completely free!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Link to="/live">
                <Play className="mr-2 h-5 w-5" />
                Start Watching Free
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-lg px-8 py-6 hover:bg-white/10">
              <Link to="/channels">
                Browse All Channels
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <p className="mt-8 text-sm text-muted-foreground">
            No registration required • Works on all devices • 24/7 support on Telegram
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
