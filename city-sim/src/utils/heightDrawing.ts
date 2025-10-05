// 高さ地形の描画関数

import { Graphics } from 'pixi.js';
 import type { HeightTerrainTile, HeightLevel } from '../types/heightTerrain';
import type { GridSize } from '../types/grid';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './coordinates';
import { getHeightColor } from './heightVisuals';
import { HEIGHT_DRAWING_CONSTANTS } from '../constants/heightDrawingConstants';

// 境界線を描画する共通関数
const drawBorder = (
  graphics: Graphics,
  borderType: 'flat' | 'slope',
) => {
  const { BORDER } = HEIGHT_DRAWING_CONSTANTS;
  
  let width: number;
  switch (borderType) {
    case 'flat':
      width = BORDER.WIDTH_FLAT;
      break;
    case 'slope':
      width = BORDER.WIDTH_SLOPE;
      break;
    default:
      width = BORDER.WIDTH_FLAT;
  }
  
  graphics.stroke({ color: BORDER.COLOR, width });
};

// 指定方向の隣接タイルの高さを取得
const getNeighborHeight = (
  x: number, 
  y: number, 
  direction: 'north' | 'east' | 'south' | 'west',
  heightTerrainMap: Map<string, HeightTerrainTile>,
  gridSize: GridSize,
  getTerrainAt?: (x: number, y: number) => string | undefined
): HeightLevel | null => {
  let neighborX = x;
  let neighborY = y;
  
  switch (direction) {
    case 'north':
      neighborY = y - 1;
      break;
    case 'east':
      neighborX = x + 1;
      break;
    case 'south':
      neighborY = y + 1;
      break;
    case 'west':
      neighborX = x - 1;
      break;
  }
  
  // マップ範囲外の場合はnullを返す
  if (neighborX < 0 || neighborX >= gridSize.width || neighborY < 0 || neighborY >= gridSize.height) {
    return null;
  }
  
  const neighborTile = heightTerrainMap.get(`${neighborX},${neighborY}`);
  if (neighborTile) {
    return neighborTile.height;
  }
  
  // 高さ地形マップに存在しない場合、通常の地形マップから判定
  if (getTerrainAt) {
    const terrain = getTerrainAt(neighborX, neighborY);
    if (terrain === 'water') {
      return 0; // 水面は高さ0
    }
    // その他の地形は高さ1として扱う（デフォルト）
    return 1;
  }
  
  return null;
};

// 水面と接しているかをチェック
const isAdjacentToWater = (
  x: number,
  y: number,
  heightTerrainMap: Map<string, HeightTerrainTile>,
  gridSize: GridSize,
  getTerrainAt?: (x: number, y: number) => string | undefined
): boolean => {
  const directions: Array<'north' | 'east' | 'south' | 'west'> = ['north', 'east', 'south', 'west'];
  
  for (const direction of directions) {
    const neighborHeight = getNeighborHeight(x, y, direction, heightTerrainMap, gridSize, getTerrainAt);
    if (neighborHeight === 0) {
      return true; // 隣接タイルが水面（高さ0）の場合
    }
  }
  
  return false;
};

