# ミッションシステム利用ガイド

このドキュメントでは、ゲームに新しいミッションを追加する方法について説明します。
ちなみにミッションエンジンはテストしてない項目が複数あるので、正直動作は保証できません...

## ミッションファイルの場所

ミッションデータは以下のファイルに保存されています：

```
city-sim/public/data/missions.json
```

## 新しいミッションの追加手順

`missions` 配列の最後に新しいミッションオブジェクトを追加します。

```json
{
  "missions": [
    // ... 既存のミッション ...
    {
      "id": "mission_new_example",
      "name": "新しいミッションの例",
      "description": "このミッションの詳細説明",
      "type": "mission",
      "category": "development",
      "priority": 100,
      "conditions": [
        { "type": "population", "op": ">=", "value": 200 }
      ],
      "effects": [
        { "type": "money", "value": 10000 }
      ],
      "status": "available",
      "progress": 0,
      "autoAccept": true,
      "isRepeatable": false
    }
  ]
}
```

## ミッションオブジェクトの構造

### 必須プロパティ

| プロパティ | 型 | 説明 | 例 |
|-----------|----|----|---|
| `id` | string | ミッションの一意識別子 | `"mission_example"` |
| `name` | string | ミッション名（UI表示用） | `"人口200人達成"` |
| `description` | string | ミッションの説明文 | `"人口を200人まで増やしましょう"` |
| `type` | string | 必ず `"mission"` を指定 | `"mission"` |
| `category` | string | ミッションカテゴリ | `"development"` |
| `priority` | number | 表示優先度（低いほど上位表示） | `1` |
| `conditions` | array | 達成条件の配列 | 後述 |
| `effects` | array | 報酬・効果の配列 | 後述 |
| `status` | string | 初期状態（通常は `"available"`） | `"available"` |
| `progress` | number | 初期進捗（通常は `0`） | `0` |
| `autoAccept` | boolean | 自動受注フラグ | `true` / `false` |
| `isRepeatable` | boolean | 繰り返し可能フラグ | `true` / `false` |

### カテゴリ一覧

| カテゴリ | 日本語表示 | 説明 |
|---------|-----------|------|
| `development` | 開発 | 都市開発関連のミッション |
| `economic` | 経済 | 経済・財政関連のミッション |
| `infrastructure` | インフラ | インフラ整備関連のミッション |
| `social` | 社会 | 市民生活・社会関連のミッション |
| `environmental` | 環境 | 環境保護関連のミッション |
| `special` | 特殊 | 特別なイベントミッション |
| `tutorial` | チュートリアル | 初心者向けガイドミッション |
| `challenge` | チャレンジ | 高難易度ミッション |

## 条件（Conditions）の設定

条件は配列で複数指定でき、すべての条件を満たした場合にミッションが達成されます。

### 基本構造

```json
{
  "type": "条件タイプ",
  "op": "比較演算子",
  "value": 目標値,
  "target": "対象（オプション）"
}
```

### 利用可能な条件タイプ

#### 人口・資金・満足度

```json
// 人口が100人以上
{ "type": "population", "op": ">=", "value": 100 }

// 所持金が5000円以上
{ "type": "money", "op": ">=", "value": 5000 }

// 満足度が70以上
{ "type": "satisfaction", "op": ">=", "value": 70 }

// レベルが3以上
{ "type": "level", "op": ">=", "value": 3 }
```

#### 施設関連

```json
// 施設総数が10個以上
{ "type": "facility_count", "op": ">=", "value": 10 }

// 住宅が5個以上
{ "type": "facility_type_count", "op": ">=", "value": 5, "target": "residential" }

// 商業施設が3個以上
{ "type": "facility_type_count", "op": ">=", "value": 3, "target": "commercial" }

// 工業施設が2個以上
{ "type": "facility_type_count", "op": ">=", "value": 2, "target": "industrial" }
```

#### 経済関連

```json
// 税収が1000円以上
{ "type": "tax_revenue", "op": ">=", "value": 1000 }

// 月次収入が500円超
{ "type": "monthly_income", "op": ">", "value": 500 }

// 月次支出が300円以下
{ "type": "monthly_expense", "op": "<=", "value": 300 }

// 労働力効率が75%以上
{ "type": "workforce_efficiency", "op": ">=", "value": 75 }
```

#### 支持率関連

```json
// 市民支持率が60%以上
{ "type": "support_rating", "op": ">=", "value": 60, "target": "citizens" }

// 中央政府支持率が70%以上
{ "type": "support_rating", "op": ">=", "value": 70, "target": "central_government" }

// 商工会支持率が50%以上
{ "type": "support_rating", "op": ">=", "value": 50, "target": "chamber_of_commerce" }
```

#### インフラ関連

```json
// 水道供給が10以上
{ "type": "infrastructure_supply", "op": ">=", "value": 10, "target": "water" }

// 電力供給が15以上
{ "type": "infrastructure_supply", "op": ">=", "value": 15, "target": "electricity" }

// 水道バランスが5以上（余剰）
{ "type": "infrastructure_balance", "op": ">=", "value": 5, "target": "water" }

// 電力供給率が120%以上
{ "type": "infrastructure_ratio", "op": ">=", "value": 120, "target": "electricity" }
```

#### 製品関連

