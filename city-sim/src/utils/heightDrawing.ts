// 高さ地形の描画関数

import { Graphics } from 'pixi.js';
 import type { HeightTerrainTile, HeightLevel } from '../types/heightTerrain';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './coordinates';
import { getHeightColor, getShadowOffset, getBorderWidth } from './heightVisuals';

// 高さ地形タイルを描画
export const drawHeightTile = (
  graphics: Graphics,
  tile: HeightTerrainTile,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number
) => {
  const color = getHeightColor(tile.height);
  
  // 斜面かどうかで描画方法を分岐
  if (tile.isSlope) {
    drawSlopeTile(graphics, tile, x, y, offsetX, offsetY);
  } else {
    drawFlatTile(graphics, color, x, y, offsetX, offsetY, tile.height);
  }
};

// 平地タイルを描画
const drawFlatTile = (
  graphics: Graphics,
  color: number,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
  height: HeightLevel
) => {
  // アイソメトリック座標を計算
  const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  // 高さによるY座標の調整（高さ0は水面、高さ1以上は陸地として浮かせる）
  const heightOffset = height === 0 ? 0 : (height * 8);
  const adjustedIsoY = isoY - heightOffset;
  
  // 影を描画（高さ1以上の場合のみ、水面は影なし）
  if (height > 0) {
    const shadowOffset = getShadowOffset(height);
    graphics.moveTo(isoX + shadowOffset, isoY + shadowOffset)
      .lineTo(isoX + ISO_TILE_WIDTH / 2 + shadowOffset, isoY - ISO_TILE_HEIGHT / 2 + shadowOffset)
      .lineTo(isoX + ISO_TILE_WIDTH + shadowOffset, isoY + shadowOffset)
      .lineTo(isoX + ISO_TILE_WIDTH / 2 + shadowOffset, isoY + ISO_TILE_HEIGHT / 2 + shadowOffset)
      .lineTo(isoX + shadowOffset, isoY + shadowOffset)
      .fill({ color: 0x000000, alpha: 0.3 });
  }
  
  // メインタイルを描画
  graphics.moveTo(isoX, adjustedIsoY)
    .lineTo(isoX + ISO_TILE_WIDTH / 2, adjustedIsoY - ISO_TILE_HEIGHT / 2)
    .lineTo(isoX + ISO_TILE_WIDTH, adjustedIsoY)
    .lineTo(isoX + ISO_TILE_WIDTH / 2, adjustedIsoY + ISO_TILE_HEIGHT / 2)
    .lineTo(isoX, adjustedIsoY)
    .fill({ color, alpha: 0.9 })
    .stroke({ color: 0x333333, width: getBorderWidth(height) });
};

// 斜面タイルを描画
const drawSlopeTile = (
  graphics: Graphics,
  tile: HeightTerrainTile,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number
) => {
  const { cornerHeights } = tile;
  const color = getHeightColor(tile.height);
  
  // 四隅の座標を計算（高さに応じてY座標を調整）
  const corners = calculateSlopeCorners(cornerHeights, x, y, offsetX, offsetY);
  
  // 影を描画
  drawSlopeShadow(graphics, corners, cornerHeights);
  
  // 斜面の面を描画
  graphics.moveTo(corners.topLeft.x, corners.topLeft.y)
    .lineTo(corners.topRight.x, corners.topRight.y)
    .lineTo(corners.bottomRight.x, corners.bottomRight.y)
    .lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
    .lineTo(corners.topLeft.x, corners.topLeft.y)
    .fill({ color, alpha: 0.9 })
    .stroke({ color: 0x666666, width: 2 });
};

/**
 * 斜面の四隅の座標を計算
 */
const calculateSlopeCorners = (
  cornerHeights: [HeightLevel, HeightLevel, HeightLevel, HeightLevel],
  x: number,
  y: number,
  offsetX: number,
  offsetY: number
) => {
  // 基本のアイソメトリック座標
  const baseIsoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  const heightOffset = 8; // 高さ1につき8ピクセル上に移動
  
  const [hTL, hTR, hBR, hBL] = cornerHeights;
  
  // 高さ0（水面）は基準位置、高さ1以上は上に移動
  const getHeightAdjustedY = (height: HeightLevel, baseY: number) => {
    if (height === 0) {
      return baseY; // 水面は基準位置
    }
    return baseY - (height * heightOffset); // 陸地は高さに応じて上に移動
  };
  
  // ダイヤ形の正しい4頂点
  // top    ← TL,  (x: base + W/2, y: base - H/2)
  // right  ← TR,  (x: base + W,   y: base)
  // bottom ← BR,  (x: base + W/2, y: base + H/2)
  // left   ← BL,  (x: base,       y: base)
  return {
    topLeft: {
      x: baseIsoX + ISO_TILE_WIDTH / 2,
      y: getHeightAdjustedY(hTL, baseIsoY - ISO_TILE_HEIGHT / 2)
    },
    topRight: {
      x: baseIsoX + ISO_TILE_WIDTH,
      y: getHeightAdjustedY(hTR, baseIsoY)
    },
    bottomRight: {
      x: baseIsoX + ISO_TILE_WIDTH / 2,
      y: getHeightAdjustedY(hBR, baseIsoY + ISO_TILE_HEIGHT / 2)
    },
    bottomLeft: {
      x: baseIsoX,
      y: getHeightAdjustedY(hBL, baseIsoY)
    }
  };
};

/**
 * 斜面の影を描画
 */
const drawSlopeShadow = (
  graphics: Graphics,
  corners: any,
  cornerHeights: [HeightLevel, HeightLevel, HeightLevel, HeightLevel]
) => {
  // 高さに応じた影のオフセット（高さが高いほど影が長い）
  const maxHeight = Math.max(...cornerHeights);
  const shadowOffset = Math.max(2, maxHeight * 2);
  
  // 水面（高さ0）の場合は影を描画しない
  if (maxHeight === 0) {
    return;
  }
  
  graphics.moveTo(corners.topLeft.x + shadowOffset, corners.topLeft.y + shadowOffset)
    .lineTo(corners.topRight.x + shadowOffset, corners.topRight.y + shadowOffset)
    .lineTo(corners.bottomRight.x + shadowOffset, corners.bottomRight.y + shadowOffset)
    .lineTo(corners.bottomLeft.x + shadowOffset, corners.bottomLeft.y + shadowOffset)
    .lineTo(corners.topLeft.x + shadowOffset, corners.topLeft.y + shadowOffset)
    .fill({ color: 0x000000, alpha: Math.min(0.4, maxHeight * 0.1) });
};
