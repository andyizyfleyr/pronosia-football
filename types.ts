export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string; // Using placeholder or simple colors
  league: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  league: string;
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface H2HMatch {
  date: string;
  home: string;
  away: string;
  score: string;
  winner: 'home' | 'away' | 'draw';
}

export interface TeamStatsPrediction {
  corners: number;
  fouls: number;
  yellowCards: number;
  shots: number;
  shotsOnTarget: number;
}

export interface PredictionResult {
  matchId: string;
  summary: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  keyFactors: string[];
  scorePrediction: string;
  sources: GroundingSource[]; // Kept in type for internal logic but not displayed
  homeForm?: string[]; // Kept for backward compatibility
  awayForm?: string[];
  homeLast10?: string[]; // New: Last 10 matches form
  awayLast10?: string[]; // New: Last 10 matches form
  confidence?: 'Faible' | 'Moyen' | 'Élevé';
  mainBet?: string;
  alternativeBets?: string[];
  h2h?: H2HMatch[];
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
  // New Detailed Stats
  homeStats?: TeamStatsPrediction;
  awayStats?: TeamStatsPrediction;
}

export interface ComboSelection {
    match: string;
    selection: string;
    odds: number;
    analysis: string;
    time: string;
}

export interface ComboBet {
    totalOdds: number;
    confidence: string;
    reasoning: string;
    selections: ComboSelection[];
}

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  ANALYSIS = 'ANALYSIS',
  HISTORY = 'HISTORY',
  NEWS = 'NEWS',
  COMBO = 'COMBO',
  RESULTS = 'RESULTS'
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  time: string;
  tag: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface StandingTeam {
  rank: number;
  team: string;
  played: number;
  points: number;
  form: string[];
  goalsFor: number;
  goalsAgainst: number;
}

export interface EntityProfile {
  type: 'PLAYER' | 'TEAM';
  name: string;
  subtitle: string;
  description: string;
  image?: string;
  stats: { label: string; value: string | number }[];
  recentResults: { label: string; result: string }[];
}