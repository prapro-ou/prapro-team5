export interface GameStats {
  money: number;
  population: number;
  satisfaction: number;
  date: {
    year: number;
    month: number;
  };
}

export interface GameState {
  stats: GameStats;
  isPaused: boolean;
  gameSpeed: number;
}