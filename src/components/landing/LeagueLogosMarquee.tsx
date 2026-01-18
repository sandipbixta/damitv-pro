import premierLeague from '@/assets/leagues/premier-league.webp';
import laLiga from '@/assets/leagues/laliga.png';
import bundesliga from '@/assets/leagues/bundesliga.png';
import serieA from '@/assets/leagues/serie-a.png';
import ligue1 from '@/assets/leagues/ligue-1.png';
import championsLeague from '@/assets/leagues/champions-league.png';
import mls from '@/assets/leagues/mls.png';

const leagues = [
  { name: 'Premier League', logo: premierLeague },
  { name: 'La Liga', logo: laLiga },
  { name: 'Bundesliga', logo: bundesliga },
  { name: 'Serie A', logo: serieA },
  { name: 'Ligue 1', logo: ligue1 },
  { name: 'Champions League', logo: championsLeague },
  { name: 'MLS', logo: mls },
];

const LeagueLogosMarquee = () => {
  return (
    <section className="py-12 overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4 mb-8">
        <p className="text-center text-muted-foreground text-sm uppercase tracking-wider">
          Watch Live From Top Leagues
        </p>
      </div>
      
      {/* Marquee container */}
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        
        {/* Scrolling content */}
        <div className="flex animate-marquee">
          {[...leagues, ...leagues, ...leagues].map((league, index) => (
            <div
              key={index}
              className="flex-shrink-0 mx-8 md:mx-12 flex items-center justify-center"
            >
              <img
                src={league.logo}
                alt={league.name}
                className="h-12 md:h-16 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LeagueLogosMarquee;
