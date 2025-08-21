import { create } from 'zustand';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility';
import type { FactionType } from '../types/support';
import { saveLoadRegistry } from './SaveLoadRegistry';

// 年次統計データの型定義
export interface YearlyStats {
  year: number;
  totalTaxRevenue: number;       // 年間税収
  totalMaintenanceCost: number;  // 年間維持費
  populationGrowth: number;      // 年間人口増加
  facilityCount: number;         // 年末時点の施設数
  infrastructureEfficiency: number; // インフラ効率
}

// 年末評価データの型定義
export interface YearlyEvaluation {
  year: number;
  developmentScore: number;      // 発展度合い（0-100）
  approvalRating: number;        // 支持率（0-100）
  satisfactionScore: number;     // 満足度スコア（0-100）
  missionCompletion: number;     // ミッション達成数（未実装）
  totalScore: number;            // 総合評価スコア（0-100）
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'E'; // 評価等級
  subsidy: number;               // 補助金額
}

interface YearlyEvaluationStore {
  // 年次統計データの計算
  calculateYearlyStats: (stats: GameStats, facilities: Facility[]) => YearlyStats;
  
  // 発展度合いの計算（人口増加率、施設数増加、経済成長率）
  calculateDevelopmentScore: (yearlyStats: YearlyStats, previousYearStats?: YearlyStats) => number;
  
  // 支持率の計算
  calculateApprovalRating: (stats: GameStats) => number;
  
  // 満足度スコアの計算（年間平均満足度、公園効果、工業区画の影響）
  calculateSatisfactionScore: (stats: GameStats, facilities: Facility[]) => number;
  
  // ミッション達成数の計算
  calculateMissionCompletion: () => number;
  
  // 総合評価スコアの計算
  calculateTotalScore: (development: number, approval: number, satisfaction: number, mission: number) => number;
  
  // 評価等級の決定
  determineGrade: (totalScore: number) => 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
  
  // 補助金額の計算
  calculateSubsidy: (totalScore: number, level: number, population: number) => number;
  
  // 年末評価の実行
  executeYearlyEvaluation: (stats: GameStats, facilities: Facility[]) => YearlyEvaluation;
  
  // セーブ・ロード機能
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}

