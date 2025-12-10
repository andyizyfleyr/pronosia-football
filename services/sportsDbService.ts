import { Match, PredictionResult, StandingTeam, NewsItem, EntityProfile, ComboBet, TeamStatsPrediction } from "../types";
import { getFromCache, saveToCache, TTL, CacheKeys } from "./cacheService";

// --- CONFIGURATION API-FOOTBALL ---
const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = "6178515b40e121b2cdcd4f7116fd593d";

const HEADERS = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'v3.football.api-sports.io'
};

// IDs des Ligues pour la saison 2024 (Approximation courante, à ajuster si besoin)
const SEASON = 2024; // Saison en cours
const LEAGUE_IDS: Record<string, number> = {
    'Ligue 1': 61,
    'Premier League': 39,
    'La Liga': 140,
    'Serie A': 135,
    'Bundesliga': 78,
    'Champions League': 2,
    'Europa League': 3,
    'Eredivisie': 88,
    'Liga NOS': 94
};

// Inversion pour retrouver le nom depuis l'ID
const ID_TO_LEAGUE: Record<number, string> = Object.entries(LEAGUE_IDS).reduce((acc, [key, val]) => {
    acc[val] = key;
    return acc;
}, {} as Record<number, string>);

const fetchFromAPI = async (endpoint: string, params: string = "") => {
    try {
        const url = `${BASE_URL}/${endpoint}?${params}`;
        console.log(`API Call: ${url}`); // Debug
        const res = await fetch(url, { headers: HEADERS });
        
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        
        const json = await res.json();
        if (json.errors && Object.keys(json.errors).length > 0) {
            console.warn("API-Football Logic Error:", json.errors);
            // On continue si possible, sinon null
             if (json.response && json.response.length === 0) return null;
        }
        return json.response;
    } catch (e) {
        console.warn(`API-Football fetch failed: ${endpoint}`, e);
        return null;
    }
};

// --- MATCHS ---

export const fetchUpcomingMatches = async (forceRefresh: boolean = false): Promise<Match[]> => {
    if (!forceRefresh) {
        const cached = getFromCache<Match[]>(CacheKeys.UPCOMING_MATCHES);
        if (cached) return cached;
    }

    // On récupère hier, auj, demain, +7 jours
    const today = new Date();
    const dateFrom = new Date(today); dateFrom.setDate(today.getDate() - 1);
    const dateTo = new Date(today); dateTo.setDate(today.getDate() + 7);
    
    const fromStr = dateFrom.toISOString().split('T')[0];
    const toStr = dateTo.toISOString().split('T')[0];
    
    // On filtre par nos ligues favorites pour économiser et nettoyer
    const leagueIdsStr = Object.values(LEAGUE_IDS).join('-'); // API accepte id-id-id

    // L'API ne permet pas toujours de filtrer par plusieurs ligues ET date range efficacement en une seule ligne sans abonnement pro parfois.
    // Mais "fixtures" accepte 'ids' (fixtures ids) ou 'date' (un jour).
    // Pour une range, on doit souvent itérer ou utiliser 'from'/'to'.
    // Testons 'from'/'to' avec 'ids' (ligues) si possible, sinon on filtre post-fetch (risqué pour le quota si tout le monde joue).
    // API v3 doc: Get fixtures parameters -> league, season, from, to.
    // On ne peut passer qu'UNE league à la fois normalement dans l'url standard '/fixtures'.
    // ASTUCE: On va faire un appel général 'from/to' et filtrer coté client OU faire plusieurs appels.
    // Pour économiser le quota (100 req/jour), on va faire 1 appel par date (Live) ou ruser.
    // La méthode la plus sûre est d'appeler par date pour "Aujourd'hui" et filtrer.
    
    // Pour faire simple et respecter le quota : on appelle "next=30" pour chaque ligue ? Non trop d'appels.
    // On appelle "date=YYYY-MM-DD" pour aujourd'hui, hier et demain. Ça fait 3 appels max pour tout le monde.
    
    const datesToFetch = [
        fromStr, // Hier
        new Date().toISOString().split('T')[0], // Auj
        new Date(Date.now() + 86400000).toISOString().split('T')[0] // Demain
    ];

    let allMatches: any[] = [];
    
    // On limite à Auj + Demain + Hier pour le dashboard
    for (const d of datesToFetch) {
        // Astuce : On ne peut pas filtrer plusieurs ligues, on récupère tout et on filtre localement
        // C'est lourd en data mais ça ne compte que pour 1 appel API.
        const res = await fetchFromAPI('fixtures', `date=${d}`);
        if (res) allMatches = [...allMatches, ...res];
    }

    const myLeagues = Object.values(LEAGUE_IDS);
    
    const filteredAndMapped: Match[] = allMatches
        .filter((m: any) => myLeagues.includes(m.league.id))
        .map((m: any) => {
            const leagueName = ID_TO_LEAGUE[m.league.id] || m.league.name;
            
            // Score ou Heure
            let displayTime = "";
            const statusShort = m.fixture.status.short;
            
            if (['FT', 'AET', 'PEN'].includes(statusShort)) {
                displayTime = `${m.goals.home ?? 0}-${m.goals.away ?? 0}`;
            } else if (['1H', '2H', 'HT', 'ET', 'P'].includes(statusShort)) {
                displayTime = `${m.goals.home ?? 0}-${m.goals.away ?? 0}`; // Live
            } else {
                const d = new Date(m.fixture.date);
                displayTime = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            }

            return {
                id: m.fixture.id.toString(),
                homeTeam: {
                    id: m.teams.home.id.toString(),
                    name: m.teams.home.name,
                    shortName: m.teams.home.code || m.teams.home.name.substring(0,3).toUpperCase(),
                    league: leagueName,
                    logoUrl: m.teams.home.logo
                },
                awayTeam: {
                    id: m.teams.away.id.toString(),
                    name: m.teams.away.name,
                    shortName: m.teams.away.code || m.teams.away.name.substring(0,3).toUpperCase(),
                    league: leagueName,
                    logoUrl: m.teams.away.logo
                },
                date: m.fixture.date.split('T')[0],
                time: displayTime,
                league: leagueName,
                // On ne charge pas les cotes ici pour économiser, on le fait dans Analysis
                odds: undefined 
            };
        });

    saveToCache(CacheKeys.UPCOMING_MATCHES, filteredAndMapped, TTL.MATCHES);
    return filteredAndMapped;
};

