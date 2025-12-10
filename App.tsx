import React, { useState, useEffect, useMemo } from 'react';
import { AppView, Match, PredictionResult } from './types';
import { FALLBACK_MATCHES, LEAGUES } from './constants';
// CHANGEMENT: Utilisation exclusive de Gemini 3
import { fetchUpcomingMatches } from './services/geminiService';
import { getServerTime, parseMatchTime, getMatchStatusByServerTime, getDayLabel } from './services/timeService';
import MatchCard from './components/MatchCard';
import AnalysisView from './components/AnalysisView';
import MyBetsView from './components/MyBetsView';
import NewsView from './components/NewsView';
import ComboView from './components/ComboView';
import ResultsView from './components/ResultsView';
import ChatAssistant from './components/ChatAssistant';
import LandingView from './components/LandingView';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { LayoutDashboard, Activity, RefreshCw, Trophy, Star, Wallet, Table2, Newspaper, BarChart2, Layers, Clock, Home, ClipboardCheck, Sparkles, Database, MessageSquare, Search, CalendarDays } from 'lucide-react';

const App: React.FC = () => {
  // CHANGEMENT: LANDING est la vue par défaut
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // Filters
  const [selectedLeague, setSelectedLeague] = useState<string>('Tout');
  const [dayFilter, setDayFilter] = useState<'YESTERDAY' | 'TODAY' | 'TOMORROW' | 'ALL'>('ALL'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  // Persistence State
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  // AI History State
  const [aiHistory, setAiHistory] = useState<PredictionResult[]>(() => {
      const saved = localStorage.getItem('aiHistory');
      return saved ? JSON.parse(saved) : [];
  });
  
  // Dynamic match handling
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  
  // SERVER TIME SYNC
  const [serverTimeTick, setServerTimeTick] = useState(getServerTime());

  // Heartbeat & Initial Load
  useEffect(() => {
    // Si on est sur la landing page, on précharge quand même les données pour que ce soit rapide après
    const initData = async () => {
      setMatchesLoading(true);
      try {
         const realMatches = await fetchUpcomingMatches(false);

         if (realMatches && realMatches.length > 0) {
            setMatches(realMatches);
         } else {
            setMatches(FALLBACK_MATCHES);
         }
      } catch (e) {
          console.error("Error parallel loading:", e);
          setMatches(FALLBACK_MATCHES);
      } finally {
          setMatchesLoading(false);
      }
    };

    initData();

    const timer = setInterval(() => {
        setServerTimeTick(getServerTime());
    }, 1000); 
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('aiHistory', JSON.stringify(aiHistory)); }, [aiHistory]);

  const refreshMatches = async (force: boolean = false) => {
    setMatchesLoading(true);
    try {
      const realMatches = await fetchUpcomingMatches(force);
      if (realMatches && realMatches.length > 0) {
        setMatches(realMatches);
      } else {
        setMatches(FALLBACK_MATCHES);
      }
    } catch (e) {
      console.error("Failed to load matches", e);
      setMatches(FALLBACK_MATCHES);
    } finally {
      setMatchesLoading(false);
    }
  };

  const toggleFavorite = (id: string) => {
      setFavorites(prev => 
        prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      );
  };

  const saveAiPrediction = (prediction: PredictionResult) => {
      setAiHistory(prev => {
          // Avoid duplicates based on matchId, keep the latest analysis
          const filtered = prev.filter(p => p.matchId !== prediction.matchId);
          return [prediction, ...filtered];
      });
  };

  const clearHistory = () => {
      if(window.confirm("Voulez-vous vraiment effacer l'historique des prédictions ?")) {
          setAiHistory([]);
      }
  };

  const leagueFilteredMatches = useMemo(() => {
     let filtered = matches;
     
     // 1. Filter by League
     if (selectedLeague === 'Favoris') {
         filtered = filtered.filter(m => favorites.includes(m.id));
     } else if (selectedLeague !== 'Tout') {
         filtered = filtered.filter(m => m.league === selectedLeague);
     }
     
     // 2. Filter by Search Query
     if (searchQuery.trim()) {
         const q = searchQuery.toLowerCase();
         filtered = filtered.filter(m => 
             m.homeTeam.name.toLowerCase().includes(q) || 
             m.awayTeam.name.toLowerCase().includes(q) ||
             m.league.toLowerCase().includes(q)
         );
     }

     return filtered;
  }, [matches, selectedLeague, favorites, searchQuery]);

  const sortedMatches = useMemo(() => {
    // 3. Filter by Date (and Sort)
    if (dayFilter === 'ALL') {
         return [...leagueFilteredMatches].sort((a, b) => {
            if (a.time.includes('-') && !b.time.includes('-')) return 1;
            if (!a.time.includes('-') && b.time.includes('-')) return -1;
            return 0;
        });
    }

    const dayFiltered = leagueFilteredMatches.filter(m => {
        const mDate = parseMatchTime(m.date, m.time);
        return getDayLabel(mDate) === dayFilter;
    });

    return [...dayFiltered].sort((a, b) => {
        const timeA = parseMatchTime(a.date, a.time).getTime();
        const timeB = parseMatchTime(b.date, b.time).getTime();
        return timeA - timeB;
    });
  }, [leagueFilteredMatches, dayFilter]);

  const availableLeagues = useMemo(() => {
      const matchLeagues = Array.from(new Set(matches.map(m => m.league)));
      const combined = Array.from(new Set([...LEAGUES, ...matchLeagues]));
      return ['Tout', 'Favoris', ...combined];
  }, [matches]);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setCurrentView(AppView.ANALYSIS);
  };

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setSelectedMatch(null);
    setShowChat(false);
  };

  // Rendu conditionnel pour la Landing Page
  if (currentView === AppView.LANDING) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        <PWAInstallPrompt />
        <LandingView onEnter={() => setCurrentView(AppView.DASHBOARD)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* PWA Prompts */}
      <PWAInstallPrompt />

      {/* Navigation Bar (Desktop) - Hidden on Landing */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNav(AppView.DASHBOARD)}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Pronos<span className="text-indigo-500">IA</span></span>
            </div>
            
            <div className="flex items-center">
              <div className="ml-8 flex items-baseline space-x-1 xl:space-x-2">
                <button onClick={() => handleNav(AppView.DASHBOARD)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.DASHBOARD && !selectedMatch ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-2"><LayoutDashboard size={18} /> Accueil</div>
                </button>
                 <button onClick={() => handleNav(AppView.COMBO)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.COMBO ? 'bg-slate-800 text-purple-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-2"><Layers size={18} /> Combinés</div>
                </button>
                 <button onClick={() => handleNav(AppView.RESULTS)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.RESULTS ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-2"><ClipboardCheck size={18} /> Résultats</div>
                </button>
                <button onClick={() => handleNav(AppView.HISTORY)} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.HISTORY ? 'bg-slate-800 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-2"><Trophy size={18} /> Historique</div>
                </button>
              </div>
              <div className="ml-6 flex items-center gap-3">
                   <div className="hidden xl:flex items-center text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800" title="Heure Serveur (UTC)">
                       <Clock size={12} className="mr-1" />
                       {serverTimeTick.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                   </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 h-14 flex items-center justify-between">
           <div className="flex items-center space-x-2" onClick={() => handleNav(AppView.DASHBOARD)}>
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={16} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Pronos<span className="text-indigo-500">IA</span></span>
            </div>
            <div className="flex items-center text-xs text-slate-400">
                <Clock size={14} className="mr-1" />
                {serverTimeTick.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full pb-24 md:pb-8 relative">
        {currentView === AppView.DASHBOARD && !selectedMatch && (
          <div className="animate-fade-in">
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    Matchs du Jour 
                    <Activity size={20} className="text-indigo-500" />
                  </h1>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    {matchesLoading 
                        ? <span className="flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> Recherche en cours...</span> 
                        : `${leagueFilteredMatches.length} matchs détectés`}
                  </p>
               </div>
               
               {/* BARRE DE RECHERCHE DYNAMIQUE */}
               <div className="w-full md:w-auto flex items-center gap-2">
                   <div className="relative w-full md:w-64">
                       <input 
                           type="text" 
                           placeholder="Chercher équipe..." 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                       />
                       <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                   </div>
                   
                   <button 
                      onClick={() => refreshMatches(true)} 
                      disabled={matchesLoading}
                      className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors disabled:opacity-50 border border-slate-700 shrink-0"
                      title="Forcer l'actualisation"
                   >
                     <RefreshCw size={20} className={matchesLoading ? "animate-spin" : ""} />
                   </button>
               </div>
            </div>

            {/* SELECTEUR DE DATE AMÉLIORÉ */}
            <div className="flex justify-center mb-6">
                <div className="bg-slate-800 p-1.5 rounded-xl flex items-center border border-slate-700 shadow-lg">
                    <button 
                        onClick={() => setDayFilter('ALL')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${dayFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        <CalendarDays size={14} /> Tous
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <button 
                        onClick={() => setDayFilter('YESTERDAY')}
                        className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${dayFilter === 'YESTERDAY' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        Hier
                    </button>
                    <button 
                        onClick={() => setDayFilter('TODAY')}
                        className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${dayFilter === 'TODAY' ? 'bg-purple-600 text-white shadow-md shadow-purple-900/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Auj.
                    </button>
                    <button 
                        onClick={() => setDayFilter('TOMORROW')}
                        className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${dayFilter === 'TOMORROW' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Dem.
                    </button>
                </div>
            </div>

            {/* LEAGUE FILTER */}
            <div className="mb-6">
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mask-gradient">
                    {availableLeagues.map((league) => (
                        <button
                            key={league}
                            onClick={() => setSelectedLeague(league)}
                            className={`
                                whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2
                                ${selectedLeague === league 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}
                            `}
                        >
                            {league === 'Favoris' && <Star size={14} fill="currentColor" />}
                            {league === 'Tout' ? '🌍 Tout' : league}
                        </button>
                    ))}
                </div>
            </div>
            
            {matchesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                 {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-slate-800 h-40 rounded-xl border border-slate-700 animate-pulse flex flex-col justify-center items-center">
                        <div className="w-12 h-12 bg-slate-700 rounded-full mb-3"></div>
                        <div className="w-3/4 h-4 bg-slate-700 rounded"></div>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {sortedMatches.length > 0 ? (
                    sortedMatches.map(match => (
                    <MatchCard 
                        key={match.id} 
                        match={match} 
                        status={getMatchStatusByServerTime(parseMatchTime(match.date, match.time))}
                        onClick={handleMatchClick} 
                        isFavorite={favorites.includes(match.id)}
                        onToggleFavorite={toggleFavorite}
                    />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center">
                        <Database size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-lg">Aucun match trouvé.</p>
                        <p className="text-sm">Modifiez vos filtres ou lancez une actualisation.</p>
                        {searchQuery && <p className="text-xs mt-2 text-indigo-400">Filtre actif : "{searchQuery}"</p>}
                    </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === AppView.ANALYSIS && selectedMatch && (
          <AnalysisView 
            match={selectedMatch} 
            onBack={() => {
                setSelectedMatch(null);
                setCurrentView(AppView.DASHBOARD);
            }} 
            onPredictionLoaded={saveAiPrediction}
          />
        )}
        
        {currentView === AppView.HISTORY && (
            <MyBetsView 
                aiHistory={aiHistory}
                matches={matches} 
                onClearHistory={clearHistory} 
            />
        )}

        {currentView === AppView.NEWS && <NewsView />}
        {currentView === AppView.COMBO && <ComboView />}
        {currentView === AppView.RESULTS && <ResultsView />}

        {/* Floating Chat Button (Only on Dashboard if no match selected) */}
        {currentView === AppView.DASHBOARD && !selectedMatch && !showChat && (
            <button 
                onClick={() => setShowChat(true)}
                className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 transition-transform hover:scale-105 z-40"
            >
                <MessageSquare size={24} className="text-white" />
            </button>
        )}

        {/* Floating Chat Window */}
        {showChat && (
            <div className="fixed inset-0 md:inset-auto md:bottom-8 md:right-8 md:w-[400px] md:h-[600px] z-50 animate-fade-in flex flex-col">
                <div className="relative flex-1 md:flex-none h-full md:h-full">
                    <ChatAssistant />
                    <button 
                        onClick={() => setShowChat(false)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white p-2"
                    >
                        ✕
                    </button>
                </div>
            </div>
        )}

      </main>

      <div className="md:hidden fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50">
          <div className="flex justify-around items-center h-16">
              <button onClick={() => handleNav(AppView.DASHBOARD)} className={`flex flex-col items-center justify-center w-full h-full ${currentView === AppView.DASHBOARD ? 'text-indigo-400' : 'text-slate-500'}`}>
                  <Home size={22} className={currentView === AppView.DASHBOARD ? 'fill-indigo-400/20' : ''} />
                  <span className="text-[10px] mt-1 font-medium">Accueil</span>
              </button>
              <button onClick={() => handleNav(AppView.COMBO)} className={`flex flex-col items-center justify-center w-full h-full ${currentView === AppView.COMBO ? 'text-purple-400' : 'text-slate-500'}`}>
                  <Layers size={22} className={currentView === AppView.COMBO ? 'fill-purple-400/20' : ''} />
                  <span className="text-[10px] mt-1 font-medium">Combinés</span>
              </button>
              <button onClick={() => handleNav(AppView.RESULTS)} className={`flex flex-col items-center justify-center w-full h-full ${currentView === AppView.RESULTS ? 'text-indigo-400' : 'text-slate-500'}`}>
                  <ClipboardCheck size={22} />
                  <span className="text-[10px] mt-1 font-medium">Résultats</span>
              </button>
              <button onClick={() => handleNav(AppView.HISTORY)} className={`flex flex-col items-center justify-center w-full h-full ${currentView === AppView.HISTORY ? 'text-indigo-400' : 'text-slate-500'}`}>
                  <Trophy size={22} />
                  <span className="text-[10px] mt-1 font-medium">Historique</span>
              </button>
          </div>
      </div>
    </div>
  );
};

export default App;