export const useYearlyEvaluationStore = create<YearlyEvaluationStore>((_set, get) => ({
  // 年次統計データの計算
  calculateYearlyStats: (stats: GameStats, facilities: Facility[]): YearlyStats => {
    // 累積された月次データから年次統計を計算
    const { monthlyAccumulation } = stats;
    
    // 年間税収の合計
    const totalTaxRevenue = monthlyAccumulation.monthlyTaxRevenue.reduce((sum, revenue) => sum + revenue, 0);
    
    // 年間維持費の合計
    const totalMaintenanceCost = monthlyAccumulation.monthlyMaintenanceCost.reduce((sum, cost) => sum + cost, 0);
    
    // 年間人口増加（1月と12月の差）
    const populationGrowth = monthlyAccumulation.monthlyPopulation[11] - monthlyAccumulation.monthlyPopulation[0];
    
    // インフラ効率の計算（活動中の施設の割合）
    const activeFacilities = facilities.filter(f => f.isActive).length;
    const totalFacilities = facilities.length;
    const infrastructureEfficiency = totalFacilities > 0 ? activeFacilities / totalFacilities : 0;
    
    return {
      year: stats.date.year,
      totalTaxRevenue,
      totalMaintenanceCost,
      populationGrowth,
      facilityCount: totalFacilities,
      infrastructureEfficiency
    };
  },
  
  // 発展度合いの計算（40点満点）
  calculateDevelopmentScore: (yearlyStats: YearlyStats, previousYearStats?: YearlyStats): number => {
    let score = 0;
    
    if (previousYearStats) {
      // 人口増加率（15点）
      if (previousYearStats.populationGrowth > 0) {
        const growthRate = yearlyStats.populationGrowth / previousYearStats.populationGrowth;
        score += Math.min(15, Math.floor(growthRate * 10));
      }
      
      // 施設数増加（15点）
      if (previousYearStats.facilityCount > 0) {
        const facilityGrowth = yearlyStats.facilityCount - previousYearStats.facilityCount;
        score += Math.min(15, Math.max(0, facilityGrowth * 2));
      }
      
      // 経済成長率（10点）
      if (previousYearStats.totalTaxRevenue > 0) {
        const revenueGrowth = yearlyStats.totalTaxRevenue / previousYearStats.totalTaxRevenue;
        score += Math.min(10, Math.floor(revenueGrowth * 5));
      }
    }
    else {
      // 初年度の場合は基本点
      score = 20;
    }
    
    return Math.min(40, Math.max(0, score));
  },
  
  // 支持率の計算（30点満点）（未実装）
  calculateApprovalRating: (stats: GameStats): number => {
    // 仮実装
    return Math.floor(stats.satisfaction * 0.1);
  },
  
  // 満足度スコアの計算（20点満点）
  calculateSatisfactionScore: (stats: GameStats, facilities: Facility[]): number => {
    let score = 0;
    
    // 基本満足度（10点）
    score += Math.floor(stats.satisfaction * 0.1);
    
    // 環境配慮（10点）
    const industrialCount = facilities.filter(f => f.type === 'industrial').length;
    const totalFacilities = facilities.length;
    if (totalFacilities > 0) {
      const industrialRatio = industrialCount / totalFacilities;
      // 工業区画が少ないほど高得点
      score += Math.floor((1 - industrialRatio) * 10);
    }
    
    return Math.min(20, Math.max(0, score));
  },
  
  // ミッション達成数の計算（10点満点）（未実装）
  calculateMissionCompletion: (): number => {
    return 0;
  },
  
  // 総合評価スコアの計算
  calculateTotalScore: (development: number, approval: number, satisfaction: number, mission: number): number => {
    return development + approval + satisfaction + mission;
  },
  
  // 評価等級の決定
  determineGrade: (totalScore: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'E' => {
    if (totalScore >= 90) return 'S';
    if (totalScore >= 80) return 'A';
    if (totalScore >= 70) return 'B';
    if (totalScore >= 60) return 'C';
    if (totalScore >= 50) return 'D';
    return 'E';
  },
  
  // 補助金額の計算
  calculateSubsidy: (totalScore: number, level: number, population: number): number => {
    // 基本補助金（評価スコアに応じて）
    let baseSubsidy = 0;
    if (totalScore >= 90) baseSubsidy = 100000;      // S評価
    else if (totalScore >= 80) baseSubsidy = 80000;  // A評価
    else if (totalScore >= 70) baseSubsidy = 60000;  // B評価
    else if (totalScore >= 60) baseSubsidy = 40000;  // C評価
    else if (totalScore >= 50) baseSubsidy = 20000;  // D評価
    else baseSubsidy = 10000;                            // E評価
    
    // レベル補正（レベルが高いほど補助金が増加）
    const levelMultiplier = 1 + (level - 1) * 0.1;
    
    // 人口補正（人口が多いほど補助金が増加）
    const populationMultiplier = 1 + Math.min(population / 10000, 1) * 0.5;
    
    return Math.floor(baseSubsidy * levelMultiplier * populationMultiplier);
  },
  
  // 年末評価の実行
  executeYearlyEvaluation: (stats: GameStats, facilities: Facility[]): YearlyEvaluation => {
    const yearlyStats = get().calculateYearlyStats(stats, facilities);
    const developmentScore = get().calculateDevelopmentScore(yearlyStats, stats.previousYearStats || undefined);
    const approvalRating = get().calculateApprovalRating(stats);
    const satisfactionScore = get().calculateSatisfactionScore(stats, facilities);
    const missionCompletion = get().calculateMissionCompletion();
    
    const totalScore = get().calculateTotalScore(developmentScore, approvalRating, satisfactionScore, missionCompletion);
    const grade = get().determineGrade(totalScore);
    const subsidy = get().calculateSubsidy(totalScore, stats.level, stats.population);
    
    return {
      year: stats.date.year,
      developmentScore,
      approvalRating,
      satisfactionScore,
      missionCompletion,
      totalScore,
      grade,
      subsidy
    };
  },
  
  // セーブ・ロード機能
  saveState: () => {
    // 現在は状態を保持しないため空のオブジェクトを返す
    return {};
  },
  
  loadState: (_savedState: any) => {
    // 現在は状態を保持しないため何もしない
  },
  
  resetToInitial: () => {
    // 現在は状態を保持しないため何もしない
  }
}));

// 自動登録
saveLoadRegistry.register('yearlyEvaluation', useYearlyEvaluationStore.getState()); 
