import type { TerrainType } from '../types/terrain';
import type { GridSize } from '../types/grid';
import { TERRAIN_DATA } from '../types/terrain';

// 地形生成の定数
const TERRAIN_CONSTANTS = {
  // 水辺・砂浜の設定
  WATER: {
    EDGE_THRESHOLD_RATIO: 0.12,        // 境界付近の水辺エリア比率
    POINT_STRENGTH_MIN: 0.9,           // 水辺ポイントの最小強度
    POINT_STRENGTH_MAX: 1.2,           // 水辺ポイントの最大強度
    DISTANCE_THRESHOLD: 5,             // 水辺エリアの距離閾値
    NORTH_POINTS_RATIO: 0.4,           // 北側水辺ポイントの比率
    EAST_POINTS_RATIO: 0.4,            // 東側水辺ポイントの比率
    SOUTH_POINTS_RATIO: 0.4,           // 南側水辺ポイントの比率
    WEST_POINTS_RATIO: 0.4,            // 西側水辺ポイントの比率
    NORTH_Y_RATIO: 0.12,               // 北側水辺のY座標比率
    EAST_X_RATIO: 0.88,                // 東側水辺のX座標比率
    SOUTH_Y_RATIO: 0.88,               // 南側水辺のY座標比率
    WEST_X_RATIO: 0.12,                // 西側水辺のX座標比率
  },
  
  // 砂浜の設定
  BEACH: {
    THRESHOLD_OFFSET: 8,               // 水辺エリアからの砂浜オフセット
    DISTANCE_MIN: 5,                   // 砂浜生成の最小距離
    DISTANCE_MAX: 10,                  // 砂浜生成の最大距離
    HEIGHT_THRESHOLD: 0.6,             // 砂浜生成の高さ閾値
  },
  
  // 低地の設定
  LOWLAND: {
    DISTANCE_BASE: 10,                 // 低地生成の基本距離
    DISTANCE_VARIANCE: 1,              // 低地生成の距離変動
    HEIGHT_THRESHOLD: 0.45,            // 低地生成の高さ閾値
    MOISTURE_THRESHOLD: 0.65,          // 低地生成の湿度閾値
  },
  
  // 山岳の設定
  MOUNTAIN: {
    WATER_DISTANCE_MIN: 20,            // 山岳生成の最小水辺距離
    HEIGHT_THRESHOLD: 0.65,            // 山岳生成の高さ閾値
    BASE_CHANCE: 0.9,                  // 山岳生成の基本確率
    HEIGHT_MULTIPLIER: 3,              // 高さによる確率倍率
    CONTINUITY_THRESHOLD: 0.325,       // 山岳の連続性閾値
    SECONDARY_HEIGHT: 0.53,            // 二次的な山岳生成の高さ閾値
  },
  
  // 森林の設定
  FOREST: {
    WATER_DISTANCE_MIN: 22,            // 森林生成の最小水辺距離
    WATER_DISTANCE_MID_MIN: 10,        // 中距離森林生成の最小距離
    WATER_DISTANCE_MID_MAX: 15,        // 中距離森林生成の最大距離
    HEIGHT_THRESHOLD_HIGH: 0.4,      // 高地森林生成の高さ閾値
    HEIGHT_THRESHOLD_MID: 0.25,        // 中地森林生成の高さ閾値
    HEIGHT_THRESHOLD_MID_DISTANCE: 0.4, // 中距離森林生成の高さ閾値
    MOISTURE_THRESHOLD_HIGH: 0.525,    // 高地森林生成の湿度閾値
    MOISTURE_THRESHOLD_MID: 0.6,       // 中地森林生成の湿度閾値
    MOISTURE_THRESHOLD_LOW: 0.65,      // 低地森林生成の湿度閾値
    MOISTURE_THRESHOLD_MID_DISTANCE: 0.6, // 中距離森林生成の湿度閾値
    MOISTURE_THRESHOLD_MID_DISTANCE_HIGH: 0.7, // 中距離森林生成の高湿度閾値
    CONTINUITY_THRESHOLD: 0.4,         // 森林の連続性閾値
    SECONDARY_HEIGHT: 0.54,            // 二次的な生成の高さ閾値
  },
  
  // ノイズ生成の設定
  NOISE: {
    HEIGHT_SCALE: 0.025,               // 高度ノイズのスケール
    MOISTURE_SCALE: 0.04,              // 湿度ノイズのスケール
    OCTAVES: 5,                        // ノイズのオクターブ数
    PERSISTENCE: 0.55,                 // ノイズの持続性
    MOISTURE_OFFSET: 1000,             // 湿度ノイズのオフセット
  }
} as const;

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextRange(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}