```json
// 原材料生産が10以上
{ "type": "product_production", "op": ">=", "value": 10, "target": "0" }

// 中間製品生産が5以上
{ "type": "product_production", "op": ">=", "value": 5, "target": "1" }

// 最終製品生産が15以上
{ "type": "product_production", "op": ">=", "value": 15, "target": "2" }

// サービス生産が20以上
{ "type": "product_production", "op": ">=", "value": 20, "target": "3" }

// 製品効率が90%以上
{ "type": "product_efficiency", "op": ">=", "value": 90 }
```

### 比較演算子

| 演算子 | 意味 |
|-------|------|
| `>=` | 以上 |
| `<=` | 以下 |
| `>` | 超 |
| `<` | 未満 |
| `==` | 等しい |
| `!=` | 等しくない |

## 効果（Effects）の設定

効果は配列で複数指定でき、ミッション達成時にすべての効果が適用されます。

### 基本構造

```json
{
  "type": "効果タイプ",
  "value": 効果値,
  "target": "対象（オプション）"
}
```

### 利用可能な効果タイプ

#### 資源関連

```json
// 資金を5000円獲得
{ "type": "money", "value": 5000 }

// 人口を200人増加
{ "type": "population", "value": 200 }

// 満足度を10増加
{ "type": "satisfaction", "value": 10 }
```

#### 支持率関連

```json
// 市民支持率を5%増加
{ "type": "faction_support", "target": "citizens", "value": 5 }

// 中央政府支持率を10%増加
{ "type": "faction_support", "target": "central_government", "value": 10 }

// 商工会支持率を8%増加
{ "type": "faction_support", "target": "chamber_of_commerce", "value": 8 }
```

#### 施設アンロック関連

```json
// 市役所をアンロック
{ "type": "facility_unlock", "target": "city_hall", "value": 1 }

// 警察署をアンロック
{ "type": "facility_unlock", "target": "police", "value": 1 }

// 発電所をアンロック
{ "type": "facility_unlock", "target": "electric_plant", "value": 1 }

// 浄水所をアンロック
{ "type": "facility_unlock", "target": "water_plant", "value": 1 }
```

### アンロック可能な施設タイプ

| 施設タイプ | 日本語名 | 説明 |
|-----------|---------|------|
| `city_hall` | 市役所 | 税収の拠点となる重要施設 |
| `police` | 警察署 | 治安向上・満足度増加施設 |
| `electric_plant` | 発電所 | 電力供給施設 |
| `water_plant` | 浄水所 | 水道供給施設 |

**注意**: `residential`、`commercial`、`industrial`、`road`、`park`は初期からアンロック済みです。

## ミッション例

### 開発系ミッション

```json
{
  "id": "mission_city_expansion",
  "name": "都市拡張計画",
  "description": "住宅10個と商業施設5個を建設して都市を拡張しましょう",
  "type": "mission",
  "category": "development",
  "priority": 20,
  "conditions": [
    { "type": "facility_type_count", "op": ">=", "value": 10, "target": "residential" },
    { "type": "facility_type_count", "op": ">=", "value": 5, "target": "commercial" }
  ],
  "effects": [
    { "type": "money", "value": 15000 },
    { "type": "satisfaction", "value": 20 }
  ],
  "status": "available",
  "progress": 0,
  "autoAccept": false,
  "isRepeatable": false
}
```

### 施設アンロックミッション

```json
{
  "id": "mission_unlock_city_hall",
  "name": "市役所の建設許可",
  "description": "人口300人を達成して市役所の建設許可を得ましょう",
  "type": "mission",
  "category": "development",
  "priority": 17,
  "conditions": [
    { "type": "population", "op": ">=", "value": 300 }
  ],
  "effects": [
    { "type": "facility_unlock", "target": "city_hall", "value": 1 },
    { "type": "money", "value": 3000 }
  ],
  "status": "available",
  "progress": 0,
  "autoAccept": false,
  "isRepeatable": false
}
```

### 経済系ミッション

```json
{
  "id": "mission_economic_growth",
  "name": "経済成長戦略",
  "description": "税収2000を達成し、労働力効率を80%以上にしましょう",
  "type": "mission",
  "category": "economic",
  "priority": 30,
  "conditions": [
    { "type": "tax_revenue", "op": ">=", "value": 2000 },
    { "type": "workforce_efficiency", "op": ">=", "value": 80 }
  ],
  "effects": [
    { "type": "money", "value": 20000 },
    { "type": "faction_support", "target": "chamber_of_commerce", "value": 15 }
  ],
  "status": "available",
  "progress": 0,
  "autoAccept": false,
  "isRepeatable": true
}
```

### チャレンジミッション

```json
{
  "id": "mission_perfect_city",
  "name": "完璧な都市",
  "description": "全ての支持率を80%以上にし、製品効率95%を達成するチャレンジ",
  "type": "mission",
  "category": "challenge",
  "priority": 1000,
  "conditions": [
    { "type": "support_rating", "op": ">=", "value": 80, "target": "citizens" },
    { "type": "support_rating", "op": ">=", "value": 80, "target": "central_government" },
    { "type": "support_rating", "op": ">=", "value": 80, "target": "chamber_of_commerce" },
    { "type": "product_efficiency", "op": ">=", "value": 95 }
  ],
  "effects": [
    { "type": "money", "value": 100000 },
    { "type": "satisfaction", "value": 50 }
  ],
  "status": "available",
  "progress": 0,
  "autoAccept": false,
  "isRepeatable": false
}
```