// 平地タイルの垂直面を描画
const drawFlatTileVerticalFaces = (
  graphics: Graphics,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
  currentHeight: HeightLevel
) => {
  if (currentHeight === 0) {
    return; // 水面の場合は描画しない
  }
  
  const { SIDE_FACE, HEIGHT_OFFSETS } = HEIGHT_DRAWING_CONSTANTS;
  
  // アイソメトリック座標を計算
  const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  // 現在のタイルの高さオフセット
  const currentHeightOffset = HEIGHT_OFFSETS[currentHeight];
  const adjustedIsoY = isoY - currentHeightOffset;
  
  // 地面レベル（高さ0の位置）
  const groundLevel = isoY;
  
  // タイルの4頂点（平地タイルの実際の座標に合わせる）
  const left = { x: isoX, y: adjustedIsoY };
  const top = { x: isoX + ISO_TILE_WIDTH / 2, y: adjustedIsoY - ISO_TILE_HEIGHT / 2 };
  const right = { x: isoX + ISO_TILE_WIDTH, y: adjustedIsoY };
  const bottom = { x: isoX + ISO_TILE_WIDTH / 2, y: adjustedIsoY + ISO_TILE_HEIGHT / 2 };
  
  // 地面レベルの4頂点（平地タイルの実際の座標に合わせる）
  const groundLeft = { x: isoX, y: groundLevel };
  const groundTop = { x: isoX + ISO_TILE_WIDTH / 2, y: groundLevel - ISO_TILE_HEIGHT / 2 };
  const groundRight = { x: isoX + ISO_TILE_WIDTH, y: groundLevel };
  const groundBottom = { x: isoX + ISO_TILE_WIDTH / 2, y: groundLevel + ISO_TILE_HEIGHT / 2 };
  
  // 各辺から地面までの垂直面を描画
  graphics.moveTo(left.x, left.y)
    .lineTo(top.x, top.y)
    .lineTo(groundTop.x, groundTop.y)
    .lineTo(groundLeft.x, groundLeft.y)
    .lineTo(left.x, left.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  
  graphics.moveTo(top.x, top.y)
    .lineTo(right.x, right.y)
    .lineTo(groundRight.x, groundRight.y)
    .lineTo(groundTop.x, groundTop.y)
    .lineTo(top.x, top.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  
  graphics.moveTo(right.x, right.y)
    .lineTo(bottom.x, bottom.y)
    .lineTo(groundBottom.x, groundBottom.y)
    .lineTo(groundRight.x, groundRight.y)
    .lineTo(right.x, right.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  
  graphics.moveTo(bottom.x, bottom.y)
    .lineTo(left.x, left.y)
    .lineTo(groundLeft.x, groundLeft.y)
    .lineTo(groundBottom.x, groundBottom.y)
    .lineTo(bottom.x, bottom.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
};

// 斜面タイルの垂直面を描画
const drawSlopeTileVerticalFaces = (
  graphics: Graphics,
  tile: HeightTerrainTile,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number
) => {
  const { SIDE_FACE, HEIGHT_OFFSETS } = HEIGHT_DRAWING_CONSTANTS;
  const { cornerHeights } = tile;
  
  // アイソメトリック座標を計算
  const baseIsoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  const getHeightAdjustedY = (height: HeightLevel, baseY: number) => {
    return baseY - HEIGHT_OFFSETS[height];
  };
  
  const [hTL, hTR, hBR, hBL] = cornerHeights;
  
  // 斜面タイルの4頂点
  const topLeft = {
    x: baseIsoX + ISO_TILE_WIDTH / 2,
    y: getHeightAdjustedY(hTL, baseIsoY - ISO_TILE_HEIGHT / 2)
  };
  const topRight = {
    x: baseIsoX + ISO_TILE_WIDTH,
    y: getHeightAdjustedY(hTR, baseIsoY)
  };
  const bottomRight = {
    x: baseIsoX + ISO_TILE_WIDTH / 2,
    y: getHeightAdjustedY(hBR, baseIsoY + ISO_TILE_HEIGHT / 2)
  };
  const bottomLeft = {
    x: baseIsoX,
    y: getHeightAdjustedY(hBL, baseIsoY)
  };
  
  // 地面レベルの4頂点
  const groundTopLeft = { x: baseIsoX + ISO_TILE_WIDTH / 2, y: baseIsoY - ISO_TILE_HEIGHT / 2 };
  const groundTopRight = { x: baseIsoX + ISO_TILE_WIDTH, y: baseIsoY };
  const groundBottomRight = { x: baseIsoX + ISO_TILE_WIDTH / 2, y: baseIsoY + ISO_TILE_HEIGHT / 2 };
  const groundBottomLeft = { x: baseIsoX, y: baseIsoY };
  
  // 各辺から地面までの垂直面を描画
  graphics.moveTo(topLeft.x, topLeft.y)
    .lineTo(topRight.x, topRight.y)
    .lineTo(groundTopRight.x, groundTopRight.y)
    .lineTo(groundTopLeft.x, groundTopLeft.y)
    .lineTo(topLeft.x, topLeft.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  
  graphics.moveTo(topRight.x, topRight.y)
    .lineTo(bottomRight.x, bottomRight.y)
    .lineTo(groundBottomRight.x, groundBottomRight.y)
    .lineTo(groundTopRight.x, groundTopRight.y)
    .lineTo(topRight.x, topRight.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  
  graphics.moveTo(bottomRight.x, bottomRight.y)
    .lineTo(bottomLeft.x, bottomLeft.y)
    .lineTo(groundBottomLeft.x, groundBottomLeft.y)
    .lineTo(groundBottomRight.x, groundBottomRight.y)
    .lineTo(bottomRight.x, bottomRight.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  
  graphics.moveTo(bottomLeft.x, bottomLeft.y)
    .lineTo(topLeft.x, topLeft.y)
    .lineTo(groundTopLeft.x, groundTopLeft.y)
    .lineTo(groundBottomLeft.x, groundBottomLeft.y)
    .lineTo(bottomLeft.x, bottomLeft.y)
    .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
};



// 高さ地形タイルを描画
export const drawHeightTile = (
  graphics: Graphics,
  tile: HeightTerrainTile,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
  heightTerrainMap?: Map<string, HeightTerrainTile>,
  gridSize?: GridSize,
  getTerrainAt?: (x: number, y: number) => string | undefined
) => {
  // 側面描画（隣接タイル情報が利用可能な場合のみ）
  // 側面は通常のタイルより下のレイヤーに描画するため、先に描画する
  if (heightTerrainMap && gridSize) {
    drawSideFaces(graphics, tile, x, y, offsetX, offsetY, heightTerrainMap, gridSize, getTerrainAt);
  }
  
  const color = getHeightColor(tile.height);
  
  // 斜面かどうかで描画方法を分岐
  if (tile.isSlope) {
    drawSlopeTile(graphics, tile, x, y, offsetX, offsetY);
  }
  else {
    drawFlatTile(graphics, color, x, y, offsetX, offsetY, tile.height);
  }
};

// 側面描画のメイン関数
const drawSideFaces = (
  graphics: Graphics,
  tile: HeightTerrainTile,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
  heightTerrainMap: Map<string, HeightTerrainTile>,
  gridSize: GridSize,
  getTerrainAt?: (x: number, y: number) => string | undefined
) => {
  // 水面と接しているか、マップ下端かをチェック
  const isWaterAdjacent = isAdjacentToWater(x, y, heightTerrainMap, gridSize, getTerrainAt);
  const isMapBottom = y === gridSize.height - 1;
  
  
  if (!isWaterAdjacent && !isMapBottom) {
    return; // 水面と接していないかつマップ下端でない場合は描画しない
  }
  
  if (tile.isSlope) {
    // 斜面タイルの側面描画
    drawSlopeTileVerticalFaces(graphics, tile, x, y, offsetX, offsetY);
  } else {
    // 平地タイルの側面描画
    drawFlatTileVerticalFaces(graphics, x, y, offsetX, offsetY, tile.height);
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
  const heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[height];
  const adjustedIsoY = isoY - heightOffset;
  
  // メインタイルを描画
  graphics.moveTo(isoX, adjustedIsoY)
    .lineTo(isoX + ISO_TILE_WIDTH / 2, adjustedIsoY - ISO_TILE_HEIGHT / 2)
    .lineTo(isoX + ISO_TILE_WIDTH, adjustedIsoY)
    .lineTo(isoX + ISO_TILE_WIDTH / 2, adjustedIsoY + ISO_TILE_HEIGHT / 2)
    .lineTo(isoX, adjustedIsoY)
    .fill({ color, alpha: 0.9 });
  
  drawBorder(graphics, 'flat');
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
  
  
  // 斜面の面を描画
  graphics.moveTo(corners.topLeft.x, corners.topLeft.y)
    .lineTo(corners.topRight.x, corners.topRight.y)
    .lineTo(corners.bottomRight.x, corners.bottomRight.y)
    .lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
    .lineTo(corners.topLeft.x, corners.topLeft.y)
    .fill({ color, alpha: 0.9 });
  
  // 境界線を描画
  drawBorder(graphics, 'slope');
  
  // 同じ高さの角同士を結ぶ線を描画
  drawHeightConnectionLines(graphics, corners, cornerHeights);
};

// 斜面の四隅の座標を計算
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
  
  const heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS;
  
  const [hTL, hTR, hBR, hBL] = cornerHeights;
  
  // 高さ0（水面）は基準位置、高さ1以上は上に移動
  const getHeightAdjustedY = (height: HeightLevel, baseY: number) => {
    return baseY - heightOffset[height];
  };
  
  // ダイヤ形の4頂点
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


// 同じ高さの角同士を結ぶ線を描画
const drawHeightConnectionLines = (
  graphics: Graphics,
  corners: any,
  cornerHeights: [HeightLevel, HeightLevel, HeightLevel, HeightLevel]
) => {
  const { BORDER } = HEIGHT_DRAWING_CONSTANTS;
  
  // 角の定義（左上、右上、右下、左下）
  const cornerPositions = [
    { name: 'topLeft', pos: corners.topLeft },
    { name: 'topRight', pos: corners.topRight },
    { name: 'bottomRight', pos: corners.bottomRight },
    { name: 'bottomLeft', pos: corners.bottomLeft }
  ];
  
  // 高さごとに角をグループ化
  const heightGroups = new Map<HeightLevel, Array<{ name: string; pos: any }>>();
  
  cornerPositions.forEach((corner, index) => {
    const height = cornerHeights[index];
    if (!heightGroups.has(height)) {
      heightGroups.set(height, []);
    }
    heightGroups.get(height)!.push(corner);
  });
  
  // 同じ高さの角が2つ以上ある場合、それらを線で結ぶ
  heightGroups.forEach((cornersAtHeight) => {
    if (cornersAtHeight.length >= 2) {
      // 同じ高さの角同士を線で結ぶ
      for (let i = 0; i < cornersAtHeight.length - 1; i++) {
        const startCorner = cornersAtHeight[i];
        const endCorner = cornersAtHeight[i + 1];
        
        // 高さが同じ角同士を結ぶ線を描画
        graphics.moveTo(startCorner.pos.x, startCorner.pos.y)
          .lineTo(endCorner.pos.x, endCorner.pos.y)
          .stroke({ 
            color: BORDER.COLOR, 
            width: BORDER.WIDTH_FLAT,
            alpha: 0.8 
          });
      }
      
      if (cornersAtHeight.length > 2) {
        const firstCorner = cornersAtHeight[0];
        const lastCorner = cornersAtHeight[cornersAtHeight.length - 1];
        graphics.moveTo(firstCorner.pos.x, firstCorner.pos.y)
          .lineTo(lastCorner.pos.x, lastCorner.pos.y)
          .stroke({ 
            color: BORDER.COLOR, 
            width: BORDER.WIDTH_FLAT,
            alpha: 0.8 
          });
      }
    }
  });
};
