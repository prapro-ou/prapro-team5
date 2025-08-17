import type { Position } from '../types/grid';
import type { Facility } from '../types/facility';
import type { 
  TileDrawParams, 
  FacilityImageParams, 
  EffectDrawParams, 
  DragRangeParams 
} from '../types/drawing';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './coordinates';
import { DRAWING_CONSTANTS } from '../constants/drawingConstants';

// タイルの描画
export const drawTile = ({
  ctx,
  x,
  y,
  tileColor,
  mapOffsetX,
  mapOffsetY,
  getIsometricPosition
}: TileDrawParams): void => {
  const isoPos = getIsometricPosition(x, y);
  
  // アイソメトリックタイルのパスを作成
  ctx.beginPath();
  ctx.moveTo(isoPos.x + mapOffsetX, isoPos.y + mapOffsetY);
  ctx.lineTo(isoPos.x + mapOffsetX + ISO_TILE_WIDTH / 2, isoPos.y + mapOffsetY - ISO_TILE_HEIGHT / 2);
  ctx.lineTo(isoPos.x + mapOffsetX + ISO_TILE_WIDTH, isoPos.y + mapOffsetY);
  ctx.lineTo(isoPos.x + mapOffsetX + ISO_TILE_WIDTH / 2, isoPos.y + mapOffsetY + ISO_TILE_HEIGHT / 2);
  ctx.closePath();
  
  // タイルの色を設定
  ctx.fillStyle = tileColor;
  ctx.fill();
  
  // 境界線を描画
  ctx.strokeStyle = DRAWING_CONSTANTS.TILE_BORDER_COLOR;
  ctx.lineWidth = DRAWING_CONSTANTS.TILE_BORDER_WIDTH;
  ctx.stroke();
};

// 変形の適用
const applyTransform = (
  ctx: CanvasRenderingContext2D, 
  transform: string, 
  drawX: number, 
  drawY: number, 
  imgSize: { width: number; height: number }
): void => {
  ctx.translate(drawX + imgSize.width / 2, drawY + imgSize.height / 2);
  
  if (transform.includes('rotate')) {
    const rotation = transform.match(/rotate\(([^)]+)\)/)?.[1];
    if (rotation) {
      ctx.rotate((parseFloat(rotation) * Math.PI) / 180);
    }
  }
  
  if (transform.includes('scaleX(-1)')) {
    ctx.scale(-1, 1);
  }
  
  ctx.translate(-(drawX + imgSize.width / 2), -(drawY + imgSize.height / 2));
};

// 道路画像の描画
const drawRoadImage = (
  ctx: CanvasRenderingContext2D,
  facility: Facility,
  x: number,
  y: number,
  isoPos: Position,
  mapOffsetX: number,
  mapOffsetY: number,
  imageCache: { [key: string]: HTMLImageElement },
  getRoadImageData: (facility: Facility, x: number, y: number) => { imgPath: string; imgSize: { width: number; height: number }; transform?: string }
): void => {
  const { imgPath, imgSize, transform } = getRoadImageData(facility, x, y);
  const cachedImage = imageCache[imgPath];
  
  if (!cachedImage) return;
  
  const drawX = isoPos.x + mapOffsetX - imgSize.width / 2 + 16;
  const drawY = isoPos.y + mapOffsetY - imgSize.height + 16 * (1) / 2;
  
  ctx.save();
  if (transform) {
    applyTransform(ctx, transform, drawX, drawY, imgSize);
  }
  
  ctx.drawImage(cachedImage, drawX, drawY, imgSize.width, imgSize.height);
  ctx.restore();
};

// 建物画像の描画
const drawBuildingImage = (
  ctx: CanvasRenderingContext2D,
  facility: Facility,
  x: number,
  y: number,
  isoPos: Position,
  mapOffsetX: number,
  mapOffsetY: number,
  imageCache: { [key: string]: HTMLImageElement },
  getFacilityImageData: (facility: Facility, x: number, y: number) => { imgPath: string; imgSize: { width: number; height: number }; size: number }
): void => {
  const { imgPath, imgSize, size: facilitySize } = getFacilityImageData(facility, x, y);
  const cachedImage = imageCache[imgPath];
  
  if (!cachedImage) return;
  
  const drawX = isoPos.x + mapOffsetX - imgSize.width / 2 + 16;
  const drawY = isoPos.y + mapOffsetY - imgSize.height + 16 * (facilitySize) / 2;
  
  ctx.drawImage(cachedImage, drawX, drawY, imgSize.width, imgSize.height);
};

