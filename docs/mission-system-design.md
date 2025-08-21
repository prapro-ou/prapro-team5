# ミッションシステム設計ドキュメント
ここに実績システム含めて，デザインを統合し拡張性を高める予定

## 共通型定義

### 1. 基本インターフェース

```typescript
// 共通のベースインターフェース
export interface BaseAchievement {
  id: string;                    // 一意識別子
  name: string;                  // 表示名
  type: 'achievement' | 'mission'; // タイプ識別
  faction?: FactionType;         // 関連派閥（オプション）
  conditions: Condition[];       // 発生・達成条件
  effects: Effect[];             // 効果・報酬
  flavorText: string;            // 説明文
  priority: number;              // 表示優先度（高いほど優先）
  category: AchievementCategory; // カテゴリ分類
}

// 実績専用プロパティ
export interface Achievement extends BaseAchievement {
  type: 'achievement';
  hidden?: boolean;              // 隠し実績フラグ
  achieved: boolean;             // 達成済みフラグ
  claimed: boolean;              // 報酬受け取り済みフラグ
  achievedDate?: GameDate;       // 達成日時
  claimedDate?: GameDate;        // 受け取り日時
}

// ミッション専用プロパティ
export interface Mission extends BaseAchievement {
  type: 'mission';
  objectives: Objective[];       // 達成目標
  timeLimit?: TimeLimit;         // 期限設定
  status: MissionStatus;         // 現在の状態
  progress: number;              // 進捗率（0-100）
  startDate?: GameDate;          // 開始日時
  deadline?: GameDate;           // 期限日時
  isRepeatable: boolean;         // 繰り返し可能フラグ
  repeatCooldown?: number;       // 繰り返し間隔（週数）
  lastCompletedDate?: GameDate;  // 最後の完了日時
}
```

### 2. 条件システム

```typescript
// 条件の基本インターフェース
export interface Condition {
  type: ConditionType;           // 条件タイプ
  op: ComparisonOperator;        // 比較演算子
  value: number;                 // 比較値
  target?: string;               // 対象（施設タイプなど）
  metadata?: Record<string, any>; // 追加メタデータ
}

// 条件タイプ（仮）
export type ConditionType = 
  | 'population'           // 人口
  | 'money'               // 所持金
  | 'satisfaction'        // 満足度
  | 'facility_count'      // 施設数
  | 'facility_type_count' // 特定施設タイプの数
  | 'time_elapsed'        // 経過時間
  | 'level'               // 都市レベル
  | 'infrastructure'      // インフラ状況
  | 'support_rating'      // 支持率
  | 'compound'            // 複合条件
  | 'area_effect'         // エリア効果
  | 'road_connection'     // 道路接続状況
  | 'monthly_balance'     // 月次収支
  | 'yearly_stats'        // 年次統計
  | 'workforce'           // 労働力配分
  | 'product_supply'      // 製品供給状況
  | 'custom';             // カスタム条件

// 比較演算子
export type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'in_range';

// 複合条件
export interface CompoundCondition extends Condition {
  type: 'compound';
  logic: 'AND' | 'OR' | 'NOT';
  conditions: Condition[];
}

// 範囲条件
export interface RangeCondition extends Condition {
  type: 'in_range';
  minValue: number;
  maxValue: number;
}
```

### 3. 目標システム

```typescript
// 達成目標の基本インターフェース
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
```

### 4. 効果システム

```typescript
// 効果の基本インターフェース
export interface Effect {
  type: EffectType;            // 効果タイプ
  target?: string;             // 対象
  value: number;               // 効果値
  condition?: string;          // 適用条件
  duration?: EffectDuration;   // 効果持続期間
  metadata?: Record<string, any>; // 追加メタデータ
}

// 効果タイプ
export type EffectType = 
  | 'faction_support'      // 派閥支持率
  | 'budget'               // 予算（資金）
  | 'population'           // 人口
  | 'satisfaction'         // 満足度
  | 'facility_unlock'      // 施設解放
  | 'bonus_multiplier'     // ボーナス倍率
  | 'penalty_reduction'    // ペナルティ軽減
  | 'infrastructure_boost' // インフラ強化
  | 'workforce_efficiency' // 労働効率
  | 'tax_rate'             // 税率
  | 'maintenance_cost'     // 維持費
  | 'special_event'        // 特殊イベント
  | 'custom';              // カスタム効果

// 効果持続期間
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
```

### 5. 時間・期限システム

```typescript
// 期限設定
export interface TimeLimit {
  type: 'absolute' | 'relative' | 'recurring';
  value: number;             // 期限値
  unit: 'weeks' | 'months' | 'years'; // 時間単位
  startFrom: 'game_start' | 'mission_start' | 'specific_date'; // 開始基準
  specificDate?: GameDate;   // 特定開始日
}

// ゲーム日付
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
  | 'expired'       // 期限切れ
  | 'on_cooldown';  // クールダウン中
```

### 6. カテゴリ・分類システム

```typescript
// 実績・ミッションカテゴリ
export type AchievementCategory = 
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

// 派閥タイプ（既存システムとの統合）
export type FactionType = 
  | 'central_government'  // 中央政府
  | 'citizens'            // 市民
  | 'chamber_of_commerce'; // 商工会議所
```

## JSON設定ファイル例

### 1. 基本ミッション例

