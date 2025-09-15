// ミッションシステムから流用する型
import type { 
  Condition, 
  Effect, 
  GameDate,
  ConditionCheckResult,
  EffectApplyResult
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
