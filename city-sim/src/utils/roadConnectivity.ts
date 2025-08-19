import type { Facility } from '../types/facility';
import type { Position } from '../types/grid';

// 道路接続状態のキャッシュ
const connectionCache = new Map<string, boolean>();
const roadNetworkCache = new Map<string, Set<string>>();

// キャッシュをクリアする関数
export function clearConnectionCache(): void {
  connectionCache.clear();
  roadNetworkCache.clear();
}

// 指定された位置の隣接タイルの座標を取得
export function getNeighborPositions(position: Position): Position[] {
  return [
    { x: position.x - 1, y: position.y },     // 左
    { x: position.x + 1, y: position.y },     // 右
    { x: position.x, y: position.y - 1 },     // 上
    { x: position.x, y: position.y + 1 }      // 下
  ];
}

// 指定された位置に道路施設があるかチェック
export function hasRoadAtPosition(position: Position, facilities: Facility[]): boolean {
  return facilities.some(facility => 
    facility.type === 'road' && 
    facility.occupiedTiles.some(tile => 
      tile.x === position.x && tile.y === position.y
    )
  );
}

// 道路の接続性を判定し、接続された道路のIDセットを取得（キャッシュ付き）
export function findConnectedRoads(
  startPosition: Position, 
  facilities: Facility[], 
  gridSize: { width: number; height: number }
): Set<string> {
  const cacheKey = `${startPosition.x},${startPosition.y}`;
  if (roadNetworkCache.has(cacheKey)) {
    return roadNetworkCache.get(cacheKey)!;
  }

  const visited = new Set<string>();
  const queue: Position[] = [startPosition];
  const connectedRoads = new Set<string>();
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // 道路があるかチェック
    if (hasRoadAtPosition(current, facilities)) {
      // 道路施設のIDを取得
      const roadFacility = facilities.find(facility => 
        facility.type === 'road' && 
        facility.occupiedTiles.some(tile => 
          tile.x === current.x && tile.y === current.y
        )
      );
      
      if (roadFacility) {
        connectedRoads.add(roadFacility.id);
      }
      
      // 隣接タイルを探索
      const neighbors = getNeighborPositions(current);
      for (const neighbor of neighbors) {
        // グリッド範囲内かチェック
        if (neighbor.x >= 0 && neighbor.x < gridSize.width && 
            neighbor.y >= 0 && neighbor.y < gridSize.height) {
          queue.push(neighbor);
        }
      }
    }
  }
  
  // キャッシュに保存
  roadNetworkCache.set(cacheKey, connectedRoads);
  return connectedRoads;
}

// 施設が道路に接続されているか判定（キャッシュ付き）
export function isFacilityConnectedToRoad(
  facility: Facility, 
  facilities: Facility[], 
  gridSize: { width: number; height: number }
): boolean {
  // 道路施設は常に接続されているとみなす
  if (facility.type === 'road') {
    return true;
  }
  
  // キャッシュキーを生成
  const cacheKey = `${facility.id}_road_connection`;
  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey)!;
  }
  
  // 施設の各タイルについて道路接続をチェック
  for (const tile of facility.occupiedTiles) {
    const neighbors = getNeighborPositions(tile);
    
    for (const neighbor of neighbors) {
      // グリッド範囲内かチェック
      if (neighbor.x >= 0 && neighbor.x < gridSize.width && 
          neighbor.y >= 0 && neighbor.y < gridSize.height) {
        
        // 隣接タイルに道路があるかチェック
        if (hasRoadAtPosition(neighbor, facilities)) {
          // 結果をキャッシュ
          connectionCache.set(cacheKey, true);
          return true;
        }
      }
    }
  }
  
  // 結果をキャッシュ
  connectionCache.set(cacheKey, false);
  return false;
}

// 道路がマップ端まで続いているか判定（キャッシュ付き）
export function isRoadConnectedToMapEdge(
  roadPosition: Position, 
  facilities: Facility[], 
  gridSize: { width: number; height: number }
): boolean {
  const cacheKey = `${roadPosition.x},${roadPosition.y}_map_edge`;
  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey)!;
  }

  const visited = new Set<string>();
  const queue: Position[] = [roadPosition];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.x},${current.y}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    // マップエッジに到達したかチェック
    if (current.x === 0 || current.x === gridSize.width - 1 || 
        current.y === 0 || current.y === gridSize.height - 1) {
      connectionCache.set(cacheKey, true);
      return true;
    }
    
    // 道路があるかチェック
    if (hasRoadAtPosition(current, facilities)) {
      // 隣接タイルを探索
      const neighbors = getNeighborPositions(current);
      for (const neighbor of neighbors) {
        // グリッド範囲内かチェック
        if (neighbor.x >= 0 && neighbor.x < gridSize.width && 
            neighbor.y >= 0 && neighbor.y < gridSize.height) {
          queue.push(neighbor);
        }
      }
    }
  }
  
  // 結果をキャッシュ
  connectionCache.set(cacheKey, false);
  return false;
}

// 施設が有効な道路ネットワークに接続されているか判定（キャッシュ付き）
export function isFacilityConnectedToValidRoadNetwork(
  facility: Facility, 
  facilities: Facility[], 
  gridSize: { width: number; height: number }
): boolean {
  // 道路施設は常に有効
  if (facility.type === 'road') {
    return true;
  }
  
  // キャッシュキーを生成
  const cacheKey = `${facility.id}_valid_network`;
  if (connectionCache.has(cacheKey)) {
    return connectionCache.get(cacheKey)!;
  }
  
  // 施設が道路に接続されているかチェック
  if (!isFacilityConnectedToRoad(facility, facilities, gridSize)) {
    connectionCache.set(cacheKey, false);
    return false;
  }
  
  // 接続されている道路がマップエッジまで続いているかチェック
  for (const tile of facility.occupiedTiles) {
    const neighbors = getNeighborPositions(tile);
    
    for (const neighbor of neighbors) {
      // グリッド範囲内かチェック
      if (neighbor.x >= 0 && neighbor.x < gridSize.width && 
          neighbor.y >= 0 && neighbor.y < gridSize.height) {
        
        // 隣接タイルに道路があるかチェック
        if (hasRoadAtPosition(neighbor, facilities)) {
          // この道路がマップエッジまで続いているかチェック
          if (isRoadConnectedToMapEdge(neighbor, facilities, gridSize)) {
            connectionCache.set(cacheKey, true);
            return true;
          }
        }
      }
    }
  }
  
  // 結果をキャッシュ
  connectionCache.set(cacheKey, false);
  return false;
}
