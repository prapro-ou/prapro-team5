import type { Position } from "./grid";

export type FacilityType = "residential" | "commercial" | "industrial" | "road";

// 施設の基本情報
export interface FacilityInfo {
  type: FacilityType;
  name: string;
  cost: number;             // 建設コスト
  maintenanceCost: number;  // 維持費
  description: string;
}

// 配置された施設
export interface Facility {
  id: string;
  type: FacilityType;
  position: Position;
}
