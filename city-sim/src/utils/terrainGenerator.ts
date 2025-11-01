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
    HEIGHT_THRESHOLD: 0.75,            // 山岳生成の高さ閾値（0.65→0.75）
    BASE_CHANCE: 0.2,                  // 山岳生成の基本確率（0.3→0.2）
    HEIGHT_MULTIPLIER: 2,              // 高さによる確率倍率（3→2）
    CONTINUITY_THRESHOLD: 0.3,       // 山岳の連続性閾値
    SECONDARY_HEIGHT: 0.60,            // 二次的な山岳生成の高さ閾値（0.53→0.60）
  },
  
  // 森林の設定
  FOREST: {
    WATER_DISTANCE_MIN: 22,            // 森林生成の最小水辺距離
    WATER_DISTANCE_MID_MIN: 10,        // 中距離森林生成の最小距離
    WATER_DISTANCE_MID_MAX: 15,        // 中距離森林生成の最大距離
    HEIGHT_THRESHOLD_HIGH: 0.4,        // 高地森林生成の高さ閾値
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
  },
  
  // 道路生成の設定
  ROAD: {
    CENTER_OFFSET: 0.3,                // マップ中央からのオフセット比率
    NORTH_START_X_RATIO: 0.3,          // 北側道路の開始X座標比率
    NORTH_END_Y_RATIO: 0.4,            // 北側道路の終端Y座標比率
    EAST_START_Y_RATIO: 0.3,           // 東側道路の開始Y座標比率
    EAST_END_X_RATIO: 0.6,             // 東側道路の終端X座標比率
    SOUTH_START_X_RATIO: 0.7,          // 南側道路の開始X座標比率
    SOUTH_END_Y_RATIO: 0.6,            // 南側道路の終端Y座標比率
    WEST_START_Y_RATIO: 0.7,           // 西側道路の開始Y座標比率
    WEST_END_X_RATIO: 0.4,             // 西側道路の終端X座標比率
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

export function generateNaturalTerrainMap(gridSize: GridSize): {
  terrainMap: Map<string, TerrainType>;
  generatedRoads: Array<{x: number, y: number, variantIndex: number}>;
  selectedDirections: string[];
} {
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

  return {
    terrainMap: improvedTerrainMap,
    generatedRoads: [],
    selectedDirections
  };
}

// 既存の地形とノイズを流用して高さ地形を自然に生成
export function generateHeightTerrainMapFromTerrain(
  gridSize: GridSize,
  terrainMap: Map<string, TerrainType>,
  seed?: number
): Map<string, import('../types/terrainWithHeight').HeightTerrainTile> {
  const { HEIGHT_SCALE, OCTAVES, PERSISTENCE } = TERRAIN_CONSTANTS.NOISE;
  const usedSeed = seed ?? Math.floor(Math.random() * 1000000);

  // 中心高さの一次マップ（連続値 0..1）
  const continuousHeight = new Map<string, number>();
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const h = perlinNoise(x, y, OCTAVES, PERSISTENCE, HEIGHT_SCALE, usedSeed);
      continuousHeight.set(`${x},${y}`, h);
    }
  }

  // タイル中心の離散高さレベル 0..4 を terrain に合わせて割当
  const centerHeightLevel = new Map<string, number>();
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const key = `${x},${y}`;
      const terrain = terrainMap.get(key) ?? 'grass';
      const h = continuousHeight.get(key)!; // 0..1

      let level: number = 1;
      if (terrain === 'water') {
        level = 0;
      } else if (terrain === 'beach') {
        level = 1;
      } else if (terrain === 'grass') {
        // 草地は常に高さ1
        level = 1;
      } else if (terrain === 'forest') {
        level = h > 0.6 ? 3 : 2;
      } else if (terrain === 'mountain') {
        level = h > 0.7 ? 4 : 3;
      }

      centerHeightLevel.set(key, Math.max(0, Math.min(4, Math.round(level))));
    }
  }

  // コーナー高さを周辺4タイルの平均から決めて段階化
  function getCenterLevel(cx: number, cy: number): number | null {
    if (cx < 0 || cy < 0 || cx >= gridSize.width || cy >= gridSize.height) return null;
    const v = centerHeightLevel.get(`${cx},${cy}`);
    return v == null ? null : v;
  }

  const result = new Map<string, import('../types/terrainWithHeight').HeightTerrainTile>();

  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const key = `${x},${y}`;
      const terrain = terrainMap.get(key) ?? 'grass';
      const c = getCenterLevel(x, y) ?? 1;

      // TL/TR/BR/BL の各コーナーに対して周囲4セルの平均を使う
      const avgTL = averageDefined([
        getCenterLevel(x, y),
        getCenterLevel(x - 1, y),
        getCenterLevel(x, y - 1),
        getCenterLevel(x - 1, y - 1)
      ]);
      const avgTR = averageDefined([
        getCenterLevel(x, y),
        getCenterLevel(x + 1, y),
        getCenterLevel(x, y - 1),
        getCenterLevel(x + 1, y - 1)
      ]);
      const avgBR = averageDefined([
        getCenterLevel(x, y),
        getCenterLevel(x + 1, y),
        getCenterLevel(x, y + 1),
        getCenterLevel(x + 1, y + 1)
      ]);
      const avgBL = averageDefined([
        getCenterLevel(x, y),
        getCenterLevel(x - 1, y),
        getCenterLevel(x, y + 1),
        getCenterLevel(x - 1, y + 1)
      ]);

      // 角は丸めて HeightLevel に落とす（水面優先）
      function clampToLevel(v: number): 0 | 1 | 2 | 3 | 4 {
        const r = Math.max(0, Math.min(4, Math.round(v)));
        return r as 0 | 1 | 2 | 3 | 4;
      }

      const cornerHeights: [0|1|2|3|4, 0|1|2|3|4, 0|1|2|3|4, 0|1|2|3|4] = [
        clampToLevel(avgTL),
        clampToLevel(avgTR),
        clampToLevel(avgBR),
        clampToLevel(avgBL)
      ];

      // 中心高さは terrain に合わせたレベル（角との一貫性確保のため中央値に寄せる）
      const medianCenter = clampToLevel(median([c, avgTL, avgTR, avgBR, avgBL]));

      const hasWater = cornerHeights.includes(0);
      const isSlope = !hasWater && cornerHeights.some(h => h !== cornerHeights[0]);
      const isBuildable = terrain !== 'water';

      result.set(key, {
        terrain,
        height: medianCenter,
        cornerHeights,
        isSlope,
        isBuildable
      });
    }
  }

  return result;

  function averageDefined(values: Array<number | null>): number {
    const nums = values.filter((v): v is number => v != null);
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  function median(values: number[]): number {
    const arr = [...values].sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
  }
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

// 道路生成パターンを判定する関数
function determineRoadPattern(selectedDirections: string[]): 'through' | 'cutoff' {
  // 対向方向の組み合わせ
  const oppositePairs = [
    ['north', 'south'],
    ['east', 'west']
  ];
  
  // 貫通道路: 対向方向の両方に水辺がない場合
  for (const [dir1, dir2] of oppositePairs) {
    if (!selectedDirections.includes(dir1) && !selectedDirections.includes(dir2)) {
      return 'through';
    }
  }
  
  // それ以外は途切れ道路
  return 'cutoff';
}

// 指定された位置に道路を配置できるかチェックする関数
function canPlaceRoadAt(x: number, y: number, terrainMap: Map<string, TerrainType>): boolean {
  const terrain = terrainMap.get(`${x},${y}`);
  if (!terrain) return false;
  
  // 生成された道路は山タイルも貫く
  // 水辺以外の地形には道路を配置可能
  return terrain !== 'water';
}

// 貫通道路を生成する関数
function generateThroughRoads(
  gridSize: GridSize,
  selectedDirections: string[],
  terrainMap: Map<string, TerrainType>
): Array<{x: number, y: number, variantIndex: number}> {
  const roads: Array<{x: number, y: number, variantIndex: number}> = [];
  
  // 北-南の貫通道路（北と南に水辺がない場合）
  if (!selectedDirections.includes('north') && !selectedDirections.includes('south')) {
    const centerX = Math.floor(gridSize.width / 2);
    for (let y = 0; y < gridSize.height; y++) {
      if (canPlaceRoadAt(centerX, y, terrainMap)) {
        roads.push({ x: centerX, y, variantIndex: 0 }); // 直線道路
      }
    }
  }
  
  // 東-西の貫通道路（東と西に水辺がない場合）
  if (!selectedDirections.includes('east') && !selectedDirections.includes('west')) {
    const centerY = Math.floor(gridSize.height / 2);
    for (let x = 0; x < gridSize.width; x++) {
      if (canPlaceRoadAt(x, centerY, terrainMap)) {
        roads.push({ x, y: centerY, variantIndex: 0 }); // 直線道路
      }
    }
  }
  
  return roads;
}

// 途切れ道路を生成する関数
function generateCutoffRoads(
  gridSize: GridSize,
  selectedDirections: string[],
  terrainMap: Map<string, TerrainType>
): Array<{x: number, y: number, variantIndex: number}> {
  const roads: Array<{x: number, y: number, variantIndex: number}> = [];
  
  // 全方向のリスト
  const allDirections = ['north', 'east', 'south', 'west'];
  
  // 水辺がない方向（陸地がある方向）を特定
  const landDirections = allDirections.filter(direction => !selectedDirections.includes(direction));
  
  // 複数の陸地方向がある場合は、ランダムに一つを選択
  if (landDirections.length > 1) {
    const randomIndex = Math.floor(Math.random() * landDirections.length);
    const selectedLandDirection = landDirections[randomIndex];
    landDirections.splice(0, landDirections.length); // 配列をクリア
    landDirections.push(selectedLandDirection); // 選択された方向のみを追加
  }
  
  // 北側からの道路（北に水辺がない場合）
  if (landDirections.includes('north')) {
    const startX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.NORTH_START_X_RATIO);
    const endY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.NORTH_END_Y_RATIO);
    
    for (let y = 0; y <= endY; y++) {
      if (canPlaceRoadAt(startX, y, terrainMap)) {
        roads.push({ x: startX, y, variantIndex: 0 });
      }
    }
  }
  
  // 東側からの道路（東に水辺がない場合）
  if (landDirections.includes('east')) {
    const startY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.EAST_START_Y_RATIO);
    const endX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.EAST_END_X_RATIO);
    
    for (let x = gridSize.width - 1; x >= endX; x--) {
      if (canPlaceRoadAt(x, startY, terrainMap)) {
        roads.push({ x, y: startY, variantIndex: 0 });
      }
    }
  }
  
  // 南側からの道路（南に水辺がない場合）
  if (landDirections.includes('south')) {
    const startX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.SOUTH_START_X_RATIO);
    const endY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.SOUTH_END_Y_RATIO);
    
    for (let y = gridSize.height - 1; y >= endY; y--) {
      if (canPlaceRoadAt(startX, y, terrainMap)) {
        roads.push({ x: startX, y, variantIndex: 0 });
      }
    }
  }
  
  // 西側からの道路（西に水辺がない場合）
  if (landDirections.includes('west')) {
    const startY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.WEST_START_Y_RATIO);
    const endX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.WEST_END_X_RATIO);
    
    for (let x = 0; x <= endX; x++) {
      if (canPlaceRoadAt(x, startY, terrainMap)) {
        roads.push({ x, y: startY, variantIndex: 0 });
      }
    }
  }
  
  return roads;
}

