import { Graphics } from 'pixi.js';
 import type { HeightTerrainTile, HeightLevel } from '../types/terrainWithHeight';
import type { GridSize } from '../types/grid';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from './coordinates';
import { getHeightColor } from './terrainVisuals';
import { HEIGHT_DRAWING_CONSTANTS } from '../constants/terrainDrawingConstants';

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

const getNeighborEdgeHeight = (
  x: number,
  y: number,
  direction: 'north' | 'east' | 'south' | 'west',
  heightTerrainMap: Map<string, HeightTerrainTile>,
  gridSize: GridSize,
  getTerrainAt?: (x: number, y: number) => string | undefined
): HeightLevel | null => {
  let neighborX = x;
  let neighborY = y;
  let oppositeEdge: 'north' | 'east' | 'south' | 'west';
  
  switch (direction) {
    case 'north':
      neighborY = y - 1;
      oppositeEdge = 'south';
      break;
    case 'east':
      neighborX = x + 1;
      oppositeEdge = 'west';
      break;
    case 'south':
      neighborY = y + 1;
      oppositeEdge = 'north';
      break;
    case 'west':
      neighborX = x - 1;
      oppositeEdge = 'east';
      break;
  }
  
  if (neighborX < 0 || neighborX >= gridSize.width || neighborY < 0 || neighborY >= gridSize.height) {
    return null;
  }
  
  const neighborTile = heightTerrainMap.get(`${neighborX},${neighborY}`);
  if (neighborTile) {
    if (neighborTile.isSlope && neighborTile.cornerHeights) {
      const [hTL, hTR, hBR, hBL] = neighborTile.cornerHeights;
      switch (oppositeEdge) {
        case 'north':
          return Math.max(hTL, hTR) as HeightLevel;
        case 'east':
          return Math.max(hTR, hBR) as HeightLevel;
        case 'south':
          return Math.max(hBR, hBL) as HeightLevel;
        case 'west':
          return Math.max(hBL, hTL) as HeightLevel;
      }
    }
    return neighborTile.height;
  }
  
  if (getTerrainAt) {
    const terrain = getTerrainAt(neighborX, neighborY);
    if (terrain === 'water') {
      return 0;
    }
    return 1;
  }
  
  return null;
};

const isAdjacentToWater = (
  x: number,
  y: number,
  heightTerrainMap: Map<string, HeightTerrainTile>,
  gridSize: GridSize,
  getTerrainAt?: (x: number, y: number) => string | undefined
): boolean => {
  const directions: Array<'east' | 'south'> = ['east', 'south'];
  
  for (const direction of directions) {
    const neighborHeight = getNeighborHeight(x, y, direction, heightTerrainMap, gridSize, getTerrainAt);
    if (neighborHeight === 0) {
      return true;
    }
  }
  
  return false;
};

const isAtMapEdge = (x: number, y: number, gridSize: GridSize): boolean => {
  return x === gridSize.width - 1 || y === gridSize.height - 1;
};

// 平地タイルの垂直面を描画
const drawFlatTileVerticalFaces = (
  graphics: Graphics,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
  currentHeight: HeightLevel,
  heightTerrainMap: Map<string, HeightTerrainTile>,
  gridSize: GridSize,
  getTerrainAt?: (x: number, y: number) => string | undefined
) => {
  if (currentHeight === 0) {
    return;
  }
  
  const { SIDE_FACE, HEIGHT_OFFSETS } = HEIGHT_DRAWING_CONSTANTS;
  
  const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  const currentHeightOffset = HEIGHT_OFFSETS[currentHeight];
  const adjustedIsoY = isoY - currentHeightOffset;
  
  const groundLevel = isoY;
  
  const left = { x: isoX, y: adjustedIsoY };
  const right = { x: isoX + ISO_TILE_WIDTH, y: adjustedIsoY };
  const bottom = { x: isoX + ISO_TILE_WIDTH / 2, y: adjustedIsoY + ISO_TILE_HEIGHT / 2 };
  
  const groundLeft = { x: isoX, y: groundLevel };
  const groundRight = { x: isoX + ISO_TILE_WIDTH, y: groundLevel };
  const groundBottom = { x: isoX + ISO_TILE_WIDTH / 2, y: groundLevel + ISO_TILE_HEIGHT / 2 };
  
  const eastHeight = getNeighborHeight(x, y, 'east', heightTerrainMap, gridSize, getTerrainAt);
  const southHeight = getNeighborHeight(x, y, 'south', heightTerrainMap, gridSize, getTerrainAt);
  
  if (eastHeight === null || (eastHeight !== null && currentHeight > eastHeight)) {
    graphics.moveTo(right.x, right.y)
      .lineTo(bottom.x, bottom.y)
      .lineTo(groundBottom.x, groundBottom.y)
      .lineTo(groundRight.x, groundRight.y)
      .lineTo(right.x, right.y)
      .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  }
  
  if (southHeight === null || (southHeight !== null && currentHeight > southHeight)) {
    graphics.moveTo(bottom.x, bottom.y)
      .lineTo(left.x, left.y)
      .lineTo(groundLeft.x, groundLeft.y)
      .lineTo(groundBottom.x, groundBottom.y)
      .lineTo(bottom.x, bottom.y)
      .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  }
};

