import type { Position } from "./grid";

export type FacilityType = "residential" | "commercial" | "industrial" | "road" | "city_hall";

// カテゴリ定義
export const FACILITY_CATEGORIES = {
  residential: { name: "住宅" },
  commercial: { name: "商業" },
  industrial: { name: "工業" },
  infrastructure: { name: "インフラ" },
  government: { name: "公共" }, // 新しいカテゴリ
  others: { name: "その他" }
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
  // --- 経済サイクル用プロパティ ---
  requiredWorkforce?: number; // 必要労働力（工業・商業用）
  produceGoods?: number;      // 生産量（工業用）
  consumeGoods?: number;      // 消費量（商業用）
}


// 配置された施設
export interface Facility {
  id: string;
  type: FacilityType;
  position: Position;
  occupiedTiles: Position[]; // 施設が占有するタイル
  variantIndex: number;      // バリエーション用のインデックス
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
  },
  road: {
    type: 'road',
    name: '道路',
    size: 1,
    cost: 50,
    maintenanceCost: 10,
    description: '道路',
    category: 'infrastructure',
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
  }
}
