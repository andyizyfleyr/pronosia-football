import { GoogleGenAI } from "@google/genai";
import { Match, PredictionResult, GroundingSource, Team, NewsItem, ComboBet, StandingTeam, EntityProfile } from "../types";
import { getLogo, REAL_TEAM_LOGOS } from "../constants";
import { getFromCache, saveToCache, getCacheMetadata, TTL, CacheKeys } from "./cacheService";
import { parseMatchTime } from "./timeService";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.warn("API_KEY not found.");
    return "";
  }
  return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

// PASSAGE À GEMINI 3 PRO PREVIEW POUR TOUT LE PROJET
const modelId = "gemini-3-pro-preview";

// Utility to find logo in our dictionary with smarter fuzzy matching
const findLogo = (name: string, shortName?: string): string => {
  const normalize = (str: string) => {
      let s = str.toLowerCase();
      s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      s = s.replace(/[^a-z0-9]/g, '');
      s = s.replace(/^(fc|as|rc|sc|olympique|sporting|real|inter|ac|rb)/, '');
      s = s.replace(/(fc|fk|as|rc|sc)$/, '');
      return s;
  };
  
  const nName = normalize(name);
  if (REAL_TEAM_LOGOS[nName]) return REAL_TEAM_LOGOS[nName];
  if (shortName) {
    const nShort = normalize(shortName);
    if (REAL_TEAM_LOGOS[nShort]) return REAL_TEAM_LOGOS[nShort];
  }
  for (const key in REAL_TEAM_LOGOS) {
    if (key.length > 3 && nName.includes(key)) return REAL_TEAM_LOGOS[key];
    if (key.length > 3 && key.includes(nName)) return REAL_TEAM_LOGOS[key];
  }
  return getLogo(shortName || name);
};

// Helper pour créer un ID stable (Hash simple)
const generateStableId = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
};

export const fetchUpcomingMatches = async (forceRefresh: boolean = false): Promise<Match[]> => {
  // 1. Stratégie Cache-First (Si pas de refresh forcé)
  if (!forceRefresh) {
    const cached = getFromCache<Match[]>(CacheKeys.UPCOMING_MATCHES);
    if (cached) return cached;
  }

  try {
    const prompt = `
        Liste les matchs de football majeurs :
        1. **HIER** (Résultats finaux).
        2. **AUJOURD'HUI** (Matchs prévus, **EN COURS** ou terminés).
        3. **DEMAIN** (Matchs à venir).
        
        Focus prioritaire: Ligue 1, Premier League, Liga, Serie A, Bundesliga, Champions League.
        
        Tâche:
        1. Utilise Google Search pour trouver la liste exacte et RÉCENTE.
        2. Retourne UNIQUEMENT un tableau JSON strict.
        3. Pour les matchs d'HIER (terminés), mets le SCORE FINAL (ex: "2-1") dans le champ "time".
        4. Pour les matchs d'AUJOURD'HUI :
           - Si EN COURS : Mets le **SCORE ET LA MINUTE** dans "time" (ex: "1-0 (24')", "2-2 (75')", "0-0 (MT)"). C'est CRUCIAL d'avoir le LIVE.
           - Si PAS COMMENCÉ : Mets l'HEURE (HH:MM).
           - Si TERMINÉ : Mets le SCORE FINAL.
        5. Dates: Format "YYYY-MM-DD".
        
        JSON Format:
        [
        {
            "homeTeamName": "Nom Complet",
            "homeTeamShort": "XXX",
            "awayTeamName": "Nom Complet",
            "awayTeamShort": "XXX",
            "league": "Nom Ligue",
            "date": "YYYY-MM-DD", 
            "time": "HH:MM ou Score ou '1-0 (34\')'"
        }
        ]
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "[]";
    let rawMatches = [];
    try {
        rawMatches = JSON.parse(text);
    } catch (e) {
        console.warn("JSON parse failed", e);
        throw new Error("Invalid JSON");
    }

    if (!Array.isArray(rawMatches)) throw new Error("Not an array");

    const matches = rawMatches.map((m: any, index: number) => {
       const homeLogo = findLogo(m.homeTeamName, m.homeTeamShort);
       const awayLogo = findLogo(m.awayTeamName, m.awayTeamShort);
       
       // ID STABLE
       const uniqueKey = `${m.homeTeamName}-${m.awayTeamName}-${m.date}`.toLowerCase().replace(/[^a-z0-9]/g, '');
       const stableId = `match-${generateStableId(uniqueKey)}`;

       const homeTeam: Team = {
         id: `home-${generateStableId(m.homeTeamName)}`,
         name: m.homeTeamName,
         shortName: m.homeTeamShort || m.homeTeamName.substring(0, 3).toUpperCase(),
         league: m.league,
         logoUrl: homeLogo
       };
       const awayTeam: Team = {
         id: `away-${generateStableId(m.awayTeamName)}`,
         name: m.awayTeamName,
         shortName: m.awayTeamShort || m.awayTeamName.substring(0, 3).toUpperCase(),
         league: m.league,
         logoUrl: awayLogo
       };

       return {
         id: stableId,
         homeTeam,
         awayTeam,
         date: m.date, 
         time: m.time,
         league: m.league
       };
    });

    if (matches.length > 0) {
        saveToCache(CacheKeys.UPCOMING_MATCHES, matches, TTL.MATCHES);
    }

    return matches;

  } catch (error) {
    console.error("Gemini 3 Error fetching matches:", error);
    
    // 2. Stratégie Fallback (Stale-While-Revalidate)
    const staleCache = getFromCache<Match[]>(CacheKeys.UPCOMING_MATCHES, true);
    if (staleCache && staleCache.length > 0) {
        console.warn("Returning STALE cache due to fetch error.");
        return staleCache;
    }

    return [];
  }
};

export const fetchWebConsensus = async (home: string, away: string): Promise<{ summary: string, consensus: string, sources: GroundingSource[] }> => {
    try {
        const prompt = `
            Cherche les pronostics récents sur le web pour le match : ${home} vs ${away}.
            Consulte les sites experts.
            
            Fais une synthèse JSON stricte :
            {
                "consensus": "Qui est le favori ?",
                "summary": "Analyse résumée des avis.",
            }
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });

        const text = response.text || "{}";
        const data = JSON.parse(text);

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: GroundingSource[] = chunks
            .filter((c: any) => c.web?.uri && c.web?.title)
            .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

        return {
            summary: data.summary || "Analyse indisponible.",
            consensus: data.consensus || "Incertain",
            sources: sources
        };

    } catch (error) {
        return { summary: "Erreur IA.", consensus: "N/A", sources: [] };
    }
};