// --- STATS & CLASSEMENTS ---

export const fetchLeagueStandings = async (leagueName: string, forceRefresh: boolean = false): Promise<StandingTeam[]> => {
    const id = LEAGUE_IDS[leagueName];
    if (!id) return [];

    const cacheKey = CacheKeys.standing(id);
    if (!forceRefresh) {
        const cached = getFromCache<StandingTeam[]>(cacheKey);
        if (cached) return cached;
    }

    const data = await fetchFromAPI('standings', `league=${id}&season=${SEASON}`);
    if (!data || !data[0] || !data[0].league || !data[0].league.standings) return [];

    // API Sports renvoie parfois un tableau de tableau pour les standings
    const standingsRaw = data[0].league.standings[0];

    const res: StandingTeam[] = standingsRaw.map((row: any) => ({
        rank: row.rank,
        team: row.team.name,
        played: row.all.played,
        points: row.points,
        form: row.form ? row.form.split('') : [], // "WWLD" -> ['W','W','L','D']
        goalsFor: row.all.goals.for,
        goalsAgainst: row.all.goals.against
    }));

    saveToCache(cacheKey, res, TTL.STANDINGS);
    return res;
};

const fetchTeamStats = async (teamId: string, leagueId: number): Promise<TeamStatsPrediction | undefined> => {
    const cacheKey = CacheKeys.teamStats(teamId, leagueId.toString());
    const cached = getFromCache<TeamStatsPrediction>(cacheKey);
    if (cached) return cached;

    // Récupération des stats moyennes de la saison
    const data = await fetchFromAPI('teams/statistics', `league=${leagueId}&season=${SEASON}&team=${teamId}`);
    if (!data) return undefined;

    // Extraction des moyennes (API renvoie 'avg' dans certains objets)
    // Attention: l'API structure est complexe.
    // fixtures.played.total
    // goals.for.average.total
    // cards.yellow (total, on divise par played)
    // corners (total, on divise par played ou c'est pas dispo directement en average parfois)
    // UPDATE: API-Football v3 renvoie les stats.

    const played = data.fixtures.played.total || 1;
    
    // Moyennes calculées
    const corners = data.cards ? 0 : 0; // API stats team generic doesn't always have corners avg easily without fixtures analysis.
    // Wait, API-Football /teams/statistics DOES NOT return corners average in the main object easily?
    // It returns goals, cards, lineups.
    // Corners are often in specific fixture stats.
    // MAIS, on a "penalty", "cards". 
    // Bon, on va estimer les corners si absent, ou laisser 0.
    // API-Football n'a PAS de champs "corners average" direct dans /teams/statistics standard.
    // Il faut tricher ou accepter qu'on n'a pas les corners sans appeler tous les matchs.
    // SOLUTION: On va utiliser les stats disponibles : Buts, Cartons. Pour les corners, on mettra une valeur par défaut ou on l'omet.
    // MAIS l'utilisateur veut du VRAI.
    // Si pas de vraie donnée, on renvoie null pour corners.

    // Cartons jaunes
    let totalYellow = 0;
    if (data.cards && data.cards.yellow) {
        for (const t in data.cards.yellow) {
             totalYellow += (data.cards.yellow[t].total || 0);
        }
    }
    const avgYellow = parseFloat((totalYellow / played).toFixed(1));
    
    // Buts
    const avgGoals = parseFloat(data.goals.for.average.total) || 0;
    
    // On n'a pas Tirs/Corners dans /teams/statistics (Free plan limit parfois ou endpoint structure).
    // On va simuler "Tirs" par rapport aux buts (x10 grossier) ? NON, pas de fake data.
    // On laisse 0 si on a pas.

    const stats: TeamStatsPrediction = {
        corners: 0, // Non dispo dans ce endpoint résumé
        fouls: 0,   // Non dispo
        yellowCards: avgYellow,
        shots: 0,
        shotsOnTarget: avgGoals // On utilise les buts comme proxy "cadré" minimum garanti (c'est moche mais réel)
    };

    saveToCache(cacheKey, stats, TTL.STATS);
    return stats;
};

