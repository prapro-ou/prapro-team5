// ミッションシステムから流用する型
import type { 
  Condition, 
  Effect, 
  GameDate
} from './mission';

// 実績の基本インターフェース
export interface Achievement {
  id: string;                    // 一意識別子
  name: string;                  // 表示名
  description: string;           // 説明文
  condition: string;             // 表示用の条件テキスト
  reward: string;                // 表示用の報酬テキスト
  hidden?: boolean;              // 隠し実績フラグ
  category?: AchievementCategory; // カテゴリ分類
  rarity?: AchievementRarity;    // レアリティ
  priority?: number;             // 表示優先度（高いほど優先）
  
  // ミッションシステムから流用
  conditions: Condition[];       // 実際の条件チェック
  effects: Effect[];             // 実際の効果適用
  
  // 実績特有の状態
  achieved: boolean;             // 達成済みフラグ
  claimed: boolean;              // 受け取り済みフラグ
  achievedDate?: GameDate;       // 達成日時
  claimedDate?: GameDate;        // 受け取り日時
}

// 実績カテゴリ
export type AchievementCategory = 
  | 'population'      // 人口系
  | 'economy'         // 経済系
  | 'infrastructure'  // インフラ系
  | 'time'           // 時間系
  | 'facility'       // 施設系
  | 'special';       // 特殊系

// 実績レアリティ
export type AchievementRarity = 
  | 'common'         // 一般
  | 'rare'          // レア
  | 'epic'          // エピック
  | 'legendary';    // レジェンダリー

// 実績ストアのインターフェース
export interface AchievementStore {
  achievements: Achievement[];
  claimAchievement: (id: string) => void;
  updateAchievements: () => void;
  hasClaimableAchievements: () => boolean;
  
  // セーブ・ロード機能
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
  
  // JSON読み込み機能
  loadAchievementsFromFile: (filePath?: string) => Promise<void>;
}

// 実績読み込み結果
export interface AchievementLoadResult {
  success: boolean;
  achievements: Achievement[];
  error?: string;
}

// 実績データファイルの型
export interface AchievementData {
  achievements: Achievement[];
}

// レアリティの色設定（UI用）
export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: 'text-gray-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-yellow-600'
};

// レアリティの背景色設定（UI用）
export const RARITY_BG_COLORS: Record<AchievementRarity, string> = {
  common: 'bg-gray-100',
  rare: 'bg-blue-100',
  epic: 'bg-purple-100',
  legendary: 'bg-yellow-100'
};

// カテゴリの表示名
export const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  population: '人口',
  economy: '経済',
  infrastructure: 'インフラ',
  time: '時間',
  facility: '施設',
  special: '特殊'
};

// レアリティの表示名
export const RARITY_NAMES: Record<AchievementRarity, string> = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
  legendary: 'レジェンダリー'
};
