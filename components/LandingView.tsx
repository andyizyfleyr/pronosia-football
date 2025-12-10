import React from 'react';
import { Sparkles, ArrowRight, Activity, Trophy, BrainCircuit, Zap, Search, ShieldCheck, BarChart3, Clock, ChevronDown, Star, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

interface Props {
  onEnter: () => void;
}

const LandingView: React.FC<Props> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] overflow-y-auto text-slate-200 selection:bg-indigo-500/30">
      
      {/* --- SECTION 1: HERO --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-10 pb-20 overflow-hidden">
         {/* Background Elements */}
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s'}}></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-4 hover:border-indigo-500/50 transition-colors cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-300">v2.0 • Powered by Gemini 3</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[1.1]">
              Le Futur du <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Pronostic Foot</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
              Ne pariez plus au hasard. L'intelligence artificielle analyse la forme réelle sur 10 matchs, les blessures et le consensus web en temps réel.
            </p>

            <div className="pt-8 flex flex-col items-center gap-6">
                <button 
                  onClick={onEnter}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:scale-105 shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)]"
                >
                    <span className="relative flex items-center gap-3">
                        Lancer l'Application
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
                <div className="animate-bounce mt-10 opacity-50">
                    <ChevronDown size={24} />
                </div>
            </div>
        </div>
      </section>

      {/* --- SECTION 2: BENTO GRID FEATURES --- */}
      <section className="py-24 px-4 bg-slate-900 relative">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Une Technologie <span className="text-indigo-500">Avancée</span></h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">Nous combinons la puissance de calcul de Google Gemini avec des données sportives en temps réel.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: IA */}
                  <div className="md:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 transition-all group overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <BrainCircuit size={120} />
                      </div>
                      <div className="relative z-10">
                          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
                              <Sparkles className="text-indigo-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-3">Analyse Générative & Web Grounding</h3>
                          <p className="text-slate-400 leading-relaxed max-w-md">
                              Contrairement aux algos classiques, notre IA "lit" le web. Elle connait les blessures de dernière minute, les déclarations de coachs et la météo du match.
                          </p>
                      </div>
                  </div>

                  {/* Card 2: Live */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 transition-all group relative overflow-hidden">
                       <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                          <Clock size={100} />
                      </div>
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                          <Activity className="text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Live Score Précis</h3>
                      <p className="text-slate-400 text-sm">
                          Suivi minute par minute. Détection automatique des temps forts et ajustement des statuts en direct.
                      </p>
                  </div>

                  {/* Card 3: Forme */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 transition-all group">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                          <BarChart3 className="text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Forme Étendue (10 Matchs)</h3>
                      <p className="text-slate-400 text-sm">
                          On ne s'arrête pas aux 5 derniers matchs. L'IA scrute les 10 dernières rencontres pour détecter les vraies tendances de fond.
                      </p>
                  </div>

                  {/* Card 4: Search */}
                  <div className="md:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 transition-all group relative overflow-hidden flex items-center">
                       <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-500 to-indigo-500"></div>
                       <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-2">Explorateur Intelligent</h3>
                            <p className="text-slate-400">Demandez n'importe quelle stat sur un joueur ou une équipe. L'assistant vous répond instantanément.</p>
                       </div>
                       <div className="hidden md:block bg-slate-900 p-4 rounded-xl border border-slate-700 transform rotate-3 group-hover:rotate-0 transition-transform">
                           <Search className="text-slate-400" />
                       </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SECTION 3: DEEP DIVE --- */}
      <section className="py-24 px-4 bg-[#0B1221] overflow-hidden">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                  <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                      Des Pronostics <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Transparents & Détaillés</span>
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                      Fini les "Trust me bro". Chaque prédiction est accompagnée d'un rapport complet : probabilités calculées, facteurs clés, cotes réelles comparées et historiques H2H.
                  </p>
                  
                  <div className="space-y-4">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                              <ShieldCheck size={20} />
                          </div>
                          <div>
                              <h4 className="font-bold text-white">Indice de Confiance</h4>
                              <p className="text-sm text-slate-500">L'IA évalue la fiabilité de son propre pronostic.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                              <Zap size={20} />
                          </div>
                          <div>
                              <h4 className="font-bold text-white">Scénario de Match</h4>
                              <p className="text-sm text-slate-500">Prédiction du score exact et du déroulement.</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Visual Abstract */}
              <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full"></div>
                  <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl rotate-3 hover:rotate-1 transition-transform duration-500">
                      <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
                              <span className="font-bold">Real Madrid</span>
                          </div>
                          <span className="font-mono text-emerald-400 font-bold">2 - 1</span>
                          <div className="flex items-center gap-2">
                              <span className="font-bold">Barça</span>
                              <div className="w-8 h-8 bg-slate-700 rounded-full"></div>
                          </div>
                      </div>
                      <div className="space-y-3">
                          <div className="h-2 bg-slate-700 rounded-full w-3/4"></div>
                          <div className="h-2 bg-slate-700 rounded-full w-full"></div>
                          <div className="h-2 bg-slate-700 rounded-full w-1/2"></div>
                      </div>
                      <div className="mt-6 flex gap-2">
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">Confiance Élevée</span>
                          <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-bold rounded">Cote 2.10</span>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SECTION 4: COMBO GENERATOR --- */}
      <section className="py-24 px-4 bg-slate-900 relative">
          <div className="max-w-4xl mx-auto text-center space-y-12">
              <div className="space-y-4">
                  <div className="inline-block p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg mb-4">
                      <Trophy className="text-white w-8 h-8" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white">Générateur de Combinés</h2>
                  <p className="text-slate-400 text-lg">Vous donnez la cote cible, l'IA construit le ticket.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                   <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-center">
                       <span className="block text-2xl font-black text-emerald-400 mb-1">Safe</span>
                       <span className="text-xs text-slate-500">Cote ~2.00</span>
                   </div>
                   <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-center">
                       <span className="block text-2xl font-black text-blue-400 mb-1">Fun</span>
                       <span className="text-xs text-slate-500">Cote ~5.00</span>
                   </div>
                   <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-center">
                       <span className="block text-2xl font-black text-orange-400 mb-1">Hard</span>
                       <span className="text-xs text-slate-500">Cote ~10.00</span>
                   </div>
                   <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-center">
                       <span className="block text-2xl font-black text-purple-400 mb-1">Jackpot</span>
                       <span className="text-xs text-slate-500">Cote 100+</span>
                   </div>
              </div>
          </div>
      </section>

      {/* --- SECTION 5: REVIEWS (SOCIAL PROOF) --- */}
      <section className="py-24 px-4 bg-[#0B1221] border-y border-slate-800">
          <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-white text-center mb-12">Ils battent les bookmakers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Review 1 */}
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <div className="flex gap-1 mb-4">
                          {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                      </div>
                      <p className="text-slate-300 mb-6 italic">"J'étais sceptique sur l'IA, mais l'analyse sur 10 matchs change tout. Gemini a vu la défaite du PSG avant tout le monde."</p>
                      <div className="flex items-center gap-3">
                          <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Thomas" className="w-10 h-10 rounded-full bg-slate-700" alt="Avatar" />
                          <div>
                              <p className="text-white font-bold text-sm">Thomas L.</p>
                              <p className="text-slate-500 text-xs">Parieur depuis 5 ans</p>
                          </div>
                      </div>
                  </div>

                   {/* Review 2 */}
                   <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <div className="flex gap-1 mb-4">
                          {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                      </div>
                      <p className="text-slate-300 mb-6 italic">"Le Live Score avec la minute exacte est plus rapide que mes applis habituelles. Et les combinés 'Safe' passent souvent !"</p>
                      <div className="flex items-center gap-3">
                          <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah" className="w-10 h-10 rounded-full bg-slate-700" alt="Avatar" />
                          <div>
                              <p className="text-white font-bold text-sm">Sarah B.</p>
                              <p className="text-slate-500 text-xs">Fan de Premier League</p>
                          </div>
                      </div>
                  </div>

                   {/* Review 3 */}
                   <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <div className="flex gap-1 mb-4">
                          {[1,2,3,4].map(i => <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />)}
                          <Star size={16} className="text-yellow-400" />
                      </div>
                      <p className="text-slate-300 mb-6 italic">"Interface ultra propre. J'adore pouvoir demander des stats précises à l'assistant sur les blessures avant de parier."</p>
                      <div className="flex items-center gap-3">
                          <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Karim" className="w-10 h-10 rounded-full bg-slate-700" alt="Avatar" />
                          <div>
                              <p className="text-white font-bold text-sm">Karim Z.</p>
                              <p className="text-slate-500 text-xs">Utilisateur Pro</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SECTION 6: FINAL CTA --- */}
      <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-[#0f172a]"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-12 rounded-3xl shadow-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white">Prêt à battre les bookmakers ?</h2>
              <p className="text-slate-300 text-lg">
                  L'accès à PronosIA est gratuit. Rejoignez l'ère de l'analyse augmentée par IA.
              </p>
              <button 
                onClick={onEnter}
                className="w-full md:w-auto px-10 py-5 bg-white text-slate-900 font-bold text-xl rounded-full hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-3 mx-auto"
              >
                  Entrer dans l'Arène
                  <ArrowRight className="w-5 h-5" />
              </button>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                  <div className="col-span-1 md:col-span-1">
                      <div className="flex items-center gap-2 mb-4">
                           <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="text-white" size={16} />
                           </div>
                           <span className="text-xl font-bold text-white">Pronos<span className="text-indigo-500">IA</span></span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed">
                          L'intelligence artificielle au service de vos pronostics sportifs. Analyses, stats live et algorithmes prédictifs.
                      </p>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-4">Produit</h4>
                      <ul className="space-y-2 text-sm text-slate-400">
                          <li><button onClick={onEnter} className="hover:text-white transition-colors">Matchs du Jour</button></li>
                          <li><button onClick={onEnter} className="hover:text-white transition-colors">Combinés</button></li>
                          <li><button onClick={onEnter} className="hover:text-white transition-colors">Live Score</button></li>
                          <li><button onClick={onEnter} className="hover:text-white transition-colors">Assistant Gemini</button></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-4">Légal</h4>
                      <ul className="space-y-2 text-sm text-slate-400">
                          <li><a href="#" className="hover:text-white transition-colors">Conditions Générales</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                          <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-white font-bold mb-4">Suivez-nous</h4>
                      <div className="flex gap-4">
                          <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all">
                              <Twitter size={18} />
                          </a>
                          <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-purple-600 hover:text-white transition-all">
                              <Instagram size={18} />
                          </a>
                          <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                              <Linkedin size={18} />
                          </a>
                           <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                              <Github size={18} />
                          </a>
                      </div>
                  </div>
              </div>

              <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-slate-600 text-xs">
                      © 2024 PronosIA. Tous droits réservés.
                  </p>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="w-6 h-6 rounded-full border-2 border-red-600 flex items-center justify-center text-[10px] font-bold text-red-600 bg-slate-950">
                          18+
                      </div>
                      <span className="text-xs text-slate-500">
                          Jouer comporte des risques : endettement, isolement, dépendance. Pour être aidé, appelez le 09 74 75 13 13.
                      </span>
                  </div>
              </div>
          </div>
      </footer>

    </div>
  );
};

export default LandingView;