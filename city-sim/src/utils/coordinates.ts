// アイソメトリック座標変換
export const toIsometric = (x: number, y: number) => {
  const isoX = (x - y) * 32;
  const isoY = (x + y) * 16;
  return { x: isoX, y: isoY };
};

// アイソメトリック座標から通常座標への変換
export const fromIsometric = (isoX: number, isoY: number) => {
  const x = Math.round((isoX / 32 + isoY / 16) / 2);
  const y = Math.round((isoY / 16 - isoX / 32) / 2);
  return { x, y };
};
