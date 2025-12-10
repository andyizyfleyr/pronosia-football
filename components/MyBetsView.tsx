import React from 'react';
import { PredictionResult, Match } from '../types';
import { Trash2, Bot, CheckCircle2, XCircle, MinusCircle, AlertCircle } from 'lucide-react';

interface Props {
  aiHistory?: PredictionResult[];
  matches?: Match[];
  onClearHistory: () => void;
}

const parseScore = (scoreStr: string): [number, number] | null => {
    if (!scoreStr || !scoreStr.includes('-')) return null;
    const parts = scoreStr.split('-').map(s => parseInt(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return [parts[0], parts[1]];
};

const getWinner = (home: number, away: number): '1' | 'N' | '2' => {
    if (home > away) return '1';
    if (away > home) return '2';
    return 'N';
};

const MyBetsView: React.FC<Props> = ({ aiHistory = [], matches = [], onClearHistory }) => {
  // Helper to check AI prediction result
  const checkAiResult = (prediction: PredictionResult) => {
      // Find the match in the provided match list (which contains results for Yesterday/Today)
      const match = matches.find(m => m.id === prediction.matchId);
      
      if (!match) return { status: 'UNKNOWN', label: 'Match non trouvé' };
      if (!match.time.includes('-')) return { status: 'PENDING', label: 'En attente' }; // Not finished

      // Determine actual winner
      const actualScore = parseScore(match.time);
      if (!actualScore) return { status: 'UNKNOWN', label: 'Score invalide' };
      const actualWinner = getWinner(actualScore[0], actualScore[1]);

      // Determine AI prediction (Based on probas)
      let aiPick: '1' | 'N' | '2' = 'N';
      const { homeWinProbability: pH, drawProbability: pD, awayWinProbability: pA } = prediction;
      
      if (pH > pA && pH > pD) aiPick = '1';
      else if (pA > pH && pA > pD) aiPick = '2';
      else aiPick = 'N';

      if (aiPick === actualWinner) return { status: 'WIN', label: 'Succès', score: match.time };
      return { status: 'LOSS', label: 'Échec', score: match.time };
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
          <Bot className="text-purple-400" />
          Historique Prédictions
        </h2>
        <button 
           onClick={onClearHistory}
           className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-900/50 bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
        >
           <Trash2 size={14} />
           Effacer
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden min-h-[300px]">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
                <Bot size={18} className="text-purple-400" /> 
                Dernières analyses consultées
            </h3>
        </div>
        {aiHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
                <Bot size={48} className="mx-auto mb-4 opacity-20" />
                <p>Aucun historique de prédiction.</p>
                <p className="text-sm">Consultez l'analyse d'un match pour le voir apparaître ici.</p>
            </div>
        ) : (
            <div className="divide-y divide-slate-700">
                {aiHistory.map((pred, idx) => {
                    const result = checkAiResult(pred);
                    let StatusIcon = MinusCircle;
                    let statusClass = "text-slate-500 bg-slate-500/10 border-slate-500/20";
                    
                    if (result.status === 'WIN') {
                        StatusIcon = CheckCircle2;
                        statusClass = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
                    } else if (result.status === 'LOSS') {
                        StatusIcon = XCircle;
                        statusClass = "text-red-400 bg-red-400/10 border-red-400/20";
                    } else if (result.status === 'PENDING') {
                        StatusIcon = AlertCircle;
                        statusClass = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
                    }

                    return (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-slate-700/30 transition-colors">
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusClass}`}>
                                        <StatusIcon size={12} /> {result.label}
                                    </span>
                                    {result.score && (
                                        <span className="text-[10px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded border border-slate-600">
                                            Score: {result.score}
                                        </span>
                                    )}
                                </div>
                                <p className="font-bold text-white text-lg line-clamp-1">
                                    {pred.summary.split('.')[0]}...
                                </p>
                                <div className="text-sm text-slate-400 mt-1">
                                    Prono IA: <span className="text-white font-semibold">{pred.mainBet}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] uppercase text-slate-500 font-bold">Confiance</span>
                                        <span className={`text-sm font-bold ${pred.confidence === 'Élevé' ? 'text-emerald-400' : pred.confidence === 'Moyen' ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {pred.confidence}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center pl-4 border-l border-slate-700">
                                        <span className="text-[10px] uppercase text-slate-500 font-bold">Prob. Victoire</span>
                                        <div className="flex text-xs font-mono mt-1">
                                            <span className="text-emerald-400">{pred.homeWinProbability}%</span>
                                            <span className="text-slate-500 mx-1">/</span>
                                            <span className="text-slate-300">{pred.drawProbability}%</span>
                                            <span className="text-slate-500 mx-1">/</span>
                                            <span className="text-blue-400">{pred.awayWinProbability}%</span>
                                        </div>
                                    </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default MyBetsView;