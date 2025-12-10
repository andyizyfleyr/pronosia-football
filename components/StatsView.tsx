import React, { useState } from 'react';
// CHANGEMENT: Gemini 3
import { searchEntityStats } from '../services/geminiService';
import { EntityProfile } from '../types';
import { Search, User, Shield, Info, BarChart3, ChevronRight } from 'lucide-react';

const StatsView: React.FC = () => {
    const [query, setQuery] = useState('');
    const [profile, setProfile] = useState<EntityProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if(!query.trim()) return;

        setLoading(true);
        setSearched(true);
        setProfile(null);
        
        const data = await searchEntityStats(query);
        setProfile(data);
        setLoading(false);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Explorateur Gemini</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Recherchez un joueur ou une équipe. Gemini scanne le web pour créer une fiche complète.
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ex: Kylian Mbappé, Real Madrid, Arsenal..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-full py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xl transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <button 
                    type="submit"
                    disabled={loading || !query}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2 px-4 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '...' : 'Chercher'}
                </button>
            </form>

            {/* Content Area */}
            <div className="min-h-[300px]">
                {loading && (
                    <div className="flex flex-col items-center justify-center pt-12 text-slate-500">
                        <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p>Interrogation de Gemini...</p>
                    </div>
                )}

                {!loading && searched && !profile && (
                    <div className="text-center pt-12 text-slate-500">
                        <Info size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Aucun résultat trouvé pour "{query}". Essayez d'être plus précis (nom anglais parfois requis).</p>
                    </div>
                )}

                {!loading && profile && (
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
                        {/* Header Profile */}
                        <div className="relative bg-slate-900 p-8 flex flex-col md:flex-row items-center gap-6 border-b border-slate-700">
                             <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-indigo-500 p-1 shadow-[0_0_20px_rgba(99,102,241,0.2)] overflow-hidden">
                                {profile.image ? (
                                    <img src={profile.image} alt={profile.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center text-slate-400">
                                        <User size={40} />
                                    </div>
                                )}
                             </div>
                             <div className="text-center md:text-left flex-1">
                                 <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                     <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-slate-900 ${profile.type === 'PLAYER' ? 'bg-blue-400' : 'bg-emerald-400'}`}>
                                         {profile.type === 'PLAYER' ? 'Joueur' : 'Équipe'}
                                     </span>
                                 </div>
                                 <h3 className="text-3xl font-black text-white">{profile.name}</h3>
                                 <p className="text-indigo-400 font-medium">{profile.subtitle}</p>
                                 <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-lg">{profile.description}</p>
                             </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                    <BarChart3 size={20} className="text-emerald-500" />
                                    Infos Clés
                                </h4>
                                <div className="space-y-3">
                                    {profile.stats.map((stat, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                            <span className="text-slate-400 text-sm">{stat.label}</span>
                                            <span className="text-white font-bold">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                                    <Shield size={20} className="text-blue-500" />
                                    Derniers Matchs
                                </h4>
                                <div className="space-y-3">
                                    {profile.recentResults.map((res, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                            <span className="text-slate-300 font-medium text-sm">{res.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold">{res.result}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!searched && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 opacity-50">
                        {['Erling Haaland', 'Manchester City', 'Lamine Yamal', 'Arsenal'].map(ex => (
                            <button 
                                key={ex} 
                                onClick={() => { setQuery(ex); }}
                                className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-all text-center"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsView;