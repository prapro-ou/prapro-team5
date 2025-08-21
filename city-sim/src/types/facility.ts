import type { Position } from "./grid";
export type PreviewStatus = 'valid' | 'occupied' | 'insufficient-funds' | 'out-of-bounds' | 'terrain-unbuildable' | null;

export type FacilityType = "residential" | "commercial" | "industrial" | "road" | "city_hall" | "park" | "electric_plant" | "water_plant" | "police";

// 製品
export type ProductType = "raw_material" | "intermediate_product" | "final_product" | "service";

// 製品需要・生産
export type ProductDemand = [number, number, number, number];
export type ProductProduction = [number, number, number, number];

// インフラ需要・供給
export interface InfrastructureDemand {
  water: number;
  electricity: number;
};

export interface InfrastructureSupply {
  water: number;
  electricity: number;
};

// カテゴリ定義
export const FACILITY_CATEGORIES = {
  residential: { name: "住宅" },
  commercial: { name: "商業" },
  industrial: { name: "工業" },
  infrastructure: { name: "インフラ" },
  government: { name: "公共" }, 
  others: { name: "その他" },
} as const;

export type CategoryKey = keyof typeof FACILITY_CATEGORIES;

// 施設の基本情報
export interface FacilityInfo {
  type: FacilityType;
  name: string;
  size: number;             // 施設のサイズ（奇数のみ 3x3とか）
  cost: number;             // 建設コスト
  maintenanceCost: number;  // 維持費
  basePopulation?: number;   // 基本人口
  description: string;
  category: CategoryKey;    // カテゴリ
  imgPaths?: string[];      // 画像パス（バリエーションのため複数枚指定可能）
  imgSizes?: { width: number; height: number }[]; // 画像サイズ
  satisfaction: number;
  attractiveness?: number;   // 魅力度（労働力配分の優先度、労働力が必要な施設のみ）
  // --- インフラ用プロパティ ---
  infrastructureDemand?: InfrastructureDemand; // インフラ需要
  infrastructureSupply?: InfrastructureSupply; // インフラ供給

  // --- 経済サイクル用プロパティ ---
  workforceRequired?: {
    min: number;              // 必要労働者数
    max: number;              // 最大労働者数
    baseRevenue?: number;     // 基本収益（労働力100%時）
    baseProduction?: number;  // 基本生産量（労働力100%時）
    baseConsumption?: number; // 基本消費量（労働力100%時）
  };
  productDemand?: ProductDemand;         // 製品需要
  productProduction?: ProductProduction; // 製品生産

  // --- 公園など範囲効果用 ---
  effectRadius?: number;      // 効果範囲（公園など）
  baseAssetValue?: number;    // 基本資産価値
}


// 配置された施設
export interface Facility {
  id: string;
  type: FacilityType;
  position: Position;
  occupiedTiles: Position[]; // 施設が占有するタイル
  variantIndex: number;      // バリエーション用のインデックス
  // 公園など範囲効果用
  effectRadius?: number;
  // 道路接続状態
  isConnected: boolean;      // 道路に接続されているかどうか
  isActive: boolean;         // 施設が活動中かどうか（道路接続状態に依存）
}