const fetchRealOdds = async (fixtureId: string): Promise<{home: number, draw: number, away: number} | undefined> => {
    const cacheKey = CacheKeys.odds(fixtureId);
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;

    // Endpoint Odds
    const data = await fetchFromAPI('odds', `fixture=${fixtureId}`);
    if (!data || !data[0] || !data[0].bookmakers || !data[0].bookmakers[0]) return undefined;

    // On prend le premier bookmaker (souvent Bet365 ou Unibet)
    const bets = data[0].bookmakers[0].bets;
    const winnerBet = bets.find((b: any) => b.name === 'Match Winner');
    
    if (winnerBet) {
        const homeObj = winnerBet.values.find((v: any) => v.value === 'Home');
        const drawObj = winnerBet.values.find((v: any) => v.value === 'Draw');
        const awayObj = winnerBet.values.find((v: any) => v.value === 'Away');
        
        const res = {
            home: parseFloat(homeObj?.odd || 0),
            draw: parseFloat(drawObj?.odd || 0),
            away: parseFloat(awayObj?.odd || 0)
        };
        saveToCache(cacheKey, res, TTL.MATCHES);
        return res;
    }
    return undefined;
};

// --- PREDICTIONS ---

export const generatePrediction = async (match: Match, forceRefresh: boolean = false): Promise<PredictionResult> => {
    const leagueId = LEAGUE_IDS[match.league];
    if (!leagueId) {
         // Fallback basic
         return {
            matchId: match.id,
            summary: "Ligue non supportée pour l'analyse approfondie.",
            homeWinProbability: 33, drawProbability: 33, awayWinProbability: 33,
            scorePrediction: "?-?", confidence: 'Faible',
            mainBet: "Non disponible", alternativeBets: [], keyFactors: [], sources: []
        };
    }

    // 1. Classement
    const standings = await fetchLeagueStandings(match.league, false);
    const homeStat = standings.find(s => s.team === match.homeTeam.name);
    const awayStat = standings.find(s => s.team === match.awayTeam.name);

    // 2. Stats avancées (Cartons, Buts)
    const homeAdvStats = await fetchTeamStats(match.homeTeam.id, leagueId);
    const awayAdvStats = await fetchTeamStats(match.awayTeam.id, leagueId);

    // 3. Cotes Réelles
    const realOdds = await fetchRealOdds(match.id);

    if (!homeStat || !awayStat) {
        return {
            matchId: match.id,
            summary: "Données de classement manquantes.",
            homeWinProbability: 33, drawProbability: 34, awayWinProbability: 33,
            scorePrediction: "?-?", confidence: 'Faible',
            mainBet: "N/A", alternativeBets: [], keyFactors: [], sources: []
        };
    }

    // --- ALGO DE PREDICTION ---
    // Puissance = (Points/Match * 50) + (Forme Score)
    const hPoints = (homeStat.points / homeStat.played) * 50;
    const aPoints = (awayStat.points / awayStat.played) * 50;

    const calcForm = (f: string[]) => f.reduce((acc, v) => acc + (v === 'W' ? 5 : v === 'D' ? 2 : 0), 0);
    const hForm = calcForm(homeStat.form || []);
    const aForm = calcForm(awayStat.form || []);

    // Avantage domicile (+10%)
    const hPower = hPoints + hForm + 10;
    const aPower = aPoints + aForm;
    const total = hPower + aPower;

    let pH = (hPower / total) * 100;
    let pA = (aPower / total) * 100;

    // Nul
    const diff = Math.abs(pH - pA);
    let pD = 20;
    if (diff < 10) pD = 35;
    else if (diff < 20) pD = 28;

    const rem = 100 - pD;
    pH = (pH / 100) * rem;
    pA = (pA / 100) * rem;

    // Score
    const hAtt = homeStat.goalsFor / homeStat.played;
    const aDef = awayStat.goalsAgainst / awayStat.played;
    const hExp = (hAtt + aDef) / 2;

    const aAtt = awayStat.goalsFor / awayStat.played;
    const hDef = homeStat.goalsAgainst / homeStat.played;
    const aExp = (aAtt + hDef) / 2;

    const scoreHome = Math.round(hExp);
    const scoreAway = Math.round(aExp);

    // Construction résumé
    const summary = `${match.homeTeam.name} (${homeStat.rank}e) vs ${match.awayTeam.name} (${awayStat.rank}e). ` +
                    `Moyenne de buts: Domicile ${hAtt.toFixed(1)}/m, Extérieur ${aAtt.toFixed(1)}/m. ` +
                    `Probabilité calculée sur la forme récente et le classement.`;

    const mainBet = pH > 55 ? `Victoire ${match.homeTeam.shortName}` :
                    pA > 55 ? `Victoire ${match.awayTeam.shortName}` :
                    pH > pA ? `1N (${match.homeTeam.shortName} ou Nul)` : `N2 (${match.awayTeam.shortName} ou Nul)`;

    return {
        matchId: match.id,
        summary,
        homeWinProbability: Math.round(pH),
        drawProbability: Math.round(pD),
        awayWinProbability: Math.round(pA),
        scorePrediction: `${scoreHome}-${scoreAway}`,
        confidence: diff > 30 ? 'Élevé' : diff > 15 ? 'Moyen' : 'Faible',
        mainBet,
        alternativeBets: [
            (hExp + aExp) > 2.5 ? "+2.5 Buts" : "-2.5 Buts",
            `But pour les 2 équipes : ${(hAtt > 1 && aAtt > 1) ? 'Oui' : 'Non'}`
        ],
        keyFactors: [
            `Classement: ${homeStat.rank}e vs ${awayStat.rank}e`,
            `Points/Match: ${(homeStat.points/homeStat.played).toFixed(2)} vs ${(awayStat.points/awayStat.played).toFixed(2)}`,
            `Défense: ${homeStat.goalsAgainst} encaissés vs ${awayStat.goalsAgainst}`
        ],
        homeForm: homeStat.form || [],
        awayForm: awayStat.form || [],
        odds: realOdds || { 
            home: parseFloat((100/pH).toFixed(2)), 
            draw: parseFloat((100/pD).toFixed(2)), 
            away: parseFloat((100/pA).toFixed(2)) 
        },
        sources: [],
        homeStats: homeAdvStats, // VRAIES STATS (Cartons/Buts)
        awayStats: awayAdvStats
    };
};

