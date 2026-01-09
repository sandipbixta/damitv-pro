import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Match } from '../types/sports';
import { getBohoImageUrl } from '../api/sportsApi';
import { generateMatchSlug, extractNumericId } from '../utils/matchSlug';
import { LiveViewerCount } from './LiveViewerCount';
import { isMatchLive } from '../utils/matchUtils';

interface PopularMatchCardProps {
  match: Match;
  rank: number;
  sportId?: string;
}

// TheSportsDB API key (free tier)
const SPORTSDB_API_KEY = '3';

// In-memory cache for banners
const bannerCache: { [key: string]: string | null } = {};

const PopularMatchCard: React.FC<PopularMatchCardProps> = ({ match, rank, sportId }) => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  
  const home = match.teams?.home?.name || '';
  const away = match.teams?.away?.name || '';
  const hasStream = match.sources?.length > 0;
  const isLive = isMatchLive(match);

  // Fetch banner from TheSportsDB if not provided by API
  useEffect(() => {
    const fetchBanner = async () => {
      // If API provides banner, use it
      if (match.banner) {
        setBannerUrl(getBohoImageUrl(match.banner));
        return;
      }

      // Check cache first
      const cacheKey = `${home}_${away}`.toLowerCase();
      if (cacheKey in bannerCache) {
        setBannerUrl(bannerCache[cacheKey]);
        return;
      }

      if (!home || !away) {
        setBannerUrl(null);
        return;
      }

      setBannerLoading(true);
      try {
        // Search for event banner
        const searchQuery = `${home}_vs_${away}`.replace(/\s+/g, '_');
        const response = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchevents.php?e=${encodeURIComponent(searchQuery)}`,
          { signal: AbortSignal.timeout(3000) }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.event && data.event.length > 0) {
            const event = data.event[0];
            const foundBanner = event.strBanner || event.strThumb || event.strFanart1;
            if (foundBanner) {
              bannerCache[cacheKey] = foundBanner;
              setBannerUrl(foundBanner);
              return;
            }
          }
        }

        // Fallback: search for home team banner/fanart
        const teamResponse = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(home)}`,
          { signal: AbortSignal.timeout(3000) }
        );

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          if (teamData.teams && teamData.teams.length > 0) {
            const team = teamData.teams[0];
            const teamBanner = team.strBanner || team.strFanart1 || team.strStadiumThumb;
            if (teamBanner) {
              bannerCache[cacheKey] = teamBanner;
              setBannerUrl(teamBanner);
              return;
            }
          }
        }

        // No banner found
        bannerCache[cacheKey] = null;
        setBannerUrl(null);
      } catch (err) {
        bannerCache[cacheKey] = null;
        setBannerUrl(null);
      } finally {
        setBannerLoading(false);
      }
    };

    fetchBanner();
  }, [match.banner, home, away]);

  // Generate thumbnail/poster fallback
  const getPosterUrl = () => {
    if (match.poster) {
      return getBohoImageUrl(match.poster);
    }
    return null;
  };

  const posterUrl = getPosterUrl();
  const displayImage = bannerUrl || posterUrl;

  const matchSlug = generateMatchSlug(home, away, match.title);
  const numericId = extractNumericId(match.id);
  const matchUrl = `/match/${sportId || match.sportId || match.category}/${numericId}/${matchSlug}`;

  const cardContent = (
    <div className="relative h-full group cursor-pointer">
      {/* Image container - use object-contain to show full image */}
      <div className="relative h-[220px] sm:h-[240px] rounded-lg overflow-hidden bg-card border border-border/40 transition-all duration-300 hover:border-primary/50 hover:scale-105">
        {displayImage && !bannerFailed ? (
          <img
            src={displayImage}
            alt={match.title}
            className="w-full h-full object-contain bg-black/50"
            loading="lazy"
            onError={() => setBannerFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
            <span className="text-muted-foreground font-bold text-lg tracking-widest">DAMITV</span>
          </div>
        )}

        {/* Gradient overlay - only at bottom for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/95 to-transparent" />

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* Content overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h4 className="text-white font-bold text-xs line-clamp-2">
            {home && away ? `${home} vs ${away}` : match.title}
          </h4>
          {isLive && (
            <div className="flex items-center gap-2 mt-1">
              <LiveViewerCount match={match} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (hasStream) {
    return (
      <Link to={matchUrl} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default PopularMatchCard;
