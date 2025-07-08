import React from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
import { FACILITY_DATA } from "../types/facility";

// Gridコンポーネントのプロパティ
interface GridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[]; // 施設配置
  selectedFacilityType?: FacilityType | null; // 選択中の施設タイプ
  money?: number; 
}

// Gridコンポーネント
export const Grid: React.FC<GridProps> = ({ 
  size, 
  onTileClick, 
  selectedPosition,
  facilities = [],
  selectedFacilityType = null,
  money = 0,
}) => {
  const [hoveredTile, setHoveredTile] = React.useState<Position | null>(null);
  const handleTileClick = (x: number, y: number) => {
    if (onTileClick) {
      onTileClick({ x, y });
    }
  };

  // タイル座標をアイソメトリック座標に変換
  const toIsometric = (x: number, y: number) => {
    const isoX = (x - y) * 32;
    const isoY = (x + y) * 16;
    return { x: isoX, y: isoY };
  }

  const isSelected = (x: number, y: number) => {
    return selectedPosition?.x === x && selectedPosition?.y === y;
  };

  const getFacilityAt = (x: number, y: number) => {
    return facilities.find(facility =>
      facility.occupiedTiles.some(tile => tile.x === x && tile.y === y)
    );
  };

  const getPreviewStatus = (x: number, y: number) => {
    if (!selectedFacilityType || !hoveredTile) return null;
    
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const radius = Math.floor(facilityData.size / 2);
    
    // ホバー位置から相対位置を計算
    const dx = x - hoveredTile.x;
    const dy = y - hoveredTile.y;
    
    // 施設の範囲内かチェック
    if (Math.abs(dx) <= radius && Math.abs(dy) <= radius) {
      // 範囲外チェック
      let hasOutOfBounds = false;
      for (let checkDx = -radius; checkDx <= radius; checkDx++) {
        for (let checkDy = -radius; checkDy <= radius; checkDy++) {
          const checkX = hoveredTile.x + checkDx;
          const checkY = hoveredTile.y + checkDy;
          if (checkX < 0 || checkX >= size.width || checkY < 0 || checkY >= size.height) {
            hasOutOfBounds = true;
            break;
          }
        }
        if (hasOutOfBounds) break;
      }
      
      if (hasOutOfBounds) {
        return 'out-of-bounds';
      }

      // 資金不足チェック
      if (money < facilityData.cost) {
        return 'insufficient-funds';
      }
      
      // 既存施設チェック
      if (getFacilityAt(x, y)) {
        return 'occupied';
      }

      return 'valid';
    }
    
    return null;
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

  const getPreviewColor = (status: string | null) => {
    switch (status) {
      case 'valid': return 'bg-green-300 opacity-70';
      case 'occupied': return 'bg-red-300 opacity-70';
      case 'insufficient-funds': return 'bg-red-300 opacity-70';
      case 'out-of-bounds': return 'bg-red-500 opacity-70';
      default: return '';
    }
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
        Array.from({ length: size.width }, (_, x) => {
          const facility = getFacilityAt(x, y);
          const facilityColor = getFacilityColor(facility);
          const previewStatus = getPreviewStatus(x, y);
          const previewColor = getPreviewColor(previewStatus);
          
          return (
            <div
              key={`${x}-${y}`}
              className={`
                w-4 h-4 border border-gray-600 cursor-pointer
                transition-colors relative
                ${previewColor || facilityColor}
                ${!facility && !previewStatus ? 'hover:bg-gray-600' : ''}
                ${isSelected(x, y) ? 'ring-2 ring-white z-10' : ''}
              `}
              onClick={() => handleTileClick(x, y)}
              onMouseEnter={() => selectedFacilityType && setHoveredTile({ x, y })}
              onMouseLeave={() => setHoveredTile(null)}
              title={facility ? `${facility.type} (${x}, ${y})` : `空地 (${x}, ${y})`}
            />            
          );
        })
      )}
    </div>
  );
};
