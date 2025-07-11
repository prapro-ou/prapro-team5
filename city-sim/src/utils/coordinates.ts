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
  const x = Math.round((isoX / (ISO_TILE_WIDTH / 2) + isoY / (ISO_TILE_HEIGHT / 2)) / 2);
  const y = Math.round((isoY / (ISO_TILE_HEIGHT / 2) - isoX / (ISO_TILE_WIDTH / 2)) / 2);
  return { x, y };
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
