import React, { useEffect, useState } from 'react';
import { Match, PredictionResult } from '../types';
import { fetchUpcomingMatches } from '../services/sportsDbService';
import { getFromCache, CacheKeys } from '../services/cacheService';
import { CheckCircle2, XCircle, MinusCircle, RefreshCw, ClipboardCheck, Trophy, AlertCircle, Sparkles, Database } from 'lucide-react';

const parseScore = (scoreStr: string): [number, number] | null => {
    if (!scoreStr.includes('-')) return null;
    const parts = scoreStr.split('-').map(s => parseInt(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return [parts[0], parts[1]];
};

const getWinner = (home: number, away: number): '1' | 'N' | '2' => {
    if (home > away) return '1';
    if (away > home) return '2';
    return 'N';
};

const ResultsView: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [results, setResults] = useState<Record<string, PredictionResult | null>>({});
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const allMatches = await fetchUpcomingMatches();
        
        // Filtrage simple: si le "time" contient un "-", c'est un score "2-1"
        const finishedMatches = allMatches.filter(m => m.time.includes('-'));
        
        setMatches(finishedMatches);

        // Récupération des pronos en cache
        const localResults: Record<string, PredictionResult | null> = {};
        for (const m of finishedMatches) {
            const cacheKey = CacheKeys.prediction(m.id);
            const cachedPred = getFromCache<PredictionResult>(cacheKey);
            localResults[m.id] = cachedPred;
        }

        setResults(localResults);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const getPredictionStatus = (realScoreStr: string, predictedScoreStr: string) => {
        const real = parseScore(realScoreStr);
        const pred = parseScore(predictedScoreStr);

        if (!real || !pred) return { label: 'Invalide', color: 'text-slate-500', icon: MinusCircle };

        if (real[0] === pred[0] && real[1] === pred[1]) {
            return { label: 'Score Exact !', color: 'text-emerald-400', icon: Trophy };
        }

        const realWinner = getWinner(real[0], real[1]);
        const predWinner = getWinner(pred[0], pred[1]);

        if (realWinner === predWinner) {
            return { label: 'Résultat Correct', color: 'text-blue-400', icon: CheckCircle2 };
        }

        return { label: 'Raté', color: 'text-red-500', icon: XCircle };
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                        <ClipboardCheck className="text-emerald-400" />
                        Résultats & Bilans
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Comparatif des scores réels vs Pronostics Algo.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={loadData} 
                      disabled={loading}
                      className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white border border-slate-700 transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse border border-slate-700"></div>
                    ))}
                 </div>
            ) : matches.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-800 rounded-2xl border border-slate-700">
                    <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Aucun résultat récent trouvé.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map(match => {
                        const prediction = results[match.id];
                        const realScore = match.time;
                        const predictedScore = prediction?.scorePrediction || '-';
                        
                        let status = { label: 'Non pronostiqué', color: 'text-slate-600', icon: AlertCircle };
                        let borderColor = 'border-slate-700 opacity-75';

                        if (prediction) {
                             status = getPredictionStatus(realScore, predictedScore);
                             if (status.label === 'Score Exact !') borderColor = 'border-emerald-500 shadow-lg shadow-emerald-900/20';
                             else if (status.label === 'Résultat Correct') borderColor = 'border-blue-500/50';
                             else borderColor = 'border-red-500/30';
                        }
                        
                        const StatusIcon = status.icon;

                        return (
                            <div key={match.id} className={`bg-slate-800 border rounded-xl overflow-hidden transition-all ${borderColor}`}>
                                <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-700/50 flex justify-between items-center">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{match.league}</span>
                                    <span className={`text-xs font-bold flex items-center gap-1.5 ${status.color}`}>
                                        <StatusIcon size={14} />
                                        {status.label}
                                    </span>
                                </div>

                                <div className="p-4 flex items-center justify-between gap-2">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-200 font-bold text-sm">{match.homeTeam.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-200 font-bold text-sm">{match.awayTeam.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 items-center pl-4 border-l border-slate-700">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Réel</span>
                                            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-600 text-white font-black text-lg">
                                                {realScore}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-emerald-400 uppercase font-bold mb-1 flex items-center gap-1"><Database size={10} /> Algo</span>
                                            <div className={`px-3 py-1.5 rounded-lg border font-bold text-lg min-w-[50px] text-center ${prediction ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-slate-800/50 border-slate-800 text-slate-700'}`}>
                                                {predictedScore}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-slate-700/20 border-t border-slate-700/50 text-xs text-slate-400 italic truncate min-h-[32px] flex items-center">
                                    {prediction ? `"${prediction.mainBet}"` : "Aucun pronostic enregistré."}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResultsView;