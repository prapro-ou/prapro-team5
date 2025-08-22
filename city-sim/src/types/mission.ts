// ベースインターフェース
export interface BaseMission {
  id: string;                    // 一意識別子
  name: string;                  // 表示名
  description: string;           // 説明文
  type: 'achievement' | 'mission'; // タイプ識別
  category: MissionCategory;     // カテゴリ分類
  priority: number;              // 表示優先度（高いほど優先）
  faction?: FactionType;         // 関連派閥（オプション）
}


// ミッション用プロパティ
export interface Mission extends BaseMission {
  type: 'mission';
  status: MissionStatus;         // 現在の状態
  progress: number;              // 進捗率（0-100）
  startDate?: GameDate;          // 開始日時
  deadline?: GameDate;           // 期限日時
  isRepeatable: boolean;         // 繰り返し可能フラグ
  repeatCooldown?: number;       // 繰り返し間隔（週数）
  lastCompletedDate?: GameDate;  // 最後の完了日時
}

// 条件インターフェース
export interface Condition {
  type: ConditionType;           // 条件タイプ
  op: ComparisonOperator;        // 比較演算子
  value: number;                 // 比較値
  target?: string;               // 対象（施設タイプなど）
  metadata?: Record<string, any>; // 追加メタデータ（将来の拡張用）
}

// 条件タイプ
export type ConditionType = 
  | 'population'           // 人口
  | 'money'               // 所持金
  | 'satisfaction'        // 満足度
  | 'level'               // 都市レベル
  | 'facility_count'      // 総施設数
  | 'facility_type_count' // 特定施設タイプの数
  | 'time_elapsed'        // 経過時間（週数）
  | 'monthly_balance'     // 月次収支
  | 'support_rating'      // 派閥支持率
  | 'infrastructure'      // インフラ状況
  | 'area_effect'         // エリア効果
  | 'road_connection'     // 道路接続状況
  | 'compound'            // 複合条件
  | 'custom';             // カスタム条件

// 比較演算
export type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!=';

// 複合条件
export interface CompoundCondition extends Condition {
  type: 'compound';
  logic: 'AND' | 'OR' | 'NOT';
  conditions: Condition[];
}


// 効果インターフェース
export interface Effect {
  type: EffectType;            // 効果タイプ
  target?: string;             // 対象（派閥など）
  value: number;               // 効果値
  condition?: string;          // 適用条件（将来の拡張用）
  duration?: EffectDuration;   // 効果持続期間（将来の拡張用）
  metadata?: Record<string, any>; // 追加メタデータ
}

// 効果タイプ
export type EffectType = 
  | 'money'               // 予算（資金）
  | 'population'         // 人口
  | 'satisfaction'       // 満足度
  | 'faction_support'    // 派閥支持率
  | 'facility_unlock'    // 施設解放
  | 'bonus_multiplier'   // ボーナス倍率
  | 'penalty_reduction'  // ペナルティ軽減
  | 'infrastructure_boost' // インフラ強化
  | 'workforce_efficiency' // 労働効率
  | 'tax_rate'           // 税率
  | 'maintenance_cost'   // 維持費
  | 'special_event'      // 特殊イベント
  | 'custom';            // カスタム効果

// 効果時間インターフェース
export interface EffectDuration {
  type: 'instant' | 'temporary' | 'permanent';
  value?: number;           // 持続期間（週数）
  endDate?: GameDate;       // 終了日時
}

// 条件付き効果
export interface ConditionalEffect extends Effect {
  condition: string;         // 適用条件のID
  fallbackValue?: number;    // 条件不成立時の値
}


// 期間インターフェース
export interface TimeLimit {
  type: 'absolute' | 'relative' | 'recurring';
  value: number;             // 期限値
  unit: 'weeks' | 'months' | 'years'; // 時間単位
  startFrom: 'game_start' | 'mission_start' | 'specific_date'; // 開始基準
  specificDate?: GameDate;   // 特定開始日
}

// ゲーム日インターフェース
export interface GameDate {
  year: number;
  month: number;
  week: number;
  totalWeeks: number;
}

// ミッション状態
export type MissionStatus = 
  | 'hidden'        // 非表示
  | 'available'     // 利用可能
  | 'in_progress'   // 進行中
  | 'completed'     // 完了
  | 'failed'        // 失敗
  | 'expired'       // 期限切れ（Phase 2以降）
  | 'on_cooldown';  // クールダウン中（Phase 2以降）


// カテゴリ
export type MissionCategory = 
  | 'development'      // 発展系
  | 'economic'         // 経済系
  | 'infrastructure'   // インフラ系
  | 'environmental'    // 環境系
  | 'social'           // 社会系
  | 'special'          // 特殊系
  | 'tutorial'         // チュートリアル系
  | 'seasonal'         // 季節系
  | 'challenge'        // チャレンジ系
  | 'collection';      // コレクション系


// 勢力タイプ
export type FactionType = 
  | 'central_government'  // 中央政府
  | 'citizens'            // 市民
  | 'chamber_of_commerce'; // 商工会議所


// 目標インターフェース
export interface Objective {
  type: ObjectiveType;           // 目標タイプ
  target: string;                // 対象
  count: number;                 // 目標数
  constraints?: ObjectiveConstraint[]; // 制約条件
  progress?: number;             // 現在の進捗
}

// 目標タイプ
export type ObjectiveType = 
  | 'build'              // 建設
  | 'upgrade'            // アップグレード
  | 'maintain'           // 維持
  | 'connect'            // 接続
  | 'achieve'            // 達成
  | 'collect'            // 収集
  | 'destroy'            // 破壊
  | 'custom';            // カスタム

// 制約条件
export interface ObjectiveConstraint {
  type: ConstraintType;
  value: any;
  metadata?: Record<string, any>;
}

export type ConstraintType = 
  | 'min_distance_from'      // 最小距離
  | 'max_distance_from'      // 最大距離
  | 'must_be_connected'      // 道路接続必須
  | 'must_be_in_area'        // エリア内必須
  | 'must_not_be_in_area'    // エリア外必須
  | 'min_satisfaction'       // 最小満足度
  | 'max_pollution'          // 最大汚染度
  | 'custom';                // カスタム制約

// 条件チェック型
export interface ConditionCheckResult {
  condition: Condition;
  result: boolean;
  actualValue: number;
  message?: string;
}

// 効果適用結果
export interface EffectApplyResult {
  effect: Effect;
  success: boolean;
  message?: string;
  previousValue?: number;
  newValue?: number;
}
