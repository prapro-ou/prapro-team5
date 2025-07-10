export interface GameStats {
  level: number; 
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

export interface GameConfig {
  initialMoney: number;
  maxPopulation: number;
  gameSpeedOptions: number[];
}