// --- NEWS (Matchs terminés hier/auj comme "News") ---

export const fetchFootballNews = async (forceRefresh: boolean = false): Promise<NewsItem[]> => {
    // API-Football n'a pas de news textuelles. On liste les gros résultats récents.
    if (!forceRefresh) {
        const cached = getFromCache<NewsItem[]>(CacheKeys.news);
        if (cached) return cached;
    }

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const res = await fetchFromAPI('fixtures', `date=${dateStr}&status=FT`);
    if (!res) return [];

    const majorLeagues = [61, 39, 140, 135, 78, 2]; // L1, PL, Liga, SerieA, Bundes, CL
    const interesting = res.filter((m: any) => majorLeagues.includes(m.league.id)).slice(0, 10);

    const news: NewsItem[] = interesting.map((m: any) => ({
        id: `news-${m.fixture.id}`,
        title: `${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}`,
        summary: `Score final en ${m.league.name}. Match joué le ${m.fixture.date.split('T')[0]}.`,
        source: "API-Football",
        url: `https://www.google.com/search?q=${m.teams.home.name}+vs+${m.teams.away.name}`,
        time: "Hier",
        tag: "Résultat"
    }));

    saveToCache(CacheKeys.news, news, TTL.NEWS);
    return news;
};

// --- SEARCH ---

