import type { Facility } from "./facility";


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
  facility?: Facility; // 施設配置
}