export function getBuildability(terrain: TerrainType): boolean {
  return TERRAIN_DATA[terrain]?.buildable || false;
}

export function getTerrainSatisfactionModifier(terrain: TerrainType): number {
  return TERRAIN_DATA[terrain]?.satisfactionModifier || 0;
}

// 高さ地形を考慮した道路生成
export function generateRoadsWithHeight(
  gridSize: GridSize,
  selectedDirections: string[],
  terrainMap: Map<string, TerrainType>,
  heightTerrainMap: Map<string, import('../types/terrainWithHeight').HeightTerrainTile>
): Array<{x: number, y: number, variantIndex: number}> {
  const pattern = determineRoadPattern(selectedDirections);
  
  if (pattern === 'through') {
    return generateThroughRoadsWithHeight(gridSize, selectedDirections, terrainMap, heightTerrainMap);
  } 
  else {
    return generateCutoffRoadsWithHeight(gridSize, selectedDirections, terrainMap, heightTerrainMap);
  }
}

// 高さ地形を考慮した道路配置チェック
function canPlaceRoadAtWithHeight(
  x: number, 
  y: number, 
  terrainMap: Map<string, TerrainType>,
  heightTerrainMap: Map<string, import('../types/terrainWithHeight').HeightTerrainTile>
): boolean {
  const terrain = terrainMap.get(`${x},${y}`);
  if (!terrain || terrain === 'water') return false;
  
  // 高さ地形をチェック
  const heightTile = heightTerrainMap.get(`${x},${y}`);
  if (!heightTile) return false;
  
  // 高さ1のみ許可
  if (heightTile.height !== 1) return false;
  
  // 斜面は許可しない
  if (heightTile.isSlope) return false;
  
  return true;
}