// 施設画像の描画
export const drawFacilityImage = ({
  ctx,
  facility,
  x,
  y,
  mapOffsetX,
  mapOffsetY,
  imageCache,
  getIsometricPosition,
  isFacilityCenter,
  getFacilityImageData,
  getRoadImageData
}: FacilityImageParams): void => {
  const isCenter = isFacilityCenter(facility, x, y);
  if (!isCenter) return;
  
  const isoPos = getIsometricPosition(x, y);
  
  if (facility.type === 'road') {
    drawRoadImage(ctx, facility, x, y, isoPos, mapOffsetX, mapOffsetY, imageCache, getRoadImageData);
  } else {
    drawBuildingImage(ctx, facility, x, y, isoPos, mapOffsetX, mapOffsetY, imageCache, getFacilityImageData);
  }
};

// 効果範囲の色を取得
const getEffectColor = (selectedPosition: Position | null, facilities: Facility[]): string => {
  if (!selectedPosition) return DRAWING_CONSTANTS.DEFAULT_EFFECT_COLOR;
  
  const selectedFacility = facilities.find(f => 
    f.position.x === selectedPosition.x && 
    f.position.y === selectedPosition.y
  );
  
  if (!selectedFacility) return DRAWING_CONSTANTS.DEFAULT_EFFECT_COLOR;
  
  switch (selectedFacility.type) {
    case 'park': return DRAWING_CONSTANTS.PARK_EFFECT_COLOR;
    default: return DRAWING_CONSTANTS.DEFAULT_EFFECT_COLOR;
  }
};

// 施設効果範囲の描画
export const drawFacilityEffects = ({
  ctx,
  facilityEffectTiles,
  size,
  mapOffsetX,
  mapOffsetY,
  selectedPosition,
  facilities,
  getIsometricPosition,
  drawTile
}: EffectDrawParams): void => {
  if (facilityEffectTiles.size === 0) return;
  
  ctx.globalAlpha = DRAWING_CONSTANTS.EFFECT_ALPHA;
  
  const effectColor = getEffectColor(selectedPosition, facilities);
  
  facilityEffectTiles.forEach(tileKey => {
    const [x, y] = tileKey.split('-').map(Number);
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      drawTile({
        ctx,
        x,
        y,
        tileColor: effectColor,
        mapOffsetX,
        mapOffsetY,
        getIsometricPosition
      });
    }
  });
  
  ctx.globalAlpha = 1.0;
};

// ドラッグ範囲の描画
export const drawDragRange = ({
  ctx,
  isPlacingFacility,
  dragRange,
  size,
  mapOffsetX,
  mapOffsetY,
  getIsometricPosition
}: DragRangeParams): void => {
  if (!isPlacingFacility || dragRange.size === 0) return;
  
  ctx.globalAlpha = DRAWING_CONSTANTS.DRAG_ALPHA;
  ctx.fillStyle = DRAWING_CONSTANTS.DRAG_COLOR;
  ctx.strokeStyle = DRAWING_CONSTANTS.DRAG_STROKE_COLOR;
  ctx.lineWidth = DRAWING_CONSTANTS.DRAG_STROKE_WIDTH;
  
  dragRange.forEach(tileKey => {
    const [x, y] = tileKey.split('-').map(Number);
    if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
      const isoPos = getIsometricPosition(x, y);
      
      ctx.beginPath();
      ctx.moveTo(isoPos.x + mapOffsetX, isoPos.y + mapOffsetY);
      ctx.lineTo(isoPos.x + mapOffsetX + ISO_TILE_WIDTH / 2, isoPos.y + mapOffsetY - ISO_TILE_HEIGHT / 2);
      ctx.lineTo(isoPos.x + mapOffsetX + ISO_TILE_WIDTH, isoPos.y + mapOffsetY);
      ctx.lineTo(isoPos.x + mapOffsetX + ISO_TILE_WIDTH / 2, isoPos.y + mapOffsetY + ISO_TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });
  
  ctx.globalAlpha = 1.0;
};
