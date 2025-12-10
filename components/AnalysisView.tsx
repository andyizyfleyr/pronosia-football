import React, { useEffect, useState } from 'react';
import { Match, PredictionResult, GroundingSource } from '../types';
// CHANGEMENT: Utilisation de Gemini 3
import { generatePrediction, fetchWebConsensus } from '../services/geminiService';
import ProbabilityChart from './ProbabilityChart';
import { ArrowLeft,  AlertTriangle, CheckCircle2, RefreshCw, Target, ShieldCheck, Activity, Globe, ExternalLink, Sparkles, History, MinusCircle, Info, TrendingUp } from 'lucide-react';

interface Props {
  match: Match;
  onBack: () => void;
  onPredictionLoaded?: (prediction: PredictionResult) => void;
}

const StatBar: React.FC<{ label: string, homeValue: number, awayValue: number }> = ({ label, homeValue, awayValue }) => {
    // Protection division par zéro
    const safeHome = homeValue || 0;
    const safeAway = awayValue || 0;
    const total = safeHome + safeAway || 1;
    
    const homePercent = (safeHome / total) * 100;
    const awayPercent = (safeAway / total) * 100;

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">
                <span>{safeHome}</span>
                <span>{label}</span>
                <span>{safeAway}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-700">
                <div style={{ width: `${homePercent}%` }} className="bg-emerald-500"></div>
                <div style={{ width: `${awayPercent}%` }} className="bg-blue-500"></div>
            </div>
        </div>
    );
};

const Form10Bar: React.FC<{ form: string[] }> = ({ form }) => {
    if (!form || form.length === 0) return <span className="text-xs text-slate-500">Non dispo</span>;

    return (
        <div className="flex gap-1">
            {form.map((res, i) => {
                let color = "bg-slate-700";
                if (res === 'W') color = "bg-emerald-500";
                else if (res === 'D') color = "bg-yellow-500";
                else if (res === 'L') color = "bg-red-500";
                
                return (
                    <div 
                        key={i} 
                        className={`w-2 h-6 md:w-3 md:h-8 rounded-sm ${color} transition-all hover:scale-110`} 
                        title={res === 'W' ? 'Victoire' : res === 'D' ? 'Nul' : 'Défaite'}
                    />
                );
            })}
        </div>
    );
};

const OddsDisplay: React.FC<{ odds: PredictionResult['odds'] }> = ({ odds }) => {
    if (!odds || (odds.home === 0 && odds.draw === 0)) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center text-slate-500 h-full flex flex-col justify-center">
                <Info size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Cotes non disponibles.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
                <Info size={20} className="text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">Cotes Bookmakers (Moyennes)</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-900 border border-slate-700">
                    <span className="text-xs font-bold text-slate-400">1</span>
                    <span className="text-xl font-black text-white">{odds?.home || '-'}</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-900 border border-slate-700">
                    <span className="text-xs font-bold text-slate-400">N</span>
                    <span className="text-xl font-black text-white">{odds?.draw || '-'}</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-slate-900 border border-slate-700">
                    <span className="text-xs font-bold text-slate-400">2</span>
                    <span className="text-xl font-black text-white">{odds?.away || '-'}</span>
                </div>
            </div>
        </div>
    );
};

