import React, { useState, useEffect } from 'react';
import { ComboBet } from '../types';
// CHANGEMENT: Gemini 3
import { fetchDailyCombo } from '../services/geminiService';
import { parseMatchTime, isBetValid, getMatchStatusByServerTime } from '../services/timeService';
import { Layers, RefreshCw, Trophy, ArrowRight, Flame, Gem, Zap, Bomb, Target, AlertTriangle, Lock } from 'lucide-react';

interface Props {}

const TIER_CONFIG: Record<number, { color: string, icon: any, label: string, desc: string }> = {
    2: { color: 'text-emerald-400', icon: Target, label: 'Safe', desc: 'Le doubleur sécurité.' },
    5: { color: 'text-blue-400', icon: Zap, label: 'Fun', desc: 'Un peu de piment.' },
    10: { color: 'text-orange-400', icon: Flame, label: 'Hard', desc: 'Pour les audacieux.' },
    50: { color: 'text-red-500', icon: Bomb, label: 'Crazy', desc: 'Gros risque, gros gain.' },
    100: { color: 'text-purple-500', icon: Gem, label: 'Jackpot', desc: 'Le coup d\'une vie.' }
};

const ComboView: React.FC<Props> = () => {
    const [targetOdds, setTargetOdds] = useState<number>(2);
    const [combo, setCombo] = useState<ComboBet | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);

    const loadCombo = async (odds: number, force: boolean = false) => {
        setLoading(true);
        setCombo(null);
        setIsExpired(false);
        const data = await fetchDailyCombo(odds, force);
        setCombo(data);
        
        // Initial validity check
        if (data) {
             checkExpiry(data);
        }
        
        setLoading(false);
    };

    // Check expiry logic
    const checkExpiry = (currentCombo: ComboBet) => {
        // Find the earliest match in the combo
        const hasStartedMatch = currentCombo.selections.some(sel => {
            const todayStr = new Date().toISOString().split('T')[0]; 
            const matchDate = parseMatchTime(todayStr, sel.time); 
            return !isBetValid(matchDate);
        });
        setIsExpired(hasStartedMatch);
    };

    useEffect(() => {
        loadCombo(targetOdds);
    }, [targetOdds]);

    // Periodically check if combo expired
    useEffect(() => {
        if (!combo) return;
        const timer = setInterval(() => checkExpiry(combo), 5000);
        return () => clearInterval(timer);
    }, [combo]);

    const ActiveIcon = TIER_CONFIG[targetOdds].icon;

    // Helper for background gradients based on tier
    const getGradientClass = (odds: number) => {
        if (odds >= 50) return 'bg-gradient-to-r from-purple-900 to-pink-900 border-purple-500/50';
        if (odds >= 10) return 'bg-gradient-to-r from-orange-900/80 to-red-900/80 border-orange-500/50';
        if (odds >= 5) return 'bg-gradient-to-r from-blue-900/80 to-indigo-900/80 border-blue-500/50';
        return 'bg-gradient-to-r from-emerald-900/50 to-slate-900 border-emerald-500/30';
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
                        <Layers className="text-slate-300" />
                        Générateur Algo (Gemini 3)
                    </h2>
                    <p className="text-slate-400 mt-1 md:mt-2 text-sm md:text-base">
                        Choisissez votre niveau de risque. L'IA construit le ticket optimal.
                    </p>
                </div>
                <button 
                  onClick={() => loadCombo(targetOdds, true)} 
                  disabled={loading}
                  className="p-3 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-700 transition-all hover:bg-slate-700 w-12 h-12 flex items-center justify-center self-end md:self-auto"
                >
                  <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* TABS SELECTION */}
            <div className="grid grid-cols-5 gap-1.5 md:gap-2 bg-slate-800 p-1.5 md:p-2 rounded-2xl border border-slate-700">
                {[2, 5, 10, 50, 100].map((tier) => {
                    const Icon = TIER_CONFIG[tier].icon;
                    const isActive = targetOdds === tier;
                    return (
                        <button
                            key={tier}
                            onClick={() => setTargetOdds(tier)}
                            className={`
                                flex flex-col items-center justify-center py-2 md:py-3 rounded-xl transition-all duration-300
                                ${isActive 
                                    ? 'bg-slate-700 shadow-lg shadow-black/20 transform scale-105 border border-slate-600' 
                                    : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'}
                            `}
                        >
                            <Icon size={18} className={`mb-0.5 md:mb-1 ${isActive ? TIER_CONFIG[tier].color : ''}`} />
                            <span className={`text-[10px] md:text-sm font-bold ${isActive ? 'text-white' : ''}`}>@{tier}</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 text-center space-y-4 min-h-[400px] flex flex-col items-center justify-center">
                     <div className={`w-16 h-16 border-4 border-slate-700 border-t-current rounded-full animate-spin mx-auto ${TIER_CONFIG[targetOdds].color}`}></div>
                     <div>
                        <p className="text-white text-lg font-bold">Construction du Combo @{targetOdds}...</p>
                        <p className="text-sm text-slate-500 mt-1">{TIER_CONFIG[targetOdds].desc}</p>
                     </div>
                </div>
            ) : !combo ? (
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 text-center">
                    <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
                    <p className="text-white text-lg">L'algorithme n'a pas trouvé assez de matchs sûrs.</p>
                    <p className="text-slate-500">Essayez plus tard ou changez de niveau.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-slide-up">
                    {/* Summary Card */}
                    <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 border ${getGradientClass(targetOdds)}`}>
                        {isExpired && (
                            <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                                <Lock size={64} className="text-red-500 mb-4" />
                                <h3 className="text-2xl font-bold text-white">Combiné Expiré</h3>
                                <p className="text-slate-300">Un des matchs a déjà débuté.</p>
                                <button onClick={() => loadCombo(targetOdds, true)} className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                                    Générer un nouveau
                                </button>
                            </div>
                        )}

                        {/* Background Decoration */}
                        <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
                            <ActiveIcon size={200} />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 text-white/80 text-xs font-bold uppercase mb-2 border border-white/10">
                                    <ActiveIcon size={12} /> {combo.confidence}
                                </div>
                                <h3 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                    {combo.totalOdds.toFixed(2)}
                                </h3>
                                <p className="text-white/60 font-medium mt-1">Cote Totale</p>
                            </div>
                            <div className="flex-1 max-w-md bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <p className="text-white/90 italic text-center md:text-left leading-relaxed text-sm md:text-base">
                                    "{combo.reasoning}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Matches List */}
                    <div className="space-y-3">
                         {combo.selections.map((sel, idx) => (
                             <div key={idx} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 hover:border-slate-500 transition-colors">
                                 {/* Time Badge */}
                                 <div className="bg-slate-900 text-slate-400 font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-700 self-start md:self-center">
                                     {sel.time}
                                 </div>
                                 
                                 {/* Match Info */}
                                 <div className="flex-1 text-left">
                                     <h4 className="font-bold text-white text-lg">{sel.match}</h4>
                                     <p className="text-slate-400 text-sm mt-0.5">{sel.analysis}</p>
                                 </div>

                                 {/* Selection & Odds */}
                                 <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                      <span className={`text-sm font-bold ${TIER_CONFIG[targetOdds].color}`}>
                                          {sel.selection}
                                      </span>
                                      <span className="bg-slate-800 text-white px-3 py-1 rounded-lg font-black min-w-[60px] text-center border border-slate-700">
                                          {sel.odds}
                                      </span>
                                 </div>
                             </div>
                         ))}
                    </div>

                </div>
            )}
        </div>
    );
};

export default ComboView;