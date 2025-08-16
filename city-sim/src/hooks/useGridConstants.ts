import React from 'react';
import type { GridSize } from '../types/grid';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../utils/coordinates';

interface UseGridConstantsProps {
  size: GridSize;
}

export const useGridConstants = ({ size }: UseGridConstantsProps) => {
  // ビューポート定数
  const VIEWPORT_WIDTH = 800;  // 表示領域の幅
  const VIEWPORT_HEIGHT = 400; // 表示領域の高さ
  
  // アイソメトリックマップ全体のオフセット
  const MAP_OFFSET_X = React.useMemo(() => {
    return (size.width + size.height) * (ISO_TILE_WIDTH / 2);
  }, [size.width, size.height]);
  
  const MAP_OFFSET_Y = 150;

  return {
    VIEWPORT_WIDTH,
    VIEWPORT_HEIGHT,
    MAP_OFFSET_X,
    MAP_OFFSET_Y
  };
}; 