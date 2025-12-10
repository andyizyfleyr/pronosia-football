import React, { useState, useEffect } from 'react';
import { StandingTeam } from '../types';
// CHANGEMENT: Gemini 3
import { fetchLeagueStandings } from '../services/geminiService';
import { Trophy, RefreshCw, Sparkles, Database } from 'lucide-react';
import { LEAGUES } from '../constants';

const StandingsView: React.FC = () => {
    const [selectedLeague, setSelectedLeague] = useState<string>('Premier League');
    const [standings, setStandings] = useState<StandingTeam[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        loadStandings();
    }, [selectedLeague]);

    const loadStandings = async () => {
        setLoading(true);
        const data = await fetchLeagueStandings(selectedLeague);
        setStandings(data);
        setLoading(false);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                    <Trophy className="text-yellow-500" />
                    Classements (Live Web)
                </h2>
                <div className="relative">
                    <select 
                        value={selectedLeague}
                        onChange={(e) => setSelectedLeague(e.target.value)}
                        className="appearance-none bg-slate-800 border border-slate-700 text-white py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                        {LEAGUES.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                        <RefreshCw className="animate-spin mb-3 text-indigo-500" size={32} />
                        <p className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /> Recherche du classement...</p>
                    </div>
                ) : standings.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                         <p>Classement non disponible pour le moment.</p>
                         <button onClick={loadStandings} className="mt-4 text-indigo-400 hover:underline">Réessayer</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                                    <th className="p-4 w-12 text-center">Pos</th>
                                    <th className="p-4">Équipe</th>
                                    <th className="p-4 text-center">J</th>
                                    <th className="p-4 text-center">Pts</th>
                                    <th className="p-4 hidden sm:table-cell text-center">Forme</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 text-sm">
                                {standings.map((team) => (
                                    <tr key={team.team} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-center">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold 
                                                ${team.rank <= 4 ? 'bg-emerald-500 text-slate-900' : 
                                                  team.rank >= 18 ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                                {team.rank}
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-white">{team.team}</td>
                                        <td className="p-4 text-center text-slate-400">{team.played}</td>
                                        <td className="p-4 text-center font-bold text-white">{team.points}</td>
                                        <td className="p-4 hidden sm:flex justify-center gap-1">
                                            {team.form?.map((f, i) => (
                                                <div key={i} className={`w-2 h-2 rounded-full 
                                                    ${f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                />
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StandingsView;