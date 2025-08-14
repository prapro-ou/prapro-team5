import React from 'react';
import type { Position } from '../types/grid';

interface UseHoverProps {
  debounceDelay?: number;
}

export const useHover = ({ debounceDelay = 50 }: UseHoverProps = {}) => {
  const [hoveredTile, setHoveredTile] = React.useState<Position | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // デバウンス付きホバー設定
  const debouncedSetHover = React.useCallback((position: Position | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setHoveredTile(position), debounceDelay);
  }, [debounceDelay]);

  // 即座にホバー設定（デバウンスなし）
  const setHoverImmediate = React.useCallback((position: Position | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredTile(position);
  }, []);

  // クリーンアップ
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    hoveredTile,
    setHoveredTile,
    debouncedSetHover,
    setHoverImmediate
  };
};