function hash(x: number, y: number, seed: number): number {
  let hash = x * 374761393 + y * 668265263 + seed;
  hash = (hash ^ (hash >> 13)) * 1274124157;
  hash = hash ^ (hash >> 16);
  return (hash & 0x7fffffff) / 0x7fffffff;
}

function simpleNoise(x: number, y: number, seed: number): number {
  return hash(x, y, seed);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const corners = (simpleNoise(x - 1, y - 1, seed) + simpleNoise(x + 1, y - 1, seed) + 
                   simpleNoise(x - 1, y + 1, seed) + simpleNoise(x + 1, y + 1, seed)) / 16;
  const sides = (simpleNoise(x - 1, y, seed) + simpleNoise(x + 1, y, seed) + 
                 simpleNoise(x, y - 1, seed) + simpleNoise(x, y + 1, seed)) / 8;
  const center = simpleNoise(x, y, seed) / 4;
  return corners + sides + center;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function interpolate(a: number, b: number, weight: number): number {
  return a + (b - a) * smoothstep(0, 1, weight);
}

function interpolatedNoise(x: number, y: number, seed: number): number {
  const intX = Math.floor(x);
  const intY = Math.floor(y);
  const fracX = x - intX;
  const fracY = y - intY;

  const v1 = smoothNoise(intX, intY, seed);
  const v2 = smoothNoise(intX + 1, intY, seed);
  const v3 = smoothNoise(intX, intY + 1, seed);
  const v4 = smoothNoise(intX + 1, intY + 1, seed);

  const i1 = interpolate(v1, v2, fracX);
  const i2 = interpolate(v3, v4, fracX);

  return interpolate(i1, i2, fracY);
}

function perlinNoise(x: number, y: number, octaves: number, persistence: number, scale: number, seed: number): number {
  let total = 0;
  let frequency = scale;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += interpolatedNoise(x * frequency, y * frequency, seed) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}

function generateWaterPoints(gridSize: GridSize, random: SeededRandom): { waterPoints: Array<{x: number, y: number, strength: number}>, selectedDirections: string[] } {
  const waterPoints: Array<{x: number, y: number, strength: number}> = [];
  
  // 4方向からランダムに2方向を選択
  const directions = ['north', 'east', 'south', 'west'];
  const selectedDirections: string[] = [];
  
  // ランダムに2方向を選択
  while (selectedDirections.length < 2) {
    const randomIndex = Math.floor(random.next() * directions.length);
    const direction = directions[randomIndex];
    if (!selectedDirections.includes(direction)) {
      selectedDirections.push(direction);
    }
  }
  
  if (selectedDirections.includes('north')) {
    const northPoints = Math.floor(gridSize.width * TERRAIN_CONSTANTS.WATER.NORTH_POINTS_RATIO);
    for (let i = 0; i < northPoints; i++) {
      const x = random.nextRange(0, gridSize.width);
      const y = random.nextRange(0, gridSize.height * TERRAIN_CONSTANTS.WATER.NORTH_Y_RATIO);
      const strength = random.nextRange(TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MIN, TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MAX);
      waterPoints.push({x, y, strength});
    }
  }
  
  if (selectedDirections.includes('east')) {
    const eastPoints = Math.floor(gridSize.height * TERRAIN_CONSTANTS.WATER.EAST_POINTS_RATIO);
    for (let i = 0; i < eastPoints; i++) {
      const x = random.nextRange(gridSize.width * TERRAIN_CONSTANTS.WATER.EAST_X_RATIO, gridSize.width);
      const y = random.nextRange(0, gridSize.height);
      const strength = random.nextRange(TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MIN, TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MAX);
      waterPoints.push({x, y, strength});
    }
  }
  
  if (selectedDirections.includes('south')) {
    const southPoints = Math.floor(gridSize.width * TERRAIN_CONSTANTS.WATER.SOUTH_POINTS_RATIO);
    for (let i = 0; i < southPoints; i++) {
      const x = random.nextRange(0, gridSize.width);
      const y = random.nextRange(gridSize.height * TERRAIN_CONSTANTS.WATER.SOUTH_Y_RATIO, gridSize.height);
      const strength = random.nextRange(TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MIN, TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MAX);
      waterPoints.push({x, y, strength});
    }
  }
  
  if (selectedDirections.includes('west')) {
    const westPoints = Math.floor(gridSize.height * TERRAIN_CONSTANTS.WATER.WEST_POINTS_RATIO);
    for (let i = 0; i < westPoints; i++) {
      const x = random.nextRange(0, gridSize.width * TERRAIN_CONSTANTS.WATER.WEST_X_RATIO);
      const y = random.nextRange(0, gridSize.height);
      const strength = random.nextRange(TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MIN, TERRAIN_CONSTANTS.WATER.POINT_STRENGTH_MAX);
      waterPoints.push({x, y, strength});
    }
  }
  
  return { waterPoints, selectedDirections };
}

function calculateWaterDistance(x: number, y: number, waterPoints: Array<{x: number, y: number, strength: number}>): number {
  let minDistance = Infinity;
  
  for (const point of waterPoints) {
    const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
    const adjustedDistance = distance / point.strength;
    if (adjustedDistance < minDistance) {
      minDistance = adjustedDistance;
    }
  }
  
  return minDistance;
}

function isWaterArea(x: number, y: number, waterPoints: Array<{x: number, y: number, strength: number}>, gridSize: GridSize, selectedDirections: string[]): boolean {
  const edgeThreshold = Math.min(gridSize.width, gridSize.height) * TERRAIN_CONSTANTS.WATER.EDGE_THRESHOLD_RATIO;
  
  if (selectedDirections.includes('north') && y < edgeThreshold) {
    return true;
  }
  
  if (selectedDirections.includes('east') && x >= gridSize.width - edgeThreshold) {
    return true;
  }
  
  if (selectedDirections.includes('south') && y >= gridSize.height - edgeThreshold) {
    return true;
  }
  
  if (selectedDirections.includes('west') && x < edgeThreshold) {
    return true;
  }
  
  const minDistance = calculateWaterDistance(x, y, waterPoints);
  return minDistance < TERRAIN_CONSTANTS.WATER.DISTANCE_THRESHOLD;
}

function isBeachArea(x: number, y: number, waterPoints: Array<{x: number, y: number, strength: number}>, gridSize: GridSize, selectedDirections: string[]): boolean {
  const edgeThreshold = Math.min(gridSize.width, gridSize.height) * TERRAIN_CONSTANTS.WATER.EDGE_THRESHOLD_RATIO;
  const beachThreshold = edgeThreshold + TERRAIN_CONSTANTS.BEACH.THRESHOLD_OFFSET;
  
  if (selectedDirections.includes('north') && y < beachThreshold && y >= edgeThreshold) {
    return true;
  }
  
  if (selectedDirections.includes('east') && x >= gridSize.width - beachThreshold && x < gridSize.width - edgeThreshold) {
    return true;
  }
  
  if (selectedDirections.includes('south') && y >= gridSize.height - beachThreshold && y < gridSize.height - edgeThreshold) {
    return true;
  }
  
  if (selectedDirections.includes('west') && x < beachThreshold && x >= edgeThreshold) {
    return true;
  }
  
  const minDistance = calculateWaterDistance(x, y, waterPoints);
  return minDistance >= TERRAIN_CONSTANTS.BEACH.DISTANCE_MIN && minDistance < TERRAIN_CONSTANTS.BEACH.DISTANCE_MAX;
}

export function generateNaturalTerrainMap(gridSize: GridSize): Map<string, TerrainType> {
  const terrainMap = new Map<string, TerrainType>();
  
  const seed = Math.floor(Math.random() * 1000000);
  const random = new SeededRandom(seed);
  
  const heightScale = TERRAIN_CONSTANTS.NOISE.HEIGHT_SCALE;
  const moistureScale = TERRAIN_CONSTANTS.NOISE.MOISTURE_SCALE;
  const octaves = TERRAIN_CONSTANTS.NOISE.OCTAVES;
  const persistence = TERRAIN_CONSTANTS.NOISE.PERSISTENCE;
  
  const { waterPoints, selectedDirections } = generateWaterPoints(gridSize, random);
  
  const heightMap = new Map<string, number>();
  const moistureMap = new Map<string, number>();
  const waterDistanceMap = new Map<string, number>();
  
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const height = perlinNoise(x, y, octaves, persistence, heightScale, seed);
      heightMap.set(`${x},${y}`, height);
      
      const moisture = perlinNoise(x + TERRAIN_CONSTANTS.NOISE.MOISTURE_OFFSET, y + TERRAIN_CONSTANTS.NOISE.MOISTURE_OFFSET, octaves, persistence, moistureScale, seed + 1);
      moistureMap.set(`${x},${y}`, moisture);
      
      const waterDistance = calculateWaterDistance(x, y, waterPoints);
      waterDistanceMap.set(`${x},${y}`, waterDistance);
    }
  }
  
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const height = heightMap.get(`${x},${y}`)!;
      const moisture = moistureMap.get(`${x},${y}`)!;
      const waterDistance = waterDistanceMap.get(`${x},${y}`)!;
      
      const terrain = determineTerrainType(x, y, height, moisture, waterDistance, waterPoints, gridSize, random, selectedDirections);
      terrainMap.set(`${x},${y}`, terrain);
    }
  }
  
  const improvedTerrainMap = new Map<string, TerrainType>();
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const currentTerrain = terrainMap.get(`${x},${y}`)!;
      const improvedTerrain = improveTerrainContinuity(x, y, currentTerrain, terrainMap, gridSize);
      improvedTerrainMap.set(`${x},${y}`, improvedTerrain);
    }
  }

  return improvedTerrainMap;
}

