import { LiveMatch } from '@/hooks/useSportsDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, MapPin, Clock } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface HeroCarouselDashboardProps {
  matches: LiveMatch[];
  loading: boolean;
}

export function HeroCarouselDashboard({ matches, loading }: HeroCarouselDashboardProps) {
  if (loading && matches.length === 0) {
    return (
      <div className="w-full">
        <Carousel className="w-full">
          <CarouselContent>
            {[1, 2, 3].map((i) => (
              <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-muted to-muted/50 border-muted">
        <CardContent className="p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No live matches at the moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2 md:-ml-4">
        {matches.slice(0, 5).map((match, index) => {
          const isLive = match.status === 'LIVE' || match.status.toLowerCase().includes('live');
          
          return (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className={`h-full transition-all duration-300 hover:scale-[1.02] ${
                isLive 
                  ? 'bg-gradient-to-br from-destructive/20 via-background to-destructive/10 border-destructive/40 shadow-lg shadow-destructive/20' 
                  : 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="text-xs">
                      {match.comp}
                    </Badge>
                    <Badge 
                      variant={isLive ? 'destructive' : 'secondary'}
                      className={isLive ? 'animate-pulse' : ''}
                    >
                      {match.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">
                    {match.match}
                  </h3>
                  
                  <div className="text-2xl font-bold text-primary mb-4">
                    {match.score || 'vs'}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {match.time}
                    </span>
                    {match.venue && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{match.venue}</span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex -left-4" />
      <CarouselNext className="hidden md:flex -right-4" />
    </Carousel>
  );
}