// 斜面タイルの垂直面を描画
const drawSlopeTileVerticalFaces = (
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
  const { SIDE_FACE, HEIGHT_OFFSETS } = HEIGHT_DRAWING_CONSTANTS;
  const { cornerHeights } = tile;
  
  const baseIsoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  const getHeightAdjustedY = (height: HeightLevel, baseY: number) => {
    return baseY - HEIGHT_OFFSETS[height];
  };
  
  const [, hTR, hBR, hBL] = cornerHeights;
  
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
  
  const groundTopRight = { x: baseIsoX + ISO_TILE_WIDTH, y: baseIsoY };
  const groundBottomRight = { x: baseIsoX + ISO_TILE_WIDTH / 2, y: baseIsoY + ISO_TILE_HEIGHT / 2 };
  const groundBottomLeft = { x: baseIsoX, y: baseIsoY };
  
  const eastEdgeHeightNeighbor = getNeighborEdgeHeight(x, y, 'east', heightTerrainMap, gridSize, getTerrainAt);
  const southEdgeHeightNeighbor = getNeighborEdgeHeight(x, y, 'south', heightTerrainMap, gridSize, getTerrainAt);
  
  const eastEdgeHeight = Math.max(hTR, hBR);
  const southEdgeHeight = Math.max(hBR, hBL);
  
  if (eastEdgeHeight > 0 && (eastEdgeHeightNeighbor === null || (eastEdgeHeightNeighbor !== null && eastEdgeHeight > eastEdgeHeightNeighbor))) {
    graphics.moveTo(topRight.x, topRight.y)
      .lineTo(bottomRight.x, bottomRight.y)
      .lineTo(groundBottomRight.x, groundBottomRight.y)
      .lineTo(groundTopRight.x, groundTopRight.y)
      .lineTo(topRight.x, topRight.y)
      .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  }
  
  if (southEdgeHeight > 0 && (southEdgeHeightNeighbor === null || (southEdgeHeightNeighbor !== null && southEdgeHeight > southEdgeHeightNeighbor))) {
    graphics.moveTo(bottomRight.x, bottomRight.y)
      .lineTo(bottomLeft.x, bottomLeft.y)
      .lineTo(groundBottomLeft.x, groundBottomLeft.y)
      .lineTo(groundBottomRight.x, groundBottomRight.y)
      .lineTo(bottomRight.x, bottomRight.y)
      .fill({ color: SIDE_FACE.COLOR, alpha: SIDE_FACE.ALPHA });
  }
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
  if (heightTerrainMap && gridSize) {
    drawSideFaces(graphics, tile, x, y, offsetX, offsetY, heightTerrainMap, gridSize, getTerrainAt);
  }
  
  const color = getHeightColor(tile.height);
  
  if (tile.isSlope) {
    drawSlopeTile(graphics, tile, x, y, offsetX, offsetY);
  } else {
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
  const isWaterAdjacent = isAdjacentToWater(x, y, heightTerrainMap, gridSize, getTerrainAt);
  const isMapEdge = isAtMapEdge(x, y, gridSize);
  
  if (!isWaterAdjacent && !isMapEdge) {
    return;
  }
  
  if (tile.isSlope) {
    drawSlopeTileVerticalFaces(graphics, tile, x, y, offsetX, offsetY, heightTerrainMap, gridSize, getTerrainAt);
  } else {
    drawFlatTileVerticalFaces(graphics, x, y, offsetX, offsetY, tile.height, heightTerrainMap, gridSize, getTerrainAt);
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
  const isoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const isoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  const heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS[height];
  const adjustedIsoY = isoY - heightOffset;
  
  graphics.moveTo(isoX, adjustedIsoY)
    .lineTo(isoX + ISO_TILE_WIDTH / 2, adjustedIsoY - ISO_TILE_HEIGHT / 2)
    .lineTo(isoX + ISO_TILE_WIDTH, adjustedIsoY)
    .lineTo(isoX + ISO_TILE_WIDTH / 2, adjustedIsoY + ISO_TILE_HEIGHT / 2)
    .lineTo(isoX, adjustedIsoY)
    .fill({ color, alpha: 0.9 });
  
  drawBorder(graphics, 'flat');
};

// 斜面タイルを描画
const isSlopeNorthWestFacing = (cornerHeights: [HeightLevel, HeightLevel, HeightLevel, HeightLevel]): boolean => {
  const [hTL, hTR, hBR, hBL] = cornerHeights;
  const leftAvg = (hTL + hBL) / 2;
  const rightAvg = (hTR + hBR) / 2;
  return leftAvg < rightAvg;
};

const isSlopeSouthWestFacing = (cornerHeights: [HeightLevel, HeightLevel, HeightLevel, HeightLevel]): boolean => {
  const [hTL, hTR, hBR, hBL] = cornerHeights;
  const topAvg = (hTL + hTR) / 2;
  const bottomAvg = (hBL + hBR) / 2;
  return topAvg > bottomAvg;
};

const applyShadowToColor = (color: number, shadowFactor: number): number => {
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;
  
  const shadowR = Math.floor(r * shadowFactor);
  const shadowG = Math.floor(g * shadowFactor);
  const shadowB = Math.floor(b * shadowFactor);
  
  return (shadowR << 16) | (shadowG << 8) | shadowB;
};

const drawSlopeTile = (
  graphics: Graphics,
  tile: HeightTerrainTile,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number
) => {
  const { cornerHeights } = tile;
  let color = getHeightColor(tile.height);
  
  if (isSlopeNorthWestFacing(cornerHeights)) {
    color = applyShadowToColor(color, HEIGHT_DRAWING_CONSTANTS.SLOPE_SHADOW.FACTOR);
  } else if (isSlopeSouthWestFacing(cornerHeights)) {
    color = applyShadowToColor(color, HEIGHT_DRAWING_CONSTANTS.SLOPE_SHADOW.LIGHT_FACTOR);
  }
  
  const corners = calculateSlopeCorners(cornerHeights, x, y, offsetX, offsetY);
  
  graphics.moveTo(corners.topLeft.x, corners.topLeft.y)
    .lineTo(corners.topRight.x, corners.topRight.y)
    .lineTo(corners.bottomRight.x, corners.bottomRight.y)
    .lineTo(corners.bottomLeft.x, corners.bottomLeft.y)
    .lineTo(corners.topLeft.x, corners.topLeft.y)
    .fill({ color, alpha: 0.9 });
  
  drawBorder(graphics, 'slope');
  
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
  const baseIsoX = (x - y) * (ISO_TILE_WIDTH / 2) + offsetX;
  const baseIsoY = (x + y) * (ISO_TILE_HEIGHT / 2) + offsetY;
  
  const heightOffset = HEIGHT_DRAWING_CONSTANTS.HEIGHT_OFFSETS;
  
  const [hTL, hTR, hBR, hBL] = cornerHeights;
  
  const getHeightAdjustedY = (height: HeightLevel, baseY: number) => {
    return baseY - heightOffset[height];
  };
  
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
  
  const cornerPositions = [
    { name: 'topLeft', pos: corners.topLeft },
    { name: 'topRight', pos: corners.topRight },
    { name: 'bottomRight', pos: corners.bottomRight },
    { name: 'bottomLeft', pos: corners.bottomLeft }
  ];
  
  const heightGroups = new Map<HeightLevel, Array<{ name: string; pos: any }>>();
  
  cornerPositions.forEach((corner, index) => {
    const height = cornerHeights[index];
    if (!heightGroups.has(height)) {
      heightGroups.set(height, []);
    }
    heightGroups.get(height)!.push(corner);
  });
  
  heightGroups.forEach((cornersAtHeight) => {
    if (cornersAtHeight.length >= 2) {
      for (let i = 0; i < cornersAtHeight.length - 1; i++) {
        const startCorner = cornersAtHeight[i];
        const endCorner = cornersAtHeight[i + 1];
        
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