export const generatePrediction = async (match: Match, forceRefresh: boolean = false): Promise<PredictionResult> => {
    const cacheKey = CacheKeys.prediction(match.id);
    
    // SMART CACHE INVALIDATION
    if (!forceRefresh) {
        const cached = getFromCache<PredictionResult>(cacheKey);
        const meta = getCacheMetadata(cacheKey);

        if (cached && meta) {
             const now = Date.now();
             const cacheAge = now - meta.createdAt;
             const matchDate = parseMatchTime(match.date, match.time);
             const timeToMatch = matchDate.getTime() - now;

             // Règle 1: Si le match est dans moins de 3 heures (ou Live) et que le cache a plus de 30 minutes -> Refresh (Pour les compos/blessures dernière minute)
             const isImminent = timeToMatch < (3 * 60 * 60 * 1000) && timeToMatch > (-2 * 60 * 60 * 1000); // Entre -2h et +3h
             if (isImminent && cacheAge > (30 * 60 * 1000)) {
                 console.log("Smart Invalidation: Match imminent, refreshing stale prediction.");
                 // On continue vers l'appel API (fetch)
             } else {
                 return cached;
             }
        }
    }

    try {
        const prompt = `
            Tu es un expert mondial en pronostics football.
            Analyse le match : ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.league}).
            Date: ${match.date}.

            Utilise Google Search pour récupérer les DONNÉES RÉELLES à jour.
            IMPORTANT: Je ne veux PAS de données obsolètes. Cherche les résultats les plus récents.

            Données à récupérer :
            1. **FORME 10 MATCHS** : Récupère impérativement les résultats des **10 derniers matchs officiels** pour CHAQUE équipe. (W=Win, D=Draw, L=Loss).
            2. Absences/Blessures majeures actuelles.
            3. Historique H2H (5 derniers).
            4. Cotes réelles actuelles (si dispo).

            Ensuite, RAISONNE pour prédire le résultat le plus probable.

            Retourne un JSON STRICT :
            {
                "matchId": "${match.id}",
                "summary": "Résumé de l'analyse (contexte, forme sur 10 matchs, enjeux).",
                "homeWinProbability": 45,
                "drawProbability": 25,
                "awayWinProbability": 30,
                "scorePrediction": "Score exact probable (ex: 2-1)",
                "confidence": "Faible" | "Moyen" | "Élevé",
                "mainBet": "Le pari le plus sûr (ex: Victoire Real Madrid)",
                "alternativeBets": ["Alternative 1", "Alternative 2"],
                "keyFactors": ["Facteur 1", "Facteur 2", "Facteur 3"],
                "odds": { "home": 1.50, "draw": 3.40, "away": 4.20 },
                "homeLast10": ["W", "D", "L", "W", "W", "L", "W", "D", "W", "W"],
                "awayLast10": ["L", "L", "D", "W", "L", "L", "D", "W", "L", "L"],
                "h2h": [
                    { "date": "YYYY-MM-DD", "home": "Nom Team A", "away": "Nom Team B", "score": "X-Y", "winner": "home|away|draw" }
                ]
            }
            
            NOTE: "homeLast10" et "awayLast10" doivent être des tableaux de string. Le plus récent en premier (index 0) ou dernier, peu importe tant que c'est cohérent, mais liste bien 10 résultats.
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            },
        });

        const data = JSON.parse(response.text || "{}");
        
        // Validation basique
        if (!data.mainBet) throw new Error("Incomplete prediction");

        const result: PredictionResult = {
            matchId: match.id,
            summary: data.summary,
            homeWinProbability: data.homeWinProbability,
            drawProbability: data.drawProbability,
            awayWinProbability: data.awayWinProbability,
            scorePrediction: data.scorePrediction,
            confidence: data.confidence,
            mainBet: data.mainBet,
            alternativeBets: data.alternativeBets || [],
            keyFactors: data.keyFactors || [],
            odds: data.odds || { home: 0, draw: 0, away: 0 },
            sources: [],
            homeStats: data.homeStats,
            awayStats: data.awayStats,
            h2h: data.h2h || [],
            homeLast10: data.homeLast10 || [],
            awayLast10: data.awayLast10 || []
        };

        saveToCache(cacheKey, result, TTL.PREDICTION);
        return result;

    } catch (e) {
        console.error("Prediction Error", e);
        // Fallback minimal en cas d'erreur
        // On pourrait tenter de récupérer une vieille prédiction si existe
        const stale = getFromCache<PredictionResult>(cacheKey, true);
        if (stale) return stale;

        return {
            matchId: match.id,
            summary: "Analyse IA momentanément indisponible.",
            homeWinProbability: 33, drawProbability: 33, awayWinProbability: 33,
            scorePrediction: "?-?", confidence: 'Faible',
            mainBet: "N/A", alternativeBets: [], keyFactors: [], sources: []
        };
    }
};

export const fetchFootballNews = async (forceRefresh: boolean = false): Promise<NewsItem[]> => {
    if (!forceRefresh) {
        const cached = getFromCache<NewsItem[]>(CacheKeys.news);
        if (cached) return cached;
    }

    try {
        const prompt = `
            Trouve 9 actualités footballistiques MAJEURES et RÉCENTES en Europe (Aujourd'hui/Hier).
            Sujets : Résultats marquants, Blessures de stars, Rumeurs Mercato fiables.
            
            JSON Strict:
            [
                { "title": "Titre", "summary": "Résumé", "source": "Media", "tag": "Mercato|Blessure|Résultat|Club" }
            ]
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            },
        });

        const rawItems = JSON.parse(response.text || "[]");
        const newsItems: NewsItem[] = [];
        
        // Récupération des liens sources
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        let chunkIndex = 0;

        if (Array.isArray(rawItems)) {
            rawItems.forEach((item: any, i: number) => {
                let url = "#";
                if (chunks[chunkIndex]?.web?.uri) {
                    url = chunks[chunkIndex].web.uri;
                    chunkIndex++;
                }
                newsItems.push({
                    id: `news-${i}-${Date.now()}`,
                    title: item.title,
                    summary: item.summary,
                    source: item.source || "Web",
                    time: "Récent",
                    url: url,
                    tag: item.tag || "Info"
                });
            });
            saveToCache(CacheKeys.news, newsItems, TTL.NEWS);
            return newsItems;
        }
        return [];
    } catch (e) {
        const stale = getFromCache<NewsItem[]>(CacheKeys.news, true);
        if (stale) return stale;
        return [];
    }
};

