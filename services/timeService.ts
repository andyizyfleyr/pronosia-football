// Ce service simule une autorité de temps serveur (UTC).
// Dans une vraie app, getServerTime() ferait un fetch('/api/time').

export const getServerTime = (): Date => {
    // On force l'utilisation de l'heure UTC pour éviter les triches locales
    const now = new Date();
    return new Date(now.toISOString());
};

/**
 * Convertit les dates "Aujourd'hui/Demain" ou "YYYY-MM-DD" + "HH:MM" 
 * en un objet Date UTC strict.
 */
export const parseMatchTime = (dateStr: string, timeStr: string): Date => {
    const now = getServerTime();
    let targetDate = new Date(now);

    // Normalisation de la date
    if (dateStr.toLowerCase().includes('aujourd')) {
        // Garder la date d'aujourd'hui
    } else if (dateStr.toLowerCase().includes('demain')) {
        targetDate.setDate(targetDate.getDate() + 1);
    } else if (dateStr.toLowerCase().includes('hier')) {
        targetDate.setDate(targetDate.getDate() - 1);
    } else {
        // Format YYYY-MM-DD
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            targetDate = parsed;
        }
    }

    // Normalisation de l'heure (HH:MM)
    // Si c'est un score (ex "2-1"), timeStr.split(':') peut donner un truc bizarre, on gère.
    if (timeStr && timeStr.includes(':') && !timeStr.includes('-')) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        targetDate.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
        // C'est un score ou un texte, on met à midi par défaut pour le tri, 
        // ou fin de journée si c'est hier pour être sûr qu'il est "passé"
        if (dateStr.toLowerCase().includes('hier')) {
             targetDate.setHours(23, 59, 59, 0);
        } else {
             targetDate.setHours(12, 0, 0, 0);
        }
    }

    return targetDate;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

export const getDayLabel = (date: Date): 'YESTERDAY' | 'TODAY' | 'TOMORROW' | 'OTHER' => {
    const now = getServerTime();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);

    if (isSameDay(date, now)) return 'TODAY';
    if (isSameDay(date, yesterday)) return 'YESTERDAY';
    if (isSameDay(date, tomorrow)) return 'TOMORROW';
    return 'OTHER';
};

export type MatchTimeStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

export const getMatchStatusByServerTime = (matchDate: Date): MatchTimeStatus => {
    const serverNow = getServerTime();
    const diffMs = matchDate.getTime() - serverNow.getTime();
    const diffMins = diffMs / (1000 * 60);

    // Si le match était hier, c'est FINISHED
    const dayLabel = getDayLabel(matchDate);
    if (dayLabel === 'YESTERDAY') return 'FINISHED';

    // Logique serveur stricte pour aujourd'hui/demain
    if (diffMins > 0) return 'UPCOMING';
    if (diffMins <= 0 && diffMins >= -130) return 'LIVE'; // Match dure env 130min (avec mi-temps)
    return 'FINISHED';
};

export const getTimeRemaining = (targetDate: Date): string => {
    const serverNow = getServerTime();
    const diff = targetDate.getTime() - serverNow.getTime();

    if (diff <= 0) return "00:00:00";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const isBetValid = (matchDate: Date): boolean => {
    const serverNow = getServerTime();
    // On ferme les paris 5 minutes avant le coup d'envoi pour éviter la latence
    return matchDate.getTime() > (serverNow.getTime() + 5 * 60 * 1000);
};