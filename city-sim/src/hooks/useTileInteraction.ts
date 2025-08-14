import React from 'react';
import type { Position } from '../types/grid';
import type { Facility } from '../types/facility';

interface UseTileInteractionProps {
  facilities: Facility[];
  onSelectParkCenter?: (pos: Position) => void;
  onTileClick?: (position: Position) => void;
  selectedPosition: Position | null;
}

export const useTileInteraction = ({
  facilities,
  onSelectParkCenter,
  onTileClick,
  selectedPosition
}: UseTileInteractionProps) => {

  // タイルクリック時の内部処理
  const handleTileClick = React.useCallback((x: number, y: number) => {
    // 設置済み公園をクリックしたら、その公園の中心を選択状態にする
    const clickedFacility = facilities.find(f =>
      f.type === 'park' && f.occupiedTiles.some(t => t.x === x && t.y === y)
    );
    if (clickedFacility && onSelectParkCenter) {
      onSelectParkCenter(clickedFacility.position);
      return;
    }
    if (onTileClick) {
      onTileClick({ x, y });
    }
  }, [facilities, onSelectParkCenter, onTileClick]);

  // タイルが選択されているかどうかの判定
  const isSelected = React.useCallback((x: number, y: number): boolean => {
    return selectedPosition?.x === x && selectedPosition?.y === y;
  }, [selectedPosition]);

  return {
    handleTileClick,
    isSelected
  };
};
