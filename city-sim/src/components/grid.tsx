import React from "react";
import type { Position, GridSize } from "../types/grid";

// Gridコンポーネントのプロパティ
interface GridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
}

// Gridコンポーネント
export const Grid: React.FC<GridProps> = ({ 
  size, 
  onTileClick, 
  selectedPosition 
}) => {
  const handleTileClick = (x: number, y: number) => {
    if (onTileClick) {
      onTileClick({ x, y });
    }
  };

  const isSelected = (x: number, y: number) => {
    return selectedPosition?.x === x && selectedPosition?.y === y;
  };

  return (
    <div 
      className="grid bg-gray-800 p-4 rounded-lg justify-center items-center"
      style={{
        display: 'grid',
        gap: '0.5px',
        gridTemplateColumns: `repeat(${size.width}, 16px)`,
        gridTemplateRows: `repeat(${size.height}, 16px)`,
      }}
    >
      {Array.from({ length: size.height }, (_, y) =>
        Array.from({ length: size.width }, (_, x) => (
          <div
            key={`${x}-${y}`}
            className={`
              w-4 h-4 border border-gray-600 cursor-pointer
              hover:bg-gray-600 transition-colors
              ${isSelected(x, y) ? 'bg-blue-500' : 'bg-gray-700'}
            `}
            onClick={() => handleTileClick(x, y)}
            // title={`位置: (${x}, ${y})`} // ツールチップ
          />
        ))
      )}
    </div>
  );
};
