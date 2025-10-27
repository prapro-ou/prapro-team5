// アイソメトリック座標変換の定数
export const ISO_TILE_WIDTH = 32;
export const ISO_TILE_HEIGHT = 16;

// グリッド座標からアイソメトリック座標への変換
export const toIsometric = (x: number, y: number) => {
  const isoX = (x - y) * (ISO_TILE_WIDTH / 2);
  const isoY = (x + y) * (ISO_TILE_HEIGHT / 2);
  return { x: isoX, y: isoY };
};

// アイソメトリック座標からグリッド座標への変換
export const fromIsometric = (isoX: number, isoY: number) => {
  // 逆変換: isoX = (x - y) * (ISO_TILE_WIDTH / 2), isoY = (x + y) * (ISO_TILE_HEIGHT / 2)
  // 解: x = (isoX / (ISO_TILE_WIDTH / 2) + isoY / (ISO_TILE_HEIGHT / 2)) / 2
  //    y = (isoY / (ISO_TILE_HEIGHT / 2) - isoX / (ISO_TILE_WIDTH / 2)) / 2
  const x = Math.round((isoX / (ISO_TILE_WIDTH / 2) + isoY / (ISO_TILE_HEIGHT / 2)) / 2);
  const y = Math.round((isoY / (ISO_TILE_HEIGHT / 2) - isoX / (ISO_TILE_WIDTH / 2)) / 2);
  return { x, y };
};

// 高さを考慮したグリッド座標への逆変換
export const fromIsometricWithHeight = (
  isoX: number, 
  isoY: number,
  heightTerrainMap?: Map<string, { height: number }>,
  heightOffsets?: Record<number, number>
): Array<{ x: number; y: number; distance: number }> => {
  // グリッド座標を取得
  const baseGrid = fromIsometric(isoX, isoY);
  
  if (!heightTerrainMap || !heightOffsets) {
    return [{ x: baseGrid.x, y: baseGrid.y, distance: 0 }];
  }
  
  // 周辺のタイルをチェック
  const candidates: Array<{ x: number; y: number; distance: number }> = [];
  
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      const checkX = baseGrid.x + dx;
      const checkY = baseGrid.y + dy;
      
      const tile = heightTerrainMap.get(`${checkX},${checkY}`);
      if (!tile) continue;
      
      // タイルのアイソメトリック座標を計算（offsetなし）
      const tileIsoX = (checkX - checkY) * (ISO_TILE_WIDTH / 2);
      const tileIsoY = (checkX + checkY) * (ISO_TILE_HEIGHT / 2);
      const heightOffset = heightOffsets[tile.height] || 0;
      const tileAdjustedIsoY = tileIsoY - heightOffset;
      
      // 菱形の中心座標を計算
      const tileCenterIsoX = tileIsoX + ISO_TILE_WIDTH / 2;
      const tileCenterIsoY = tileAdjustedIsoY;
      
      // 中心からの距離を計算
      const deltaX = isoX - tileCenterIsoX;
      const deltaY = isoY - tileCenterIsoY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      candidates.push({ x: checkX, y: checkY, distance: dist });
    }
  }
  
  // 距離ソート
  candidates.sort((a, b) => a.distance - b.distance);
  
  // 候補が見つからない場合は基本座標を返す
  if (candidates.length === 0) {
    return [{ x: baseGrid.x, y: baseGrid.y, distance: 0 }];
  }
  
  return candidates;
};

// スクリーン座標からワールド座標への変換
export const screenToWorld = (screenX: number, screenY: number, cameraX: number, cameraY: number) => {
  const worldX = screenX + cameraX;
  const worldY = screenY + cameraY;
  return { x: worldX, y: worldY };
};

// ワールド座標からスクリーン座標への変換
export const worldToScreen = (worldX: number, worldY: number, cameraX: number, cameraY: number) => {
  const screenX = worldX - cameraX;
  const screenY = worldY - cameraY;
  return { x: screenX, y: screenY };
};

// スクリーン座標からグリッド座標への変換
export const screenToGrid = (
  screenX: number, 
  screenY: number, 
  cameraX: number, 
  cameraY: number,
  offsetX: number = 0,
  offsetY: number = 0
) => {
  const world = screenToWorld(screenX, screenY, cameraX, cameraY);
  const adjustedX = world.x - offsetX;
  const adjustedY = world.y - offsetY;
  return fromIsometric(adjustedX, adjustedY);
};

// ビューポート四隅のグリッド座標を取得
export const getViewportBounds = (
  viewportWidth: number,
  viewportHeight: number,
  cameraX: number,
  cameraY: number,
  offsetX: number = 0,
  offsetY: number = 0
) => {
  // 四隅の座標
  const corners = [
    screenToGrid(0, 0, cameraX, cameraY, offsetX, offsetY),
    screenToGrid(viewportWidth, 0, cameraX, cameraY, offsetX, offsetY),
    screenToGrid(0, viewportHeight, cameraX, cameraY, offsetX, offsetY),
    screenToGrid(viewportWidth, viewportHeight, cameraX, cameraY, offsetX, offsetY),
  ];

  const minX = Math.min(...corners.map(c => c.x));
  const maxX = Math.max(...corners.map(c => c.x));
  const minY = Math.min(...corners.map(c => c.y));
  const maxY = Math.max(...corners.map(c => c.y));

  return { minX, maxX, minY, maxY };
};
