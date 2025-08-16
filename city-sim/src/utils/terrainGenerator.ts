import type { TerrainType } from '../types/terrain';
import type { GridSize } from '../types/grid';
import { TERRAIN_DATA } from '../types/terrain';

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

function generateWaterPoints(gridSize: GridSize, random: SeededRandom): Array<{x: number, y: number, strength: number}> {
  const waterPoints: Array<{x: number, y: number, strength: number}> = [];
  
  // 北側の水辺
  const northPoints = Math.floor(gridSize.width * 0.4);
  for (let i = 0; i < northPoints; i++) {
    const x = random.nextRange(0, gridSize.width);
    const y = random.nextRange(0, gridSize.height * 0.12);
    const strength = random.nextRange(0.9, 1.2);
    waterPoints.push({x, y, strength});
  }
  
  // 東側の水辺
  const eastPoints = Math.floor(gridSize.height * 0.4);
  for (let i = 0; i < eastPoints; i++) {
    const x = random.nextRange(gridSize.width * 0.88, gridSize.width);
    const y = random.nextRange(0, gridSize.height);
    const strength = random.nextRange(0.9, 1.2);
    waterPoints.push({x, y, strength});
  }
  
  // 南西側の水辺は削除（不自然な配置を防ぐ）
  
  return waterPoints;
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

function isWaterArea(x: number, y: number, waterPoints: Array<{x: number, y: number, strength: number}>, gridSize: GridSize): boolean {
  const edgeThreshold = Math.min(gridSize.width, gridSize.height) * 0.12;
  
  // 北側の境界
  if (y < edgeThreshold) {
    return true;
  }
  
  // 東側の境界
  if (x >= gridSize.width - edgeThreshold) {
    return true;
  }
  
  // 南西側の水辺は削除（不自然な配置を防ぐ）
  
  const minDistance = calculateWaterDistance(x, y, waterPoints);
  return minDistance < 5;
}

function isBeachArea(x: number, y: number, waterPoints: Array<{x: number, y: number, strength: number}>, gridSize: GridSize): boolean {
  const edgeThreshold = Math.min(gridSize.width, gridSize.height) * 0.12;
  const beachThreshold = edgeThreshold + 8;
  
  // 北側の砂浜
  if (y < beachThreshold && y >= edgeThreshold) {
    return true;
  }
  
  // 東側の砂浜
  if (x >= gridSize.width - beachThreshold && x < gridSize.width - edgeThreshold) {
    return true;
  }
  
  // 南西側の砂浜は削除（不自然な配置を防ぐ）
  
  const minDistance = calculateWaterDistance(x, y, waterPoints);
  return minDistance >= 5 && minDistance < 10;
}

export function generateNaturalTerrainMap(gridSize: GridSize): Map<string, TerrainType> {
  const terrainMap = new Map<string, TerrainType>();
  
  const seed = Math.floor(Math.random() * 1000000);
  const random = new SeededRandom(seed);
  
  const heightScale = 0.025;
  const moistureScale = 0.04;
  const octaves = 5;
  const persistence = 0.55;
  
  const waterPoints = generateWaterPoints(gridSize, random);
  
  const heightMap = new Map<string, number>();
  const moistureMap = new Map<string, number>();
  const waterDistanceMap = new Map<string, number>();
  
  for (let x = 0; x < gridSize.width; x++) {
    for (let y = 0; y < gridSize.height; y++) {
      const height = perlinNoise(x, y, octaves, persistence, heightScale, seed);
      heightMap.set(`${x},${y}`, height);
      
      const moisture = perlinNoise(x + 1000, y + 1000, octaves, persistence, moistureScale, seed + 1);
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
      
      const terrain = determineTerrainType(x, y, height, moisture, waterDistance, waterPoints, gridSize, random);
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
  random: SeededRandom
): TerrainType {
  
  if (isWaterArea(x, y, waterPoints, gridSize)) {
    return 'water';
  }
  
  if (isBeachArea(x, y, waterPoints, gridSize) && height < 0.6) {
    return 'beach';
  }
  
  const lowlandDistance = 10 + random.nextRange(-1, 1);
  if (waterDistance < lowlandDistance && height < 0.45) {
    if (moisture > 0.65) {
      return 'grass';
    }
    return 'grass';
  }
  
  // 水辺から十分離れた場所でのみ山岳・森林を生成
  if (waterDistance > 20) {
    if (height > 0.65) {
      const mountainChance = 0.9 + (height - 0.65) * 3;
      
      if (random.next() < mountainChance) {
        return 'mountain';
      }
    }
    
    if (height > 0.5) {
      if (moisture > 0.6) {
        return 'forest';
      }
      if (height > 0.6) {
        return 'mountain';
      }
      return 'grass';
    }
    
    if (height > 0.3) {
      if (moisture > 0.65) {
        return 'forest';
      }
      return 'grass';
    }
    
    if (moisture > 0.7) {
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
    
    if (totalNeighbors > 0 && mountainNeighbors / totalNeighbors > 0.4) {
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
    
    if (totalNeighbors > 0 && forestNeighbors / totalNeighbors > 0.4) {
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
