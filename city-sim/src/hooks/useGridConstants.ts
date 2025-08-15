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
    // 画面幅から余白を引く（左右各20px、パネル類のスペース）
    const availableWidth = screenSize.width - 40;
    return Math.max(800, availableWidth); // 最小800px
  }, [screenSize.width]);

  const VIEWPORT_HEIGHT = React.useMemo(() => {
    // 画面高さからヘッダー、パネル、ボタン類のスペースを引く
    const headerHeight = 80; // ヘッダー部分
    const bottomPanelHeight = 120; // 下部パネル
    const buttonHeight = 80; // 各種ボタン
    const availableHeight = screenSize.height - headerHeight - bottomPanelHeight - buttonHeight;
    return Math.max(400, availableHeight); // 最小400px
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