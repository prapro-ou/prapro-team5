import type { Position } from "./grid";
import type { CityParameterType } from "./cityParameter";
export type PreviewStatus = 'valid' | 'occupied' | 'insufficient-funds' | 'out-of-bounds' | 'terrain-unbuildable' | null;

export type FacilityType = "residential" | "large_residential" | "commercial" | "large_commercial" | "industrial" | "road" | "city_hall" | "park" | "electric_plant" | "water_plant" | "police" | "hospital" | "sawmill" | "farm";

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
  industrial: { name: "産業" },
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
  
  // --- 都市パラメータへの寄与 ---
  parameterContributions?: Partial<Record<CityParameterType, {
    baseValue: number;          // 基本寄与値
    radius?: number;            // 効果範囲（セル）
    radiusContribution?: number;// 範囲内寄与
    requiresActive?: boolean;   // 活動中のみ有効
  }>>;
  
  // --- アンロック管理 ---
  unlockCondition: 'initial' | 'mission' | 'achievement' | 'custom';
  initiallyUnlocked: boolean;
  unlockRequirements?: {
    missionId?: string;
    achievementId?: string;
    customCondition?: string;
  };
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
