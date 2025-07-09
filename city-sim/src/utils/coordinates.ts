// アイソメトリック座標変換
export const toIsometric = (x: number, y: number) => {
  const isoX = (x - y) * 16;
  const isoY = (x + y) * 8;
  return { x: isoX, y: isoY };
};

// アイソメトリック座標から通常座標への変換
export const fromIsometric = (isoX: number, isoY: number) => {
  const x = Math.round((isoX / 16 + isoY / 8) / 2);
  const y = Math.round((isoY / 8 - isoX / 16) / 2);
  return { x, y };
};
