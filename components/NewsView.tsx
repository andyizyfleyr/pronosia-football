import React, { useEffect, useState } from 'react';
// CHANGEMENT: Gemini 3
import { fetchFootballNews } from '../services/geminiService';
import { NewsItem } from '../types';
import { Newspaper, ExternalLink, RefreshCw, Zap, TrendingUp } from 'lucide-react';

const NewsView: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNews = async (force: boolean = false) => {
        setLoading(true);
        const data = await fetchFootballNews(force);
        setNews(data);
        setLoading(false);
    };

    useEffect(() => {
        loadNews();
    }, []);

    const getTagColor = (tag: string) => {
        const t = tag.toLowerCase();
        if (t.includes('mercato') || t.includes('transferts')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        if (t.includes('blessure') || t.includes('infirmerie')) return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (t.includes('résultat')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
                    <Newspaper className="text-blue-400" />
                    Actualités & Rumeurs
                </h2>
                <button 
                  onClick={() => loadNews(true)} 
                  disabled={loading}
                  className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white border border-slate-700 transition-all"
                >
                  <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {loading && news.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-48 bg-slate-800 rounded-2xl animate-pulse border border-slate-700"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item, idx) => (
                        <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-500 transition-colors group shadow-lg">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${getTagColor(item.tag)}`}>
                                        {item.tag}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        {idx < 2 && <Zap size={12} className="text-yellow-500 fill-yellow-500" />}
                                        {item.time}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-3 leading-snug group-hover:text-blue-400 transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    {item.summary}
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                <span className="text-xs font-semibold text-slate-500 uppercase">{item.source}</span>
                                <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300"
                                >
                                    Lire <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {!loading && news.length === 0 && (
                 <div className="text-center py-12 text-slate-500">
                    <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Aucune actualité trouvée pour le moment.</p>
                 </div>
            )}
        </div>
    );
};

export default NewsView;