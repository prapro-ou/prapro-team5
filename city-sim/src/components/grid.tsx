import React from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility } from "../types/facility";
import { FACILITY_DATA } from "../types/facility";

// Gridコンポーネントのプロパティ
interface GridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[]; // 施設配置
  slectedFacilityType?: string | null; // 選択中の施設タイプ
  money?: number; 
}

// Gridコンポーネント
export const Grid: React.FC<GridProps> = ({ 
  size, 
  onTileClick, 
  selectedPosition,
  facilities = [],
  slectedFacilityType = null,
  money = 0,
}) => {
  const [hoveredTile, setHoveredTile] = React.useState<Position | null>(null);
  const handleTileClick = (x: number, y: number) => {
    if (onTileClick) {
      onTileClick({ x, y });
    }
  };

  const isSelected = (x: number, y: number) => {
    return selectedPosition?.x === x && selectedPosition?.y === y;
  };

  const getFacilityAt = (x: number, y: number) => {
    return facilities.find(facility =>
      facility.occupiedTiles.some(tile => tile.x === x && tile.y === y)
    );
  };

  const getFacilityColor = (facility?: Facility) => {
    if (!facility) return 'bg-gray-700'; // デフォルトの色
    switch (facility.type) {
      case 'residential':
        return 'bg-green-500';
      case 'commercial':
        return 'bg-blue-500';
      case 'industrial':
        return 'bg-yellow-500';
      case 'road':
        return 'bg-gray-900';
      default:
        return 'bg-gray-700';
    }
  }

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
        Array.from({ length: size.width }, (_, x) => {
          const facility = getFacilityAt(x, y);
          const facilityColor = getFacilityColor(facility);
          
          return (
            <div
              key={`${x}-${y}`}
              className={`
                w-4 h-4 border border-gray-600 cursor-pointer
                transition-colors relative
                ${facilityColor}
                ${!facility ? 'hover:bg-gray-600' : 'hover:brightness-110'}
                ${isSelected(x, y) ? 'ring-2 ring-white z-10' : ''}
              `}
              onClick={() => handleTileClick(x, y)}
              title={facility ? `${facility.type} (${x}, ${y})` : `空地 (${x}, ${y})`}
            />            
          );
        })
      )}
    </div>
  );
};
