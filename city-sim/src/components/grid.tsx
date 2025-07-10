import React from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
import { FACILITY_DATA } from "../types/facility";
import { toIsometric } from "../utils/coordinates";

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

  // プレビュー範囲の事前計算
  const previewTiles = React.useMemo(() => {
    if (!selectedFacilityType || !hoveredTile) return new Set<string>();
    
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const radius = Math.floor(facilityData.size / 2);
    const tiles = new Set<string>();
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = hoveredTile.x + dx;
        const y = hoveredTile.y + dy;
        
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.add(`${x}-${y}`);
        }
      }
    }
    return tiles;
  }, [selectedFacilityType, hoveredTile, size]);

  const handleTileClick = (x: number, y: number) => {
    if (onTileClick) {
      onTileClick({ x, y });
    }
  };

  const isSelected = (x: number, y: number) => {
    return selectedPosition?.x === x && selectedPosition?.y === y;
  };

  // const getFacilityAt = (x: number, y: number) => {
  //   return facilities.find(facility =>
  //     facility.occupiedTiles.some(tile => tile.x === x && tile.y === y)
  //   );
  // };

  // 施設マップをメモ化
  const facilityMap = React.useMemo(() => {
    const map = new Map<string, Facility>();
    facilities.forEach(facility => {
      facility.occupiedTiles.forEach(tile => {
        map.set(`${tile.x}-${tile.y}`, facility);
      });
    });
    return map;
  }, [facilities]);

  const getPreviewStatus = React.useCallback((x: number, y: number) => {
    if (!selectedFacilityType || !hoveredTile) return null;
    
    // ホバー中心から離れすぎてたら計算しない
    const distance = Math.abs(x - hoveredTile.x) + Math.abs(y - hoveredTile.y);
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const maxDistance = Math.floor(facilityData.size / 2) + 1;
    
    if (distance > maxDistance) return null;

    const tileKey = `${x}-${y}`;
    if (!previewTiles.has(tileKey)) return null;

      // 資金不足チェック
      if (money < facilityData.cost) {
        return 'insufficient-funds';
      }
      
      // 既存施設チェック
      if (facilityMap.has(tileKey)) {
        return 'occupied';
      }

      return 'valid';
    }, [selectedFacilityType, hoveredTile, previewTiles, facilityMap, money]);

    const debouncedSetHover = React.useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (position: Position | null) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setHoveredTile(position), 16); // 8ms = 60fps
      };
    }, []);

  const getFacilityColor = (facility?: Facility) => {
    if (!facility) return 'bg-gray-700'; // デフォルトの色
    switch (facility.type) {
      case 'residential': return 'bg-green-500';
      case 'commercial': return 'bg-blue-500';
      case 'industrial': return 'bg-yellow-500';
      case 'road': return 'bg-gray-900';
      default: return 'bg-gray-700';
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
        className="relative"
        style={{
          width: `${(size.width + size.height) * 16 + 200}px`,
          height: `${(size.width + size.height) * 8 + 300}px`,
        }}
      >
      {Array.from({ length: size.height }, (_, y) =>
        Array.from({ length: size.width }, (_, x) => {
          const facility = facilityMap.get(`${x}-${y}`);
          const facilityColor = getFacilityColor(facility);
          const previewStatus = getPreviewStatus(x, y);
          const previewColor = getPreviewColor(previewStatus);
          const isoPos = toIsometric(x, y);

          // z-indexの計算
          const baseZ = (y * 100) + x;
          
          return (
            <div key={`${x}-${y}`} className="absolute">
              {/* トップ面 */}
              <div
                className={`
                  absolute cursor-pointer border border-gray-500
                  transition-all duration-200
                  ${previewColor || facilityColor}
                  ${!facility && !previewStatus ? 'hover:brightness-110' : ''}
                  ${isSelected(x, y) ? 'ring-2 ring-yellow-400' : ''}
                `}
                style={{
                  left: `${isoPos.x + (size.width + size.height) * 8}px`,
                  top: `${isoPos.y + 150}px`,
                  width: '32px',
                  height: '16px',
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  zIndex: Math.floor(baseZ + 30),
                }}
                onClick={() => handleTileClick(x, y)}
                onMouseEnter={() => selectedFacilityType && debouncedSetHover({ x, y })}
                onMouseLeave={() => debouncedSetHover(null)}
                title={facility ? `${facility.type} (${x}, ${y})` : `空地 (${x}, ${y})`}
              />

            </div>
          );
        })
      )}
      </div>
  );
};
