import type { Position } from './grid';
import type { Facility } from './facility';

// タイル描画のための型定義
export interface TileDrawParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  tileColor: string;
  mapOffsetX: number;
  mapOffsetY: number;
  getIsometricPosition: (x: number, y: number) => Position;
}

// 施設画像描画のための型定義
export interface FacilityImageParams {
  ctx: CanvasRenderingContext2D;
  facility: Facility;
  x: number;
  y: number;
  mapOffsetX: number;
  mapOffsetY: number;
  imageCache: { [key: string]: HTMLImageElement };
  getIsometricPosition: (x: number, y: number) => Position;
  isFacilityCenter: (facility: Facility, x: number, y: number) => boolean;
  getFacilityImageData: (facility: Facility, x: number, y: number) => { 
    imgPath: string; 
    imgSize: { width: number; height: number }; 
    size: number 
  };
  getRoadImageData: (facility: Facility, x: number, y: number) => { 
    imgPath: string; 
    imgSize: { width: number; height: number }; 
    transform?: string 
  };
}

// 効果範囲描画のための型定義
export interface EffectDrawParams {
  ctx: CanvasRenderingContext2D;
  facilityEffectTiles: Set<string>;
  size: { width: number; height: number };
  mapOffsetX: number;
  mapOffsetY: number;
  selectedPosition: Position | null;
  facilities: Facility[];
  getIsometricPosition: (x: number, y: number) => Position;
  drawTile: (params: TileDrawParams) => void;
}

// ドラッグ範囲描画のための型定義
export interface DragRangeParams {
  ctx: CanvasRenderingContext2D;
  isPlacingFacility: boolean;
  dragRange: Set<string>;
  size: { width: number; height: number };
  mapOffsetX: number;
  mapOffsetY: number;
  getIsometricPosition: (x: number, y: number) => Position;
}

// 画像キャッシュの型定義
export interface ImageCache {
  [key: string]: HTMLImageElement;
}
