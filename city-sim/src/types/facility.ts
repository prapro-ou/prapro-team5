import type { Position } from "./grid";

export type FacilityType = "residential" | "commercial" | "industrial" | "road" | "city_hall" | "park" | "electric_plant" | "water_plant";

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
  description: string;
  category: CategoryKey;    // カテゴリ
  imgPaths?: string[];      // 画像パス（バリエーションのため複数枚指定可能）
  imgSizes?: { width: number; height: number }[]; // 画像サイズ
  satisfaction: number;
  // --- インフラ用プロパティ ---
  infrastructureDemand?: InfrastructureDemand; // インフラ需要
  infrastructureSupply?: InfrastructureSupply; // インフラ供給

  // --- 経済サイクル用プロパティ ---
  requiredWorkforce?: number; // 必要労働力（工業・商業用）
  produceGoods?: number;      // 生産量（工業用）
  consumeGoods?: number;      // 消費量（商業用）
  // --- 公園など範囲効果用 ---
  effectRadius?: number;      // 効果範囲（公園など）
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
    infrastructureDemand: { water: 50, electricity: 50 },
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
    requiredWorkforce: 5, // 仮値
    consumeGoods: 5,      // 1週で消費する製品数（仮値）
    infrastructureDemand: { water: 100, electricity: 100 },
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
    requiredWorkforce: 200, // 仮値
    produceGoods: 10,      // 1週で生産する製品数（仮値）
    infrastructureDemand: { water: 200, electricity: 200 },
  },
  road: {
    type: 'road',
    name: '道路',
    size: 1,
    cost: 50,
    maintenanceCost: 10,
    description: '道路',
    category: 'infrastructure',
    imgPaths: ['images/buildings/road_right.png'],
    imgSizes: [{ width: 32, height: 16 }],
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
  // インフラ関連
  electric_plant: {
    type: 'electric_plant',
    name: '発電所',
    size: 3,
    cost: 1000,
    maintenanceCost: 100,
    description: '電力を生産する施設',
    category: 'infrastructure',
    satisfaction: 0,
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
    infrastructureSupply: { water: 5000, electricity: 0 },
  }
}
