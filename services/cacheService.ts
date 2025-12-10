interface CacheItem<T> {
  data: T;
  expiry: number; // Timestamp en ms
  createdAt: number; // Date de création
  version: string;
}

// CHANGEMENT: v3 pour API-Football
const CACHE_VERSION = 'v3_api_football'; 
const CACHE_PREFIX = 'pronosia_cache_';

// STRATÉGIE AGRESSIVE : On augmente les durées pour économiser les tokens
export const TTL = {
  MATCHES: 2 * 60 * 1000,        // 2 min (Pour avoir les scores LIVE et minutes à jour)
  PREDICTION: 24 * 60 * 60 * 1000, // 24 heures (Une fois analysé, le match change peu)
  STANDINGS: 24 * 60 * 60 * 1000,  // 24 heures (Les classements bougent peu)
  NEWS: 4 * 60 * 60 * 1000,      // 4 heures (On réduit la fréquence des news)
  STATS: 72 * 60 * 60 * 1000,    // 3 jours (Les profils d'équipes/joueurs sont statiques)
  COMBO: 4 * 60 * 60 * 1000      // 4 heures
};

export const CacheKeys = {
  UPCOMING_MATCHES: 'upcoming_matches',
  standing: (leagueId: number | string) => `standing_${leagueId}`,
  prediction: (matchId: string) => `pred_${matchId}`,
  teamStats: (teamId: string, leagueId: string) => `team_stats_${teamId}_${leagueId}`,
  odds: (matchId: string) => `odds_${matchId}`,
  news: 'football_news',
  stats: (query: string) => `stats_${query.replace(/\s+/g, '_').toLowerCase()}`,
  combo: (odds: number) => `daily_combo_odds_${odds}`
};

/**
 * Récupère une donnée du cache.
 * @param key Clé unique
 * @param ignoreExpiry Si true, renvoie la donnée même si elle est expirée (utile pour le fallback en cas d'erreur réseau)
 */
export const getFromCache = <T>(key: string, ignoreExpiry: boolean = false): T | null => {
  try {
    const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!itemStr) return null;

    const item: CacheItem<T> = JSON.parse(itemStr);

    if (item.version !== CACHE_VERSION) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    // Optimization: Si on demande explicitement d'ignorer l'expiration (pour fallback), on renvoie la donnée
    if (!ignoreExpiry && Date.now() > item.expiry) {
      // On ne supprime pas tout de suite, au cas où on en aurait besoin pour un fallback plus tard
      return null;
    }

    return item.data;
  } catch (e) {
    console.warn('Cache read error', e);
    return null;
  }
};

/**
 * Récupère les métadonnées d'un item du cache (utile pour l'invalidation intelligente)
 */
export const getCacheMetadata = (key: string): { createdAt: number, expiry: number } | null => {
    try {
        const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`);
        if (!itemStr) return null;
        const item = JSON.parse(itemStr);
        return { createdAt: item.createdAt || 0, expiry: item.expiry || 0 };
    } catch {
        return null;
    }
};

/**
 * Nettoie le cache intelligemment pour libérer de l'espace
 * sans supprimer les données utilisateur (Bankroll, Historique).
 */
const pruneCache = () => {
    try {
        const keysToRemove: { key: string, expiry: number }[] = [];
        
        // 1. Identifier uniquement nos clés de cache
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const item = JSON.parse(localStorage.getItem(key) || '{}');
                    if (item.expiry) {
                        keysToRemove.push({ key, expiry: item.expiry });
                    } else {
                        // Donnée corrompue ou vieux format
                        keysToRemove.push({ key, expiry: 0 });
                    }
                } catch {
                    keysToRemove.push({ key, expiry: 0 });
                }
            }
        }

        // 2. Trier par date d'expiration (les plus vieux/expirés en premier)
        keysToRemove.sort((a, b) => a.expiry - b.expiry);

        // 3. Supprimer les 30% les plus anciens
        const countCurrent = keysToRemove.length;
        const countToDelete = Math.ceil(countCurrent * 0.3);

        for (let i = 0; i < countToDelete; i++) {
            localStorage.removeItem(keysToRemove[i].key);
        }
        
        console.log(`Cache pruned: ${countToDelete} items removed.`);

    } catch (e) {
        console.error("Failed to prune cache", e);
    }
};

export const saveToCache = <T>(key: string, data: T, ttl: number): void => {
  try {
    const item: CacheItem<T> = {
      data,
      expiry: Date.now() + ttl,
      createdAt: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (e) {
    console.warn('Cache write error (quota exceeded). Pruning...', e);
    try {
        // Au lieu de tout vider (dangereux pour la bankroll), on nettoie intelligemment
        pruneCache();
        
        // On réessaie une fois
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
            data,
            expiry: Date.now() + ttl,
            createdAt: Date.now(),
            version: CACHE_VERSION,
        }));
    } catch(err) {
        console.error("Cache critical failure after pruning", err);
    }
  }
};

export const clearCacheKey = (key: string) => {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
};