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
  const x = Math.round((isoX / (ISO_TILE_WIDTH / 2) + isoY / (ISO_TILE_HEIGHT / 2)) / 2) - 1;
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

// ビューポート四隅のグリッド座標を取得
export const getViewportBounds = (
  viewportWidth: number,
  viewportHeight: number,
  cameraX: number,
  cameraY: number,
  offsetX: number = 0,
  offsetY: number = 0
) => {
  // ビューポートの四隅の座標
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