// 施設のマスターデータ
// cost, maintenanceCost, description は仮の値
export const FACILITY_DATA: Record<FacilityType, FacilityInfo> = {
  residential: {
    type: 'residential',
    name: '住宅区画',
    size: 3,
    cost: 100,
    maintenanceCost: 30,
    description: '住宅地',
    category: 'residential',
    imgPaths: ['images/buildings/residential.png'],
    imgSizes: [{ width: 96, height: 79 }],
    satisfaction: 0,
    baseAssetValue: 100,
    infrastructureDemand: { water: 50, electricity: 50 },
    productDemand: [0, 0, 0, 0],
    productProduction: [0, 0, 0, 0],
    basePopulation: 100,
  },
  commercial: {
    type: 'commercial', 
    name: '商業区画',
    size: 3,
    cost: 150,
    maintenanceCost: 50,
    description: '商業地',
    category: 'commercial',
    imgPaths: ['images/buildings/commercial.png'],
    imgSizes: [{ width: 96, height: 68 }],
    satisfaction: 7,
    attractiveness: 80,
    workforceRequired: {
      min: 3,
      max: 10,
      baseRevenue: 100,
      baseConsumption: 5
    },
    baseAssetValue: 150,
    infrastructureDemand: { water: 100, electricity: 100 },
    productDemand: [0, 0, 0, 0],
    productProduction: [0, 0, 0, 10],
  },
  industrial: {
    type: 'industrial',
    name: '工業区画',
    size: 3,
    cost: 200,
    maintenanceCost: 50,
    description: '工業地',
    category: 'industrial',
    imgPaths: ['images/buildings/industrial.png'],
    imgSizes: [{ width: 96, height: 91 }],
    satisfaction: -5,
    attractiveness: 80,
    workforceRequired: {
      min: 5,
      max: 50,
      baseProduction: 20,
      baseConsumption: 0
    },
    baseAssetValue: 200,
    infrastructureDemand: { water: 200, electricity: 200 },
    productDemand: [10, 0, 0, 0],
    productProduction: [0, 20, 0, 0],
  },
  road: {
    type: 'road',
    name: '道路',
    size: 1,
    cost: 50,
    maintenanceCost: 10,
    description: '道路',
    category: 'infrastructure',
    imgPaths: [
      'images/buildings/road_right.png',    // 0: 直線道路
      'images/buildings/road_cross.png',    // 1: 交差点
      'images/buildings/road_turn.png',     // 2: 右左折1
      'images/buildings/road_turn_r.png',   // 3: 右左折2
      'images/buildings/road_t.png',        // 4: 丁字路1
      'images/buildings/road_t_r.png',      // 5: 丁字路2
    ],
    imgSizes: [
      { width: 32, height: 16 },
      { width: 32, height: 16 },
      { width: 32, height: 16 },
      { width: 32, height: 16 },
    ],
    satisfaction: 0,
  },
  // 市役所のデータを追加
  city_hall: {
    type: 'city_hall',
    name: '市役所',
    size: 5, // 少し大きめのサイズ
    cost: 5000, // 高コスト
    maintenanceCost: 100,
    description: '税収の拠点となる重要な施設．街に一つしか建設できない．',
    category: 'government',
    satisfaction: 10, // 設置すると満足度が少し上がる
  },
  // 公園のデータを追加
  park: {
    type: 'park',
    name: '公園',
    size: 3,
    cost: 300,
    maintenanceCost: 20,
    description: '周囲の住宅の満足度が下がるのを防ぐ施設',
    category: 'government', // 公共カテゴリに変更
    imgPaths: ['images/buildings/park.png'],
    imgSizes: [{ width: 96, height: 79 }],
    satisfaction: 5,
    effectRadius: 13 //13マス範囲に効果
  },
  // 警察署
  police: {
    type: 'police',
    name: '警察署',
    size: 3,
    cost: 800,
    maintenanceCost: 40,
    description: '治安を向上させ、周囲の満足度を上げる施設',
    category: 'government',
    imgPaths: ['images/buildings/police.png'],
    imgSizes: [{ width: 96, height: 79 }],
    satisfaction: 12,
    effectRadius: 25,
  },
  electric_plant: {
    type: 'electric_plant',
    name: '発電所',
    size: 3,
    cost: 1000,
    maintenanceCost: 100,
    description: '電力を生産する施設',
    category: 'infrastructure',
    satisfaction: 0,
    attractiveness: 100,
    infrastructureSupply: { water: 0, electricity: 5000 },
  },

  water_plant: {
    type: 'water_plant',
    name: '浄水所',
    size: 3,
    cost: 1000,
    maintenanceCost: 100,
    description: '水を生産する施設',
    category: 'infrastructure',
    satisfaction: 0,
    attractiveness: 100,
    infrastructureSupply: { water: 5000, electricity: 0 },
  }
}