function determineTerrainType(
  x: number, 
  y: number, 
  height: number, 
  moisture: number, 
  waterDistance: number, 
  waterPoints: Array<{x: number, y: number, strength: number}>,
  gridSize: GridSize,
  random: SeededRandom,
  selectedDirections: string[]
): TerrainType {
  
  if (isWaterArea(x, y, waterPoints, gridSize, selectedDirections)) {
    return 'water';
  }
  
  if (isBeachArea(x, y, waterPoints, gridSize, selectedDirections) && height < TERRAIN_CONSTANTS.BEACH.HEIGHT_THRESHOLD) {
    return 'beach';
  }
  
  const lowlandDistance = TERRAIN_CONSTANTS.LOWLAND.DISTANCE_BASE + random.nextRange(-TERRAIN_CONSTANTS.LOWLAND.DISTANCE_VARIANCE, TERRAIN_CONSTANTS.LOWLAND.DISTANCE_VARIANCE);
  if (waterDistance < lowlandDistance && height < TERRAIN_CONSTANTS.LOWLAND.HEIGHT_THRESHOLD) {
    if (moisture > TERRAIN_CONSTANTS.LOWLAND.MOISTURE_THRESHOLD) {
      return 'grass';
    }
    return 'grass';
  }
  
  // 水辺から十分離れた場所でのみ山岳・森林を生成
  if (waterDistance > TERRAIN_CONSTANTS.MOUNTAIN.WATER_DISTANCE_MIN) {
    if (height > TERRAIN_CONSTANTS.MOUNTAIN.HEIGHT_THRESHOLD) {
      const mountainChance = TERRAIN_CONSTANTS.MOUNTAIN.BASE_CHANCE + (height - TERRAIN_CONSTANTS.MOUNTAIN.HEIGHT_THRESHOLD) * TERRAIN_CONSTANTS.MOUNTAIN.HEIGHT_MULTIPLIER;
      
      if (random.next() < mountainChance) {
        return 'mountain';
      }
    }
    
    if (height > TERRAIN_CONSTANTS.FOREST.HEIGHT_THRESHOLD_MID_DISTANCE) {
      if (moisture > TERRAIN_CONSTANTS.FOREST.MOISTURE_THRESHOLD_MID_DISTANCE_HIGH) {
        return 'forest';
      }
             if (height > TERRAIN_CONSTANTS.MOUNTAIN.SECONDARY_HEIGHT) {
        return 'mountain';
      }
      return 'grass';
    }
    
    if (height > TERRAIN_CONSTANTS.FOREST.HEIGHT_THRESHOLD_MID) {
      if (moisture > TERRAIN_CONSTANTS.FOREST.MOISTURE_THRESHOLD_MID) {
        return 'forest';
      }
      return 'grass';
    }
    
    if (height > TERRAIN_CONSTANTS.FOREST.HEIGHT_THRESHOLD_MID_DISTANCE) {
      if (moisture > TERRAIN_CONSTANTS.FOREST.MOISTURE_THRESHOLD_MID_DISTANCE) {
        return 'forest';
      }
    }
  }
  
  // 水辺から中程度の距離でも森林を生成
  if (waterDistance > TERRAIN_CONSTANTS.FOREST.WATER_DISTANCE_MID_MIN && waterDistance <= TERRAIN_CONSTANTS.FOREST.WATER_DISTANCE_MID_MAX) {
    if (height > TERRAIN_CONSTANTS.FOREST.HEIGHT_THRESHOLD_MID_DISTANCE && moisture > TERRAIN_CONSTANTS.FOREST.MOISTURE_THRESHOLD_MID_DISTANCE) {
      return 'forest';
    }
    if (moisture > TERRAIN_CONSTANTS.FOREST.MOISTURE_THRESHOLD_MID_DISTANCE_HIGH) {
      return 'forest';
    }
  }
  
  // 水辺の近くは基本的に平地
  return 'grass';
}