// 高さ地形を考慮した貫通道路を生成
function generateThroughRoadsWithHeight(
  gridSize: GridSize,
  selectedDirections: string[],
  terrainMap: Map<string, TerrainType>,
  heightTerrainMap: Map<string, import('../types/terrainWithHeight').HeightTerrainTile>
): Array<{x: number, y: number, variantIndex: number}> {
  const roads: Array<{x: number, y: number, variantIndex: number}> = [];
  
  // 北-南の貫通道路（北と南に水辺がない場合）
  if (!selectedDirections.includes('north') && !selectedDirections.includes('south')) {
    const centerX = Math.floor(gridSize.width / 2);
    for (let y = 0; y < gridSize.height; y++) {
      if (canPlaceRoadAtWithHeight(centerX, y, terrainMap, heightTerrainMap)) {
        roads.push({ x: centerX, y, variantIndex: 0 });
      } else {
        break; // 斜面や高さ1以外にぶつかったら停止
      }
    }
  }
  
  // 東-西の貫通道路（東と西に水辺がない場合）
  if (!selectedDirections.includes('east') && !selectedDirections.includes('west')) {
    const centerY = Math.floor(gridSize.height / 2);
    for (let x = 0; x < gridSize.width; x++) {
      if (canPlaceRoadAtWithHeight(x, centerY, terrainMap, heightTerrainMap)) {
        roads.push({ x, y: centerY, variantIndex: 0 });
      } else {
        break; // 斜面や高さ1以外にぶつかったら停止
      }
    }
  }
  
  return roads;
}

