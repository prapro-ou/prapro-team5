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
  imgPath?: string;         // 画像パス
  satisfaction: number;
}

// 配置された施設
export interface Facility {
  id: string;
  type: FacilityType;
  position: Position;
  occupiedTiles: Position[]; // 施設が占有するタイル
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
    imgPath: 'images/buildings/residential.png',
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
    imgPath: 'images/buildings/commercial.png',
    satisfaction: 7,
  },
  industrial: {
    type: 'industrial',
    name: '工業区画',
    size: 3,
    cost: 200,
    maintenanceCost: 50,
    description: '工業地',
    category: 'industrial',
    imgPath: 'images/buildings/industrial.png',
    satisfaction: -5,
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
