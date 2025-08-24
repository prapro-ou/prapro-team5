import type { Facility } from "./facility";
import type { TerrainType } from "./terrain";

export interface Position {
  x: number;
  y: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface GridTile {
  position: Position;
  terrain: TerrainType;    // 地形タイプ
  facility?: Facility;      // 施設配置
}

// 地形マップの型定義
export interface TerrainMap {
  [key: string]: TerrainType; // key: "x,y" 形式
}
