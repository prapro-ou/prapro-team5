import type { FactionType, SupportSystemState } from './support';

export interface GameStats {
  level: number; 
  money: number;
  population: number;
  satisfaction: number;
  happinessPenalty?: number; // 満足度減少ペナルティ（警察署などの効果範囲外）
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
  // 支持率システムの状態
  supportSystem: SupportSystemState;
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
  // 前年度の統計データ（前年比計算用）
  previousYearStats: {
    year: number;
    totalTaxRevenue: number;       // 前年度税収
    totalMaintenanceCost: number;  // 前年度維持費
    populationGrowth: number;      // 前年度人口増加
    facilityCount: number;         // 前年度施設数
    infrastructureEfficiency: number; // 前年度インフラ効率
  } | null;
  // 前年度の評価データ（前年比計算用）
  previousYearEvaluation: {
    year: number;
    developmentScore: number;      // 前年度発展度合い
    approvalRating: number;        // 前年度支持率
    satisfactionScore: number;     // 前年度満足度スコア
    missionCompletion: number;     // 前年度ミッション達成数
    totalScore: number;            // 前年度総合評価スコア
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'E'; // 前年度評価等級
    subsidy: number;               // 前年度補助金額
  } | null;
  // 月次データの累積（年次統計計算用）
  monthlyAccumulation: {
    year: number;
    monthlyTaxRevenue: number[];      // 月次税収の配列（12ヶ月分）
    monthlyMaintenanceCost: number[]; // 月次維持費の配列（12ヶ月分）
    monthlyPopulation: number[];      // 月次人口の配列（12ヶ月分）
    monthlySatisfaction: number[];    // 月次満足度の配列（12ヶ月分）
    monthlySupportRatings: Record<FactionType, number[]>; // 月次支持率の配列（12ヶ月分）
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