export const fetchDailyCombo = async (targetOdds: number = 2, forceRefresh: boolean = false): Promise<ComboBet | null> => {
    if (!forceRefresh) {
        const cached = getFromCache<ComboBet>(CacheKeys.combo(targetOdds));
        if (cached) return cached;
    }

    try {
        const prompt = `
            Analyse les matchs de football d'AUJOURD'HUI et DEMAIN.
            Génère un ticket "Combiné" intelligent avec une cote totale proche de ${targetOdds}.
            Utilise les COTES RÉELLES des bookmakers pour tes calculs.

            Stratégie selon cote : 
            - ~2.00 : "Safe" (2 favoris solides).
            - ~5.00 : "Fun" (3-4 matchs intéressants).
            - 10+ : "Jackpot" (Surprises ou buteurs).

            JSON Strict:
            {
            "totalOdds": ${targetOdds},
            "confidence": "Moyenne",
            "reasoning": "Explication de la stratégie choisie.",
            "selections": [
                {
                    "match": "Team A vs Team B",
                    "selection": "Le pari (ex: Victoire Team A)",
                    "odds": 1.50,
                    "analysis": "Pourquoi ce choix ?",
                    "time": "HH:MM"
                }
            ]
            }
        `;
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            },
        });

        const data = JSON.parse(response.text || "[]");
        if (!data.selections || data.selections.length === 0) return null;

        saveToCache(CacheKeys.combo(targetOdds), data, TTL.COMBO);
        return data;
    } catch (e) {
        const stale = getFromCache<ComboBet>(CacheKeys.combo(targetOdds), true);
        if (stale) return stale;
        return null;
    }
};