function improveTerrainContinuity(
  x: number, 
  y: number, 
  currentTerrain: TerrainType, 
  terrainMap: Map<string, TerrainType>, 
  gridSize: GridSize
): TerrainType {
  
  if (currentTerrain === 'water') {
    const neighbors = getNeighborTiles(x, y, gridSize);
    let waterNeighbors = 0;
    let totalNeighbors = 0;
    
    for (const neighbor of neighbors) {
      const neighborTerrain = terrainMap.get(neighbor);
      if (neighborTerrain) {
        totalNeighbors++;
        if (neighborTerrain === 'water') {
          waterNeighbors++;
        }
      }
    }
    
    if (totalNeighbors > 0 && waterNeighbors / totalNeighbors > 0.5) {
      return 'water';
    }
  }
  
  if (currentTerrain === 'beach') {
    const neighbors = getNeighborTiles(x, y, gridSize);
    let waterNeighbors = 0;
    let beachNeighbors = 0;
    let totalNeighbors = 0;
    
    for (const neighbor of neighbors) {
      const neighborTerrain = terrainMap.get(neighbor);
      if (neighborTerrain) {
        totalNeighbors++;
        if (neighborTerrain === 'water') {
          waterNeighbors++;
        }
        else if (neighborTerrain === 'beach') {
          beachNeighbors++;
        }
      }
    }
    
    if (totalNeighbors > 0 && (waterNeighbors + beachNeighbors) / totalNeighbors > 0.3) {
      return 'beach';
    }
  }
  
  if (currentTerrain === 'mountain') {
    const neighbors = getNeighborTiles(x, y, gridSize);
    let mountainNeighbors = 0;
    let totalNeighbors = 0;
    
    for (const neighbor of neighbors) {
      const neighborTerrain = terrainMap.get(neighbor);
      if (neighborTerrain) {
        totalNeighbors++;
        if (neighborTerrain === 'mountain') {
          mountainNeighbors++;
        }
      }
    }
    
    if (totalNeighbors > 0 && mountainNeighbors / totalNeighbors > TERRAIN_CONSTANTS.MOUNTAIN.CONTINUITY_THRESHOLD) {
      return 'mountain';
    }
  }
  
  if (currentTerrain === 'forest') {
    const neighbors = getNeighborTiles(x, y, gridSize);
    let forestNeighbors = 0;
    let totalNeighbors = 0;
    
    for (const neighbor of neighbors) {
      const neighborTerrain = terrainMap.get(neighbor);
      if (neighborTerrain) {
        totalNeighbors++;
        if (neighborTerrain === 'forest') {
          forestNeighbors++;
        }
      }
    }
    
    if (totalNeighbors > 0 && forestNeighbors / totalNeighbors > TERRAIN_CONSTANTS.FOREST.CONTINUITY_THRESHOLD) { // 0.4 → 0.3 に下げて森林の連続性を向上
      return 'forest';
    }
  }
  
  return currentTerrain;
}

function getNeighborTiles(x: number, y: number, gridSize: GridSize): string[] {
  const neighbors: string[] = [];
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < gridSize.width && ny >= 0 && ny < gridSize.height) {
        neighbors.push(`${nx},${ny}`);
      }
    }
  }
  
  return neighbors;
}

export function getBuildability(terrain: TerrainType): boolean {
  return TERRAIN_DATA[terrain]?.buildable || false;
}

export function getTerrainSatisfactionModifier(terrain: TerrainType): number {
  return TERRAIN_DATA[terrain]?.satisfactionModifier || 0;
}
