import React from 'react';
import type { GridSize } from '../types/grid';
import { ISO_TILE_WIDTH } from '../utils/coordinates';

interface UseGridConstantsProps {
  size: GridSize;
}

export const useGridConstants = ({ size }: UseGridConstantsProps) => {
  // 画面サイズを取得
  const [screenSize, setScreenSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // 画面サイズの変更を監視
  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 動的ビューポートサイズ計算
  const VIEWPORT_WIDTH = React.useMemo(() => {
    const availableWidth = screenSize.width;
    return availableWidth;
  }, [screenSize.width]);

  const VIEWPORT_HEIGHT = React.useMemo(() => {
    const headerHeight = 50;
    const availableHeight = screenSize.height - headerHeight;
    return availableHeight;
  }, [screenSize.height]);
  
  // アイソメトリックマップ全体のオフセット
  const MAP_OFFSET_X = React.useMemo(() => {
    return (size.width + size.height) * (ISO_TILE_WIDTH / 2);
  }, [size.width, size.height]);
  
  const MAP_OFFSET_Y = 150;

  return {
    VIEWPORT_WIDTH,
    VIEWPORT_HEIGHT,
    MAP_OFFSET_X,
    MAP_OFFSET_Y,
    screenSize
  };
};
