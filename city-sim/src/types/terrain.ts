import type { Position } from "./grid";

// 地形タイプの定義
export type TerrainType = 
  | "grass"        // 平地（芝生）
  | "water"        // 水辺
  | "forest"       // 森
  | "desert"       // 砂漠
  | "mountain"     // 山
  | "beach"        // 砂浜
  | "swamp"        // 沼地
  | "rocky"        // 岩場
  | "snow"         // 雪原

// 地形の基本情報
export interface TerrainInfo {
  type: TerrainType;
  name: string;
  description: string;
  imgPath: string;
  buildable: boolean;           // 建設可能かどうか
  satisfactionModifier: number; // 満足度修正値（仮）
  waterAccess: boolean;         // 水へのアクセスがあるか
}
