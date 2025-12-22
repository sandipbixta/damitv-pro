import React from 'react';
import { useNavigate } from 'react-router-dom';
import championsLeagueLogo from '@/assets/leagues/champions-league.png';
import premierLeagueLogo from '@/assets/leagues/premier-league.webp';
import laLigaLogo from '@/assets/leagues/laliga.png';
import serieALogo from '@/assets/leagues/serie-a.png';
import bundesligaLogo from '@/assets/leagues/bundesliga.png';
import ligue1Logo from '@/assets/leagues/ligue-1.png';
import mlsLogo from '@/assets/leagues/mls.png';

interface League {
  id: string;
  name: string;
  logo: string | null;
  sportKey: string;
}

const FEATURED_LEAGUES = [
  { name: 'UEFA Champions League', sportKey: 'soccer_uefa_champs_league', logo: championsLeagueLogo },
  { name: 'English Premier League', sportKey: 'soccer_epl', logo: premierLeagueLogo },
  { name: 'Spanish La Liga', sportKey: 'soccer_spain_la_liga', logo: laLigaLogo },
  { name: 'Italian Serie A', sportKey: 'soccer_italy_serie_a', logo: serieALogo },
  { name: 'German Bundesliga', sportKey: 'soccer_germany_bundesliga', logo: bundesligaLogo },
  { name: 'French Ligue 1', sportKey: 'soccer_france_ligue_one', logo: ligue1Logo },
  { name: 'Major League Soccer', sportKey: 'soccer_usa_mls', logo: mlsLogo },
];

const FeaturedLeagues: React.FC = () => {
  const navigate = useNavigate();

  const handleLeagueClick = (sportKey: string) => {
    navigate(`/league/${sportKey}`);
  };


  return (
    <div className="w-full overflow-hidden mb-8">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Featured Leagues</h2>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {FEATURED_LEAGUES.map((league) => (
          <button
            key={league.sportKey}
            onClick={() => handleLeagueClick(league.sportKey)}
            className="flex-shrink-0 w-28 h-28 bg-white rounded-xl border border-border hover:border-primary transition-all duration-200 hover:shadow-lg hover:scale-105 flex flex-col items-center justify-center p-2 gap-2 group"
            aria-label={`View ${league.name}`}
          >
            <div className="w-20 h-20 flex items-center justify-center p-2">
              <img
                src={league.logo}
                alt={`${league.name} logo`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <p className="text-xs font-semibold text-center text-foreground line-clamp-2">
              {league.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeaturedLeagues;
