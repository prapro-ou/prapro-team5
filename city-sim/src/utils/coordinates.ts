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