export const chatWithAssistant = async (history: { role: string; parts: { text: string }[] }[], message: string): Promise<string> => {
    try {
        const chat = ai.chats.create({
            model: modelId,
            history: history,
            config: {
                tools: [{ googleSearch: {} }], // Le chat a accès au web aussi
                systemInstruction: "Tu es un assistant expert en football. Tu as accès aux résultats et stats en temps réel via Google Search. Sois précis, concis et utile pour les parieurs."
            }
        });

        const result = await chat.sendMessage({ message: message });
        return result.text || "Pas de réponse.";
    } catch (error) {
        console.error("Chat error:", error);
        return "Désolé, je ne peux pas accéder aux données pour le moment.";
    }
};

export const fetchLeagueStandings = async (leagueName: string, forceRefresh: boolean = false): Promise<StandingTeam[]> => {
    if (!forceRefresh) {
        const cached = getFromCache<StandingTeam[]>(CacheKeys.standing(leagueName));
        if (cached) return cached;
    }

    try {
        const prompt = `
            Trouve le classement actuel (Saison 2024-2025) pour la ligue : ${leagueName}.
            Utilise Google Search pour avoir les points exacts et à jour.
            
            JSON Strict:
            [
                { 
                    "rank": 1, 
                    "team": "Nom Equipe", 
                    "played": 10, 
                    "points": 25, 
                    "form": ["W", "D", "L", "W", "W"], 
                    "goalsFor": 20, 
                    "goalsAgainst": 5 
                }
            ]
            Limite aux 20 équipes. Forme = 5 derniers matchs (W=Win, D=Draw, L=Loss).
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            },
        });

        const text = response.text || "[]";
        // Nettoyage éventuel du code block
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        if (Array.isArray(data) && data.length > 0) {
            saveToCache(CacheKeys.standing(leagueName), data, TTL.STANDINGS);
            return data;
        }
        return [];
    } catch (e) {
        console.error("Standings Error", e);
        const stale = getFromCache<StandingTeam[]>(CacheKeys.standing(leagueName), true);
        if (stale) return stale;
        return [];
    }
};

export const searchEntityStats = async (query: string): Promise<EntityProfile | null> => {
    const cacheKey = CacheKeys.stats(query);
    const cached = getFromCache<EntityProfile>(cacheKey);
    if (cached) return cached;

    try {
        const prompt = `
            Cherche le profil footballistique de : "${query}".
            Détermine si c'est un JOUEUR ou une ÉQUIPE.
            
            Si Joueur: Stats saison en cours (Buts, Passes, Matchs).
            Si Équipe: Stats saison (Classement, Buts marqués/encaissés).
            
            JSON Strict:
            {
                "type": "PLAYER" | "TEAM",
                "name": "Nom complet",
                "subtitle": "Club actuel / Nationalité / Age (si joueur)",
                "description": "Courte biographie ou description stade/ville (si équipe). Max 2 phrases.",
                "image": "URL d'une image (logo ou portrait) si trouvable, sinon vide",
                "stats": [
                    { "label": "Buts", "value": 15 },
                    { "label": "Passes", "value": 7 }
                ],
                "recentResults": [
                    { "label": "vs Opposant", "result": "2-1" }
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            },
        });

        const text = response.text || "{}";
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        if (!data.name) return null;
        
        if (data.type === 'TEAM') {
            const logo = findLogo(data.name);
            if (logo && (!data.image || data.image.length < 10)) {
                data.image = logo;
            }
        }
        
        if (!data.image || !data.image.startsWith('http')) {
            data.image = getLogo(data.name);
        }

        const profile: EntityProfile = {
            type: data.type || 'TEAM',
            name: data.name,
            subtitle: data.subtitle || '',
            description: data.description || '',
            image: data.image,
            stats: data.stats || [],
            recentResults: data.recentResults || []
        };

        saveToCache(cacheKey, profile, TTL.STATS);
        return profile;

    } catch (e) {
        console.error("Entity Search Error", e);
        return null;
    }
};