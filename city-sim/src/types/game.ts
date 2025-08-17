export interface GameStats {
  level: number; 
  money: number;
  population: number;
  satisfaction: number;
  // 新規資源
  workforce: number;   // 労働力（自動計算 or 表示用）
  goods: number;       // 製品（工業生産・商業消費）
  // 労働力配分情報
  workforceAllocations: {
    facilityId: string;
    facilityType: string;      // 施設タイプ
    position: { x: number; y: number }; // 位置情報
    assignedWorkforce: number;
    efficiency: number;
  }[];
  date: {
    year: number;
    month: number;
    week: number;
    totalWeeks: number; // ゲーム開始からの通算週数
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