```json
{
  "id": "mission_residential_01",
  "name": "住宅不足の解消",
  "faction": "citizen",
  "type": "mission",
  "category": "development",
  "priority": 1,
  "conditions": [
    { "type": "population", "op": ">", "value": 500 },
    { "type": "facility_type_count", "op": "<", "value": 400, "target": "residential" }
  ],
  "objectives": [
    {
      "type": "build",
      "target": "residential",
      "count": 10,
      "constraints": [
        { "type": "must_be_connected", "value": true },
        { "type": "min_distance_from", "value": 2, "target": "park" }
      ]
    }
  ],
  "effects": [
    { "type": "faction_support", "target": "citizen", "value": 10 },
    { "type": "budget", "value": -1000 },
    { "type": "satisfaction", "value": 5 }
  ],
  "timeLimit": {
    "type": "relative",
    "value": 8,
    "unit": "weeks",
    "startFrom": "mission_start"
  },
  "flavorText": "人口流入で住民が困っています。新しい住宅を整備しましょう。",
  "isRepeatable": false
}
```

### 2. 複合条件ミッション例

```json
{
  "id": "mission_balanced_city_01",
  "name": "バランスの取れた都市",
  "faction": "central_government",
  "type": "mission",
  "category": "environmental",
  "priority": 2,
  "conditions": [
    {
      "type": "compound",
      "logic": "AND",
      "conditions": [
        { "type": "facility_type_count", "op": ">=", "value": 5, "target": "residential" },
        { "type": "facility_type_count", "op": ">=", "value": 3, "target": "commercial" },
        { "type": "facility_type_count", "op": ">=", "value": 2, "target": "park" }
      ]
    }
  ],
  "objectives": [
    {
      "type": "maintain",
      "target": "satisfaction",
      "count": 70,
      "constraints": [
        { "type": "min_satisfaction", "value": 70 }
      ]
    }
  ],
  "effects": [
    { "type": "faction_support", "target": "central_government", "value": 15 },
    { "type": "bonus_multiplier", "target": "tax_rate", "value": 1.1, "duration": { "type": "temporary", "value": 12 } }
  ],
  "timeLimit": {
    "type": "relative",
    "value": 12,
    "unit": "weeks",
    "startFrom": "mission_start"
  },
  "flavorText": "住宅、商業、公園のバランスを保ちながら、高い満足度を維持してください。",
  "isRepeatable": true,
  "repeatCooldown": 26
}
```

### 3. 実績例

```json
{
  "id": "achievement_megacity",
  "name": "メガシティの誕生",
  "type": "achievement",
  "category": "development",
  "priority": 3,
  "conditions": [
    { "type": "population", "op": ">=", "value": 5000 }
  ],
  "effects": [
    { "type": "budget", "value": 100000 },
    { "type": "facility_unlock", "target": "skyscraper", "value": 1 }
  ],
  "flavorText": "巨大都市を築き上げた偉大な市長！",
  "hidden": true
}
```

## 実装ガイドライン

### 1. 条件チェックエンジン

```typescript
export class ConditionEngine {
  // 条件評価
  static evaluateCondition(condition: Condition, gameState: GameState): boolean;
  
  // 複合条件評価
  static evaluateCompoundCondition(condition: CompoundCondition, gameState: GameState): boolean;
  
  // 条件キャッシュ
  private static conditionCache: Map<string, boolean>;
  
  // パフォーマンス最適化
  static optimizeConditionCheck(conditions: Condition[]): Condition[];
}
```

### 2. 効果適用エンジン

```typescript
export class EffectEngine {
  // 効果適用
  static applyEffect(effect: Effect, gameState: GameState): void;
  
  // 条件付き効果適用
  static applyConditionalEffect(effect: ConditionalEffect, gameState: GameState): void;
  
  // 効果履歴記録
  static recordEffectHistory(effect: Effect, gameState: GameState): void;
  
  // 効果の取り消し
  static revertEffect(effect: Effect, gameState: GameState): void;
}
```

### 3. ミッション管理システム

```typescript
export class MissionManager {
  // ミッション生成
  static generateMissions(gameState: GameState): Mission[];
  
  // 進捗更新
  static updateProgress(mission: Mission, gameState: GameState): void;
  
  // 期限チェック
  static checkDeadlines(missions: Mission[], currentDate: GameDate): void;
  
  // 繰り返しミッション管理
  static manageRepeatableMissions(missions: Mission[], currentDate: GameDate): void;
}
```

## 既存システムとの統合

### 1. RewardStore拡張

```typescript
// 既存のRewardStoreを拡張
export interface RewardStore {
  // 既存プロパティ
  rewards: Reward[];
  
  // 新規追加プロパティ
  missions: Mission[];
  achievements: Achievement[];
  
  // 既存メソッド
  claimReward: (id: string) => void;
  updateAchievements: () => void;
  
  // 新規追加メソッド
  claimMissionReward: (id: string) => void;
  updateMissionProgress: () => void;
  checkAllConditions: () => void;
}
```

### 2. GameStore統合

```typescript
// 既存のmonthlyTasksに追加
const checkMissionsAndAchievements: MonthlyTask = (get, set) => {
  const { checkAllConditions } = useRewardStore.getState();
  checkAllConditions();
};

// monthlyTasks配列に追加
monthlyTasks: [
  // ... 既存タスク
  checkMissionsAndAchievements,
]
```

### 3. UIStore統合

```typescript
// 既存のUIStoreに追加
export interface UIStore {
  // ... 既存プロパティ
  
  // 新規追加プロパティ
  isMissionPanelOpen: boolean;
  isAchievementPanelOpen: boolean;
  
  // 新規追加メソッド
  openMissionPanel: () => void;
  closeMissionPanel: () => void;
  openAchievementPanel: () => void;
  closeAchievementPanel: () => void;
}
```