// 高さ地形を考慮した途切れ道路を生成
function generateCutoffRoadsWithHeight(
  gridSize: GridSize,
  selectedDirections: string[],
  terrainMap: Map<string, TerrainType>,
  heightTerrainMap: Map<string, import('../types/terrainWithHeight').HeightTerrainTile>
): Array<{x: number, y: number, variantIndex: number}> {
  const roads: Array<{x: number, y: number, variantIndex: number}> = [];
  
  // 全方向のリスト
  const allDirections = ['north', 'east', 'south', 'west'];
  
  // 水辺がない方向（陸地がある方向）を特定
  const landDirections = allDirections.filter(direction => !selectedDirections.includes(direction));
  
  // 複数の陸地方向がある場合は、ランダムに一つを選択
  if (landDirections.length > 1) {
    const randomIndex = Math.floor(Math.random() * landDirections.length);
    const selectedLandDirection = landDirections[randomIndex];
    landDirections.splice(0, landDirections.length);
    landDirections.push(selectedLandDirection);
  }
  
  // 北側からの道路
  if (landDirections.includes('north')) {
    const startX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.NORTH_START_X_RATIO);
    const endY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.NORTH_END_Y_RATIO);
    
    for (let y = 0; y <= endY; y++) {
      if (canPlaceRoadAtWithHeight(startX, y, terrainMap, heightTerrainMap)) {
        roads.push({ x: startX, y, variantIndex: 0 });
      } else {
        break;
      }
    }
  }
  
  // 東側からの道路
  if (landDirections.includes('east')) {
    const startY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.EAST_START_Y_RATIO);
    const endX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.EAST_END_X_RATIO);
    
    for (let x = gridSize.width - 1; x >= endX; x--) {
      if (canPlaceRoadAtWithHeight(x, startY, terrainMap, heightTerrainMap)) {
        roads.push({ x, y: startY, variantIndex: 0 });
      } else {
        break;
      }
    }
  }
  
  // 南側からの道路
  if (landDirections.includes('south')) {
    const startX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.SOUTH_START_X_RATIO);
    const endY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.SOUTH_END_Y_RATIO);
    
    for (let y = gridSize.height - 1; y >= endY; y--) {
      if (canPlaceRoadAtWithHeight(startX, y, terrainMap, heightTerrainMap)) {
        roads.push({ x: startX, y, variantIndex: 0 });
      } else {
        break;
      }
    }
  }
  
  // 西側からの道路
  if (landDirections.includes('west')) {
    const startY = Math.floor(gridSize.height * TERRAIN_CONSTANTS.ROAD.WEST_START_Y_RATIO);
    const endX = Math.floor(gridSize.width * TERRAIN_CONSTANTS.ROAD.WEST_END_X_RATIO);
    
    for (let x = 0; x <= endX; x++) {
      if (canPlaceRoadAtWithHeight(x, startY, terrainMap, heightTerrainMap)) {
        roads.push({ x, y: startY, variantIndex: 0 });
      } else {
        break;
      }
    }
  }
  
  return roads;
}

// 道路生成のメイン関数
export function generateMapEdgeRoads(
  gridSize: GridSize,
  selectedDirections: string[],
  terrainMap: Map<string, TerrainType>
): Array<{x: number, y: number, variantIndex: number}> {
  const pattern = determineRoadPattern(selectedDirections);
  
  if (pattern === 'through') {
    return generateThroughRoads(gridSize, selectedDirections, terrainMap);
  } 
  else {
    return generateCutoffRoads(gridSize, selectedDirections, terrainMap);
  }
}