const AnalysisView: React.FC<Props> = ({ match, onBack, onPredictionLoaded }) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Web Consensus State
  const [webAnalysis, setWebAnalysis] = useState<{ summary: string, consensus: string, sources: GroundingSource[] } | null>(null);
  const [loadingWeb, setLoadingWeb] = useState(false);

  const fetchAnalysis = async (force: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generatePrediction(match, force);
      setPrediction(data);
      if (onPredictionLoaded) {
          onPredictionLoaded(data);
      }
    } catch (err) {
      setError("Erreur lors de l'analyse IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanWeb = async () => {
      setLoadingWeb(true);
      const data = await fetchWebConsensus(match.homeTeam.name, match.awayTeam.name);
      setWebAnalysis(data);
      setLoadingWeb(false);
  };

  useEffect(() => {
    fetchAnalysis(false);
    setWebAnalysis(null); // Reset web analysis on match change
  }, [match.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={24} className="text-emerald-400 animate-pulse" />
            </div>
        </div>
        <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Analyse Gemini 3 en cours...</h3>
            <p className="text-slate-400">Recherche : Forme 10 Matchs, Cotes & Live Stats.</p>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertTriangle size={48} className="text-red-500" />
        <p className="text-red-400 text-lg">{error}</p>
        <button onClick={() => fetchAnalysis(true)} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg text-white hover:bg-slate-700">
            <RefreshCw size={16} /> Réessayer
        </button>
        <button onClick={onBack} className="text-slate-400 hover:text-white underline">Retour</button>
      </div>
    );
  }

  const confidenceColor = 
    prediction.confidence === 'Élevé' ? 'bg-emerald-500 text-white' :
    prediction.confidence === 'Moyen' ? 'bg-yellow-500 text-black' :
    'bg-red-500 text-white';

  return (
    <div className="space-y-6 pb-20 animate-slide-up">
      <div className="flex items-center space-x-4 mb-2">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <ArrowLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-white leading-tight line-clamp-2">
                {match.homeTeam.name} vs {match.awayTeam.name}
            </h2>
            <div className="flex items-center gap-3 text-sm mt-1">
              <span className="text-emerald-400 font-medium whitespace-nowrap">{match.league}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 whitespace-nowrap">{match.date}</span>
            </div>
        </div>
        <button 
           onClick={() => fetchAnalysis(true)} 
           className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500 transition-all shrink-0"
           title="Relancer l'analyse"
        >
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/50 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-emerald-900/10 pt-12">
                     <div className="absolute top-0 left-0 right-0 p-3 flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg ${confidenceColor}`}>
                            Confiance {prediction.confidence}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3 text-emerald-400 mt-2">
                        <Target size={24} />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Pronostic Algo</h3>
                    </div>
                    <div className="text-2xl font-black text-white mb-2">
                        {prediction.mainBet}
                    </div>
                    <div className="text-slate-400 text-sm">
                        Score probable : <span className="text-white font-bold">{prediction.scorePrediction}</span>
                    </div>
                </div>

                <OddsDisplay odds={prediction.odds} />
            </div>

            {/* FORM ANALYSIS 10 MATCHES */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                     <TrendingUp size={20} className="text-blue-400" />
                     <h3 className="text-lg font-semibold text-white">Forme (10 derniers matchs)</h3>
                </div>
                
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="w-24 text-sm font-bold text-white truncate text-right">{match.homeTeam.shortName}</div>
                        <Form10Bar form={prediction.homeLast10 || prediction.homeForm || []} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="w-24 text-sm font-bold text-white truncate text-right">{match.awayTeam.shortName}</div>
                        <Form10Bar form={prediction.awayLast10 || prediction.awayForm || []} />
                    </div>
                </div>
                <div className="mt-4 flex justify-end gap-4 text-[10px] text-slate-500 font-medium">
                     <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Victoire</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-sm"></div> Nul</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-sm"></div> Défaite</span>
                </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                     <Sparkles size={20} className="text-purple-400" />
                     <h3 className="text-lg font-semibold text-white">Analyse Générative</h3>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300 text-justify leading-relaxed p-4 bg-slate-900/30 rounded-xl border border-slate-700/30">
                    {prediction.summary}
                </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                 <h3 className="text-lg font-semibold text-white mb-4">Facteurs Clés</h3>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {prediction.keyFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start space-x-3 p-3 bg-slate-900/50 rounded-lg">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-300">{factor}</span>
                        </li>
                    ))}
                 </ul>
            </div>
            
            {/* 
               AFFICHAGE DES VRAIES STATS RECHERCHÉES PAR GEMINI
            */}
            {prediction.homeStats && prediction.awayStats && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                         <Activity size={20} className="text-blue-400" />
                         <h3 className="text-lg font-semibold text-white">Moyennes Saison (Données Web)</h3>
                    </div>
                    {prediction.homeStats.shotsOnTarget > 0 && (
                        <StatBar label="Buts Marqués / Match" homeValue={prediction.homeStats.shotsOnTarget} awayValue={prediction.awayStats.shotsOnTarget} />
                    )}
                    {prediction.homeStats.yellowCards > 0 && (
                        <StatBar label="Cartons Jaunes / Match" homeValue={prediction.homeStats.yellowCards} awayValue={prediction.awayStats.yellowCards} />
                    )}
                </div>
            )}
        </div>

        <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col items-center">
                <h3 className="text-lg font-semibold text-white mb-2 w-full text-left">Probabilités IA</h3>
                <ProbabilityChart 
                    homeName={match.homeTeam.shortName}
                    awayName={match.awayTeam.shortName}
                    homeProb={prediction.homeWinProbability}
                    drawProb={prediction.drawProbability}
                    awayProb={prediction.awayWinProbability}
                />
            </div>

             {/* H2H HISTORY SECTION */}
             {prediction.h2h && prediction.h2h.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                        <History size={20} className="text-indigo-400" />
                        <h3 className="text-lg font-semibold text-white">Historique H2H</h3>
                    </div>
                    <div className="space-y-2">
                        {prediction.h2h.map((h, i) => {
                             let borderColor = 'border-slate-700';
                             
                             return (
                                <div key={i} className={`flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border ${borderColor}`}>
                                    <div className="flex-1">
                                        <div className="text-[10px] text-slate-500 mb-1">{h.date}</div>
                                        <div className="text-xs font-semibold text-slate-200 flex flex-col gap-0.5">
                                            <span>{h.home}</span>
                                            <span>{h.away}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 px-3 py-1 rounded text-white font-bold border border-slate-700">
                                        {h.score}
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </div>
             )}

            {/* SECTION AVIS DU WEB AVEC GEMINI */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-slate-800 border border-indigo-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                     <Globe size={20} className="text-indigo-400" />
                     <h3 className="text-lg font-semibold text-white">Consensus Experts (Web)</h3>
                </div>

                {!webAnalysis && !loadingWeb && (
                    <div className="text-center py-4">
                        <p className="text-slate-400 text-sm mb-4">Vérifiez les avis d'autres sites de pronostics.</p>
                        <button 
                            onClick={handleScanWeb}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Sparkles size={16} /> Scanner le Web
                        </button>
                    </div>
                )}

                {loadingWeb && (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-sm">Lecture des pronostics...</p>
                    </div>
                )}

                {webAnalysis && (
                    <div className="animate-fade-in">
                        <div className="bg-indigo-950/50 p-3 rounded-lg border border-indigo-500/20 mb-3">
                            <span className="text-xs font-bold text-indigo-300 uppercase block mb-1">Consensus</span>
                            <p className="text-white font-bold text-lg">{webAnalysis.consensus}</p>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            {webAnalysis.summary}
                        </p>
                        {webAnalysis.sources.length > 0 && (
                            <div className="border-t border-slate-700/50 pt-3">
                                <span className="text-xs text-slate-500 block mb-2">Sources analysées :</span>
                                <ul className="space-y-1">
                                    {webAnalysis.sources.slice(0, 3).map((src, i) => (
                                        <li key={i}>
                                            <a href={src.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                                                <ExternalLink size={10} /> {src.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                         <button 
                            onClick={handleScanWeb}
                            className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            Actualiser
                        </button>
                    </div>
                )}
            </div>
            
             {prediction.alternativeBets && prediction.alternativeBets.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3 text-blue-400">
                        <ShieldCheck size={24} />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Alternatives</h3>
                    </div>
                    <ul className="space-y-2">
                        {prediction.alternativeBets.map((bet, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-slate-200 font-medium bg-slate-700/50 p-2 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                {bet}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;