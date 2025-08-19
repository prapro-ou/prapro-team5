export interface GameStats {
  level: number; 
  money: number;
  population: number;
  satisfaction: number;
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
  // 月次収支情報
  monthlyBalance: {
    income: number;
    expense: number;
    balance: number;
  };
  // 年次評価データ
  yearlyEvaluation: {
    year: number;
    developmentScore: number;      // 発展度合い（0-100）
    approvalRating: number;        // 支持率（0-100）（未実装）
    satisfactionScore: number;     // 満足度スコア（0-100）
    missionCompletion: number;     // ミッション達成数（未実装）
    totalScore: number;            // 総合評価スコア（0-100）
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'E'; // 評価等級
    subsidy: number;               // 補助金額
  } | null;
  // 年次統計データ
  yearlyStats: {
    year: number;
    totalTaxRevenue: number;       // 年間税収
    totalMaintenanceCost: number;  // 年間維持費
    populationGrowth: number;      // 年間人口増加
    facilityCount: number;         // 年末時点の施設数
    infrastructureEfficiency: number; // インフラ効率
  } | null;
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
