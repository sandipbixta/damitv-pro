import React from "react";
import { ManualMatch } from "@/types/manualMatch";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { format } from 'date-fns';
import { ViewerCount } from './ViewerCount';

interface ManualMatchCardProps {
  match: ManualMatch;
}

const ManualMatchCard = ({ match }: ManualMatchCardProps) => {
  const navigate = useNavigate();

  const matchDate = new Date(match.date);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (date: Date) => {
    return format(date, 'MMM d');
  };

  const isLive = Date.now() >= matchDate.getTime();
  const hasStream = match.links?.length > 0;

  // Check if we have a valid image URL
  const hasValidImage = match.image && 
    match.image !== "https://imgur.com/undefined" && 
    match.image.trim() !== "";

  const generateThumbnail = () => {
    if (hasValidImage) {
      return (
        <img
          src={match.image}
          alt={match.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Fallback to team names display
            const container = e.currentTarget.parentElement;
            if (container) {
              container.innerHTML = `
                <div class="w-full h-full relative overflow-hidden bg-black">
                  <div class="absolute inset-0 flex items-center justify-center z-10">
                    <span class="text-white font-bold text-xl drop-shadow-lg text-center px-4">${match.teams.home} vs ${match.teams.away}</span>
                  </div>
                </div>
              `;
            }
          }}
        />
      );
    }

    return (
      <div className="w-full h-full relative overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-white font-bold text-xl drop-shadow-lg text-center px-4">
            {match.teams.home} vs {match.teams.away}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="group cursor-pointer"
      onClick={() => navigate(`/manual-match/${match.id}`)}
    >
      <div className="relative overflow-hidden rounded-lg border-2 border-white/5 bg-black transition-all duration-300 hover:border-primary">
        {/* Image Section */}
        <div className="relative aspect-video overflow-hidden bg-gray-900">
          {generateThumbnail()}
          
          {/* Simple Status Indicators */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
            {isLive ? (
              <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 tracking-wider">
                ● Live
              </span>
            ) : (
              <span className="bg-gray-800/90 text-white/60 text-[10px] font-bold uppercase px-2 py-1">
                Upcoming
              </span>
            )}
            
            {hasStream && (
              <span className="bg-black/80 text-white text-[10px] font-bold px-2 py-1">
                {match.links.length} HD
              </span>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-bold text-white text-sm line-clamp-2 min-h-[2.5rem]">
            {match.title}
          </h3>
          
          {/* Meta Info */}
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
            <span>{formatTime(matchDate)}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full" />
            <span>{formatDateShort(matchDate)}</span>
            {isLive && (
              <>
                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                <ViewerCount matchId={match.id} enableRealtime={true} />
              </>
            )}
          </div>
          
          {/* Action */}
          {hasStream && (
            <div className="pt-1">
              {isLive ? (
                <div className="bg-sports-primary text-white font-bold text-xs py-2 text-center uppercase tracking-wide hover:bg-sports-primary/90 transition-colors">
                  Watch Now
                </div>
              ) : (
                <div className="bg-gray-800 text-white border border-gray-700 font-bold text-xs py-2 text-center uppercase tracking-wide flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Starting Soon
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualMatchCard;
