import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { ChevronRight, CheckCircle2, CalendarDays, Star, Timer, Lock } from 'lucide-react';
import { parseMatchTime, getMatchStatusByServerTime, getTimeRemaining, MatchTimeStatus } from '../services/timeService';

export type MatchStatus = MatchTimeStatus;

interface Props {
  match: Match;
  status: MatchStatus; // Passed from parent, but we also calculate internally for the timer
  onClick: (match: Match) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

const MatchCard: React.FC<Props> = ({ match, onClick, isFavorite, onToggleFavorite }) => {
  // Internal strict time handling
  const [calculatedStatus, setCalculatedStatus] = useState<MatchTimeStatus>('UPCOMING');
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const matchDate = parseMatchTime(match.date, match.time);

  // Timer Tick
  useEffect(() => {
      const tick = () => {
          // DETECTION INTELLIGENTE DU LIVE VIA LE FORMAT STRING
          // Si le texte contient des parenthèses ou 'MT' ou 'HT' avec un score probable, c'est du LIVE
          // ex: "1-0 (24')", "2-1 (Live)", "0-0 (MT)"
          const timeStr = match.time.toLowerCase();
          const isLiveString = timeStr.includes('(') || timeStr.includes("'") || timeStr.includes('mt') || timeStr.includes('ht') || timeStr.includes('live');
          
          if (isLiveString && !timeStr.includes('ft') && !timeStr.includes('fin')) {
             setCalculatedStatus('LIVE');
             setTimeLeft('');
          } else {
             const status = getMatchStatusByServerTime(matchDate);
             setCalculatedStatus(status);
             if (status === 'UPCOMING') {
                  setTimeLeft(getTimeRemaining(matchDate));
             } else {
                  setTimeLeft('');
             }
          }
      };
      
      tick(); // Init
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
  }, [matchDate, match.time]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(match.id);
  };

  const getStatusBadge = () => {
    switch (calculatedStatus) {
      case 'LIVE':
        return (
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] md:text-xs font-bold animate-pulse border border-emerald-500/30">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full"></div>
            LIVE
          </div>
        );
      case 'FINISHED':
        return (
          <div className="flex items-center gap-1.5 bg-slate-700 text-slate-400 px-2 py-1 rounded text-[10px] md:text-xs font-semibold border border-slate-600">
            <CheckCircle2 size={12} />
            FIN
          </div>
        );
      default:
        // Upcoming: Show Countdown
        return (
          <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-[10px] md:text-xs font-mono font-medium border border-blue-500/20">
            <Timer size={12} />
            {timeLeft || match.time}
          </div>
        );
    }
  };

  const formatDisplayDate = (dateStr: string) => {
      try {
          if (dateStr.toLowerCase().includes('aujourd')) return 'Auj.';
          if (dateStr.toLowerCase().includes('demain')) return 'Dem.';
          if (dateStr.toLowerCase().includes('hier')) return 'Hier';
          
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return dateStr;

          // Format: 12 Oct
          return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
      } catch (e) {
          return dateStr;
      }
  };

  // Helper pour extraire le score et la minute proprement si c'est du live
  const getScoreDisplay = () => {
      if (calculatedStatus === 'LIVE') {
          // Si le format est "1-0 (24')", on affiche "1-0" en gros et "24'" en badge
          const matchTime = match.time;
          const parenIndex = matchTime.indexOf('(');
          if (parenIndex > -1) {
              const score = matchTime.substring(0, parenIndex).trim();
              const minute = matchTime.substring(parenIndex).replace('(', '').replace(')', '').trim();
              return { score, minute };
          }
      }
      return { score: match.time, minute: null };
  };

  const { score, minute } = getScoreDisplay();

  return (
    <div 
      onClick={() => onClick(match)}
      className={`group bg-slate-800 border rounded-xl p-4 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full min-h-[140px]
        ${calculatedStatus === 'LIVE' ? 'border-emerald-500/50 shadow-lg shadow-emerald-900/10' : 'border-slate-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/20'}
        ${calculatedStatus === 'FINISHED' ? 'opacity-75 grayscale-[0.3]' : ''}
      `}
    >
      {/* Header: League & Status */}
      <div className="flex justify-between items-start mb-4 border-b border-slate-700/50 pb-2">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[60%] bg-slate-900/50 px-2 py-1 rounded">
            {match.league}
         </span>
         <div className="flex items-center gap-2">
            {getStatusBadge()}
            <button 
                onClick={handleFavoriteClick}
                className={`p-1 rounded-full transition-colors ${isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-slate-400'}`}
            >
                <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>
         </div>
      </div>

      <div className="flex flex-col flex-1 justify-center py-2">
        {/* Teams Row - Pure Text Layout */}
        <div className="flex w-full items-center justify-between gap-2">
          
          {/* Home */}
          <div className="flex-1 text-right">
             <span className="block font-bold text-sm md:text-base leading-tight text-slate-200">
                {match.homeTeam.name}
            </span>
          </div>

          {/* VS / Score / Time */}
          <div className="flex flex-col items-center justify-center min-w-[60px] px-2">
                {calculatedStatus === 'LIVE' ? (
                     <div className="flex flex-col items-center">
                        <span className="text-xl md:text-2xl font-black text-white tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                           {score}
                        </span>
                        {minute && (
                            <span className="text-[10px] font-mono text-emerald-300 mt-1 animate-pulse">
                                {minute}
                            </span>
                        )}
                     </div>
                ) : calculatedStatus === 'FINISHED' ? (
                     <span className="text-xl md:text-2xl font-black text-white tracking-widest bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                        {match.time.includes('-') ? match.time.split('(')[0] : 'FT'}
                     </span>
                ) : (
                    <div className="flex flex-col items-center">
                        <span className="text-xl md:text-2xl font-black text-white tracking-tight">{match.time}</span>
                    </div>
                )}
          </div>

          {/* Away */}
          <div className="flex-1 text-left">
             <span className="block font-bold text-sm md:text-base leading-tight text-slate-200">
                {match.awayTeam.name}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex justify-center mt-3">
            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 uppercase tracking-wide">
               <CalendarDays size={10} />
               {formatDisplayDate(match.date)}
            </span>
      </div>
      
      {/* Hover Action Hint */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {calculatedStatus !== 'FINISHED' && <ChevronRight size={16} className="text-emerald-500" />}
      </div>
    </div>
  );
};

export default MatchCard;