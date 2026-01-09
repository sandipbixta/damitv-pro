import { useEffect, useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from 'react-router-dom';
import { Match } from '@/types/sports';
import { getBohoImageUrl } from '@/api/sportsApi';
import { getCarouselMatches, isHotMatch, formatViewerCount } from '@/utils/heroCarouselFilter';
import { isMatchLive } from '@/utils/matchUtils';
import { ViewerCount } from './ViewerCount';
import { Clock, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import coverPhoto from '@/assets/damitv-cover.jpeg';
import { useSportsData } from '@/contexts/SportsDataContext';

export const HeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      duration: 30
    },
    [Autoplay({ delay: 6000, stopOnInteraction: false })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [carouselMatches, setCarouselMatches] = useState<Match[]>([]);
  
  // Use shared sports data context instead of fetching independently
  const { allMatches, loading } = useSportsData();
  
  // Static cover photo slide
  const coverSlide = {
    id: 'damitv-cover',
    title: 'DamiTV - Your Home for Live Sports',
    category: 'Featured',
    poster: coverPhoto,
    isCover: true
  };
  
  // Helper to convert relative poster URL to absolute
  const getAbsolutePosterUrl = (posterPath: string) => {
    return getBohoImageUrl(posterPath);
  };
  
  // Filter elite matches when allMatches changes (from context)
  useEffect(() => {
    const loadEliteMatches = async () => {
      if (allMatches.length === 0) return;
      
      try {
        // Get elite matches with viewer counts (filtered and sorted by importance)
        const topMatches = await getCarouselMatches(allMatches, 8);
        setCarouselMatches(topMatches);
        console.log(`🎬 Hero Carousel: ${topMatches.length} elite matches from context`);
      } catch (error) {
        console.error('Error filtering hero carousel matches:', error);
      }
    };

    loadEliteMatches();
  }, [allMatches]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Show loading state
  if (loading) {
    return (
      <div className="relative mb-6 rounded-xl overflow-hidden">
        <div className="relative min-h-[200px] sm:min-h-[280px] md:min-h-[350px] bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center animate-pulse">
          <div className="text-muted-foreground text-sm">Loading elite matches...</div>
        </div>
      </div>
    );
  }

  // Combine cover slide with elite match slides
  const allSlides = [coverSlide as any, ...carouselMatches];

  if (allSlides.length === 0) return null;

  return (
    <div className="relative rounded-xl overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {allSlides.map((slide) => {
          const isCover = (slide as any).isCover;
          const posterUrl = isCover ? slide.poster : getAbsolutePosterUrl(slide.poster || '');
          
          return isCover ? (
            // Cover photo slide - not clickable
            <div
              key={slide.id}
              className="relative flex-[0_0_100%] min-w-0"
            >
              <div className="relative min-h-[200px] sm:min-h-[280px] md:min-h-[350px] flex items-center overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${posterUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/20" />
                
                {/* SEO-optimized header text - positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
                  <h2 className="text-[10px] sm:text-xs md:text-sm font-medium text-white/95 mb-0.5 sm:mb-1 drop-shadow-lg leading-tight">
                    Watch Live Sports Streaming Free - Champions League, Premier League, La Liga & More
                  </h2>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-white/75 drop-shadow-md leading-tight">
                    Free HD sports streaming for football, basketball, tennis and all major leagues worldwide
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Match slides - clickable
            <Link
              key={slide.id}
              to={`/match/${slide.category}/${slide.id}`}
              className="relative flex-[0_0_100%] min-w-0 cursor-pointer group"
            >
              <div className="relative min-h-[200px] sm:min-h-[280px] md:min-h-[350px] flex items-center overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${posterUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 via-40% to-black/20" />
                <div className="relative z-10 p-3 sm:p-5 md:p-8 max-w-xl">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                    <div className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 bg-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full">
                      {isMatchLive(slide) ? 'LIVE NOW' : 'UPCOMING'}
                    </div>
                    
                    {/* HOT Badge for high-viewer matches (500+) */}
                    {isHotMatch(slide) && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full animate-pulse">
                        🔥 HOT
                      </div>
                    )}
                    
                    {/* Viewer Count Badge */}
                    {slide.viewerCount && slide.viewerCount > 0 && (
                      <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] sm:text-xs font-semibold animate-fade-in">
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {formatViewerCount(slide.viewerCount)} watching
                      </div>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-tight group-hover:text-primary transition-colors drop-shadow-2xl">
                    {slide.title}
                  </h2>
                  <div className="space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-3 md:mb-4">
                    {slide.date && (
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-white/90">
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium">
                            {format(new Date(slide.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium">
                            {format(new Date(slide.date), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-white drop-shadow-xl">
                    {slide.category && (
                      <span className="uppercase font-semibold">{slide.category}</span>
                    )}
                    {slide.teams?.home?.name && slide.teams?.away?.name && (
                      <span className="block mt-1 sm:mt-1.5 md:mt-2 text-[9px] sm:text-[10px] md:text-xs opacity-95">
                        {slide.teams.home.name} vs {slide.teams.away.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dots Navigation */}
      {allSlides.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-3 sm:left-5 md:left-8 flex gap-1 sm:gap-1.5 md:gap-2 z-20">
          {allSlides.map((_, index) => (
            <button
              key={index}
              className={`h-0.5 sm:h-1 rounded-full transition-all ${
                index === selectedIndex
                  ? 'bg-white w-6 sm:w-7 md:w-8'
                  : 'bg-white/50 hover:bg-white/75 w-6 sm:w-7 md:w-8'
              }`}
              onClick={(e) => {
                e.preventDefault();
                emblaApi?.scrollTo(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
