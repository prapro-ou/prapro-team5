import { create } from 'zustand';
import type { GameStats } from '../types/game';
import type { Facility } from '../types/facility';
import type { Reward } from '../components/RewardPanel';
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
  approvalRating: number;        // 支持率（0-100）（未実装）
  satisfactionScore: number;     // 満足度スコア（0-100）
  missionCompletion: number;     // ミッション達成数（未実装）
  totalScore: number;            // 総合評価スコア（0-100）
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'E'; // 評価等級
  subsidy: number;               // 補助金額
}
