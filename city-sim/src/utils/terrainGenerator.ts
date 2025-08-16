import type { TerrainType } from '../types/terrain';
import type { GridSize } from '../types/grid';
import { TERRAIN_DATA } from '../types/terrain';

// ノイズ関数
function simpleNoise(x: number, y: number): number {
  const n = x + y * 57;
  return ((n << 13) ^ n) * 0.000000000931322574615478515625;
}

// ノイズ関数
function smoothNoise(x: number, y: number): number {
  const corners = (simpleNoise(x - 1, y - 1) + simpleNoise(x + 1, y - 1) + 
                   simpleNoise(x - 1, y + 1) + simpleNoise(x + 1, y + 1)) / 16;
  const sides = (simpleNoise(x - 1, y) + simpleNoise(x + 1, y) + 
                 simpleNoise(x, y - 1) + simpleNoise(x, y + 1)) / 8;
  const center = simpleNoise(x, y) / 4;
  return corners + sides + center;
}

// 補間関数
function interpolate(a: number, b: number, weight: number): number {
  return a + (b - a) * weight;
}

// 補間ノイズ
function interpolatedNoise(x: number, y: number): number {
  const intX = Math.floor(x);
  const intY = Math.floor(y);
  const fracX = x - intX;
  const fracY = y - intY;

  const v1 = smoothNoise(intX, intY);
  const v2 = smoothNoise(intX + 1, intY);
  const v3 = smoothNoise(intX, intY + 1);
  const v4 = smoothNoise(intX + 1, intY + 1);

  const i1 = interpolate(v1, v2, fracX);
  const i2 = interpolate(v3, v4, fracX);

  return interpolate(i1, i2, fracY);
}

// 複数オクターブのノイズ
function perlinNoise(x: number, y: number, octaves: number, persistence: number, scale: number): number {
  let total = 0;
  let frequency = scale;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += interpolatedNoise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}

// 地形マップを生成
export function generateNaturalTerrainMap(gridSize: GridSize): Map<string, TerrainType> {
  const terrainMap = new Map<string, TerrainType>();
  
  // ノイズパラメータ
  const heightScale = 0.03;    // 高度のスケール
  const moistureScale = 0.05;  // 湿度のスケール
  const octaves = 4;           // ノイズの複雑さ
  const persistence = 0.5;     // 各オクターブの影響度
  
  // 高度マップと湿度マップを生成
  const heightMap = new Map<string, number>();
  const moistureMap = new Map<string, number>();
  
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      // 高度を生成（0-1の範囲）
      const height = perlinNoise(x, y, octaves, persistence, heightScale);
      heightMap.set(`${x},${y}`, height);
      
      // 湿度を生成（高度とは異なるスケールで）
      const moisture = perlinNoise(x + 1000, y + 1000, octaves, persistence, moistureScale);
      moistureMap.set(`${x},${y}`, moisture);
    }
  }
  
  // 地形を決定
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const height = heightMap.get(`${x},${y}`)!;
      const moisture = moistureMap.get(`${x},${y}`)!;
      
      const terrain = determineTerrainType(x, y, height, moisture, gridSize);
      terrainMap.set(`${x},${y}`, terrain);
    }
  }

  return terrainMap;
}

// 地形タイプを決定
function determineTerrainType(x: number, y: number, height: number, moisture: number, gridSize: GridSize): TerrainType {
  // 境界付近の処理
  const edgeDistance = Math.min(gridSize.width, gridSize.height) * 0.08;
  const isNearEdge = x < edgeDistance || x >= gridSize.width - edgeDistance ||
                     y < edgeDistance || y >= gridSize.height - edgeDistance;
  
  // 中心付近の処理
  const centerX = gridSize.width / 2;
  const centerY = gridSize.height / 2;
  const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const maxDistance = Math.min(gridSize.width, gridSize.height) * 0.35;
  const isNearCenter = distanceFromCenter < maxDistance;
  
  // 水辺の生成（境界付近、かつ低地）
  if (isNearEdge && height < 0.25) {
    if (Math.random() < 0.9) {
      return 'water';
    }
  }
  
  // 砂浜の生成（水辺の隣）
  if (isNearEdge && height < 0.35 && height >= 0.25) {
    if (Math.random() < 0.8) {
      return 'beach';
    }
  }
  
  // 山の生成（高地）
  if (height > 0.75) {
    if (moisture < 0.4) {
      return 'mountain';
    }
    else {
      return 'mountain';
    }
  }
  
  // 中程度の高度
  if (height > 0.55) {
    if (moisture > 0.7) {
      return 'forest';
    }
    else {
      return 'mountain';
    }
  }
  
  // 低地
  if (height > 0.35) {
    if (moisture > 0.7) {
      return 'forest';
    }
    else {
      return 'grass';
    }
  }
  
  // 最も低い場所
  if (moisture > 0.7) {
    return 'forest';
  }
  else {
    return 'grass';
  }
}

// 地形の建設適性を取得
export function getBuildability(terrain: TerrainType): boolean {
  return TERRAIN_DATA[terrain]?.buildable || false;
}

// 地形の満足度修正値を取得
export function getTerrainSatisfactionModifier(terrain: TerrainType): number {
  return TERRAIN_DATA[terrain]?.satisfactionModifier || 0;
}