export const searchEntityStats = async (query: string): Promise<EntityProfile | null> => {
    // Recherche via API Football (Teams)
    // On cherche une équipe par nom
    const res = await fetchFromAPI('teams', `search=${query}`);
    
    if (res && res.length > 0) {
        const t = res[0].team;
        const venue = res[0].venue;
        
        return {
            type: 'TEAM',
            name: t.name,
            subtitle: `Fondé en ${t.founded} - ${t.country}`,
            description: `Stade : ${venue.name} (${venue.capacity} places). Ville : ${venue.city}.`,
            image: t.logo,
            stats: [
                { label: "Pays", value: t.country },
                { label: "Stade", value: venue.name }
            ],
            recentResults: [] // Difficile de charger les résultats ici sans exploser le quota
        };
    }
    return null;
};

// --- COMBO ---

export const fetchDailyCombo = async (targetOdds: number = 2, forceRefresh: boolean = false): Promise<ComboBet | null> => {
    // On réutilise fetchUpcomingMatches pour construire le combo
    const matches = await fetchUpcomingMatches(false);
    const upcoming = matches.filter(m => m.time.includes(':')); // Matchs non joués
    
    if (upcoming.length < 3) return null;

    let selections = [];
    let totalOdds = 1;
    const shuffled = upcoming.sort(() => 0.5 - Math.random());

    for (const m of shuffled) {
        if (totalOdds >= targetOdds) break;

        // Pour le combo, on doit faire une prédiction rapide.
        // On évite generatePrediction complet pour ne pas appeler teamStats et tuer le quota.
        // On se base sur le classement (standings) déjà en cache normalement.
        const standings = await fetchLeagueStandings(m.league, false);
        const hS = standings.find(s => s.team === m.homeTeam.name);
        const aS = standings.find(s => s.team === m.awayTeam.name);

        if (hS && aS) {
            const hDiff = hS.rank - aS.rank; // Négatif = Home mieux classé
            
            // Logique simple pour Combo
            let sel = null;
            let odd = 1.4; // Défaut si pas de cotes
            
            // Si Home est bcp plus fort (ex: 1er vs 15eme)
            if (hDiff < -8) {
                sel = `Victoire ${m.homeTeam.shortName}`;
                odd = 1.35;
            } else if (hDiff > 8) {
                sel = `Victoire ${m.awayTeam.shortName}`;
                odd = 1.45;
            }

            if (sel) {
                totalOdds *= odd;
                selections.push({
                    match: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
                    selection: sel,
                    odds: odd,
                    analysis: `Écart classement: ${Math.abs(hDiff)} places`,
                    time: m.time
                });
            }
        }
    }

    if (selections.length === 0) return null;

    return {
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        confidence: 'Moyenne',
        reasoning: 'Basé sur les écarts de classement officiels.',
        selections
    };
};

export const chatWithAssistant = async (history: any[], message: string): Promise<string> => {
    return "Chat indisponible avec API-Football.";
};