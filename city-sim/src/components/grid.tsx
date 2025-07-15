import React from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
import { FACILITY_DATA } from "../types/facility";
import { 
  toIsometric, 
  getViewportBounds, 
  ISO_TILE_WIDTH, 
  ISO_TILE_HEIGHT 
} from "../utils/coordinates";

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
  // ビューポート
  const VIEWPORT_WIDTH = 800;  // 表示領域の幅
  const VIEWPORT_HEIGHT = 400; // 表示領域の高さ
  
  // アイソメトリックマップ全体のオフセット
  const MAP_OFFSET_X = (size.width + size.height) * (ISO_TILE_WIDTH / 2);
  const MAP_OFFSET_Y = 150;

  const [camera, setCamera] = React.useState(() => {
    // マップの中心グリッド座標を計算
    const centerGridX = size.width / 2;
    const centerGridY = size.height / 2;
    
    const centerIso = toIsometric(centerGridX, centerGridY);
    
    return {
      x: centerIso.x + MAP_OFFSET_X - VIEWPORT_WIDTH / 2,
      y: centerIso.y + MAP_OFFSET_Y - VIEWPORT_HEIGHT / 2
    };
  });

  const visibleTiles = React.useMemo(() => {
    const tiles = [];
    
    // ビューポート四隅のグリッド座標を取得
    const bounds = getViewportBounds(
      VIEWPORT_WIDTH,
      VIEWPORT_HEIGHT,
      camera.x,
      camera.y,
      MAP_OFFSET_X,
      MAP_OFFSET_Y
    );
    
    // マップ境界内でクランプ
    const startX = Math.max(0, bounds.minX - 1);
    const endX = Math.min(size.width, bounds.maxX + 2);
    const startY = Math.max(0, bounds.minY - 1);
    const endY = Math.min(size.height, bounds.maxY + 2);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        tiles.push({ x, y });
      }
    }
    
    return tiles;
  }, [camera, size, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y]);

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
        
        // 全マップ範囲でチェック
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.add(`${x}-${y}`);
        }
      }
    }
    return tiles;
  }, [selectedFacilityType, hoveredTile, size]);

  // ドラッグ状態の管理
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [dragStartCamera, setDragStartCamera] = React.useState({ x: 0, y: 0 });

  // カメラの移動処理
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const scrollSpeed = 64;
      
      const mapWidth = (size.width + size.height) * ISO_TILE_WIDTH;
      const mapHeight = (size.width + size.height) * ISO_TILE_HEIGHT;
      
      const maxCameraX = Math.max(0, mapWidth - VIEWPORT_WIDTH + MAP_OFFSET_X);
      const maxCameraY = Math.max(0, mapHeight - VIEWPORT_HEIGHT + MAP_OFFSET_Y);
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setCamera(prev => ({ 
            ...prev,
            y: Math.max(-MAP_OFFSET_Y, prev.y - scrollSpeed) 
          }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setCamera(prev => ({ 
            ...prev,
            y: Math.min(maxCameraY, prev.y + scrollSpeed) 
          }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setCamera(prev => ({ 
            ...prev,
            x: Math.max(-MAP_OFFSET_X, prev.x - scrollSpeed) 
          }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setCamera(prev => ({ 
            ...prev,
            x: Math.min(maxCameraX, prev.x + scrollSpeed) 
          }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [size, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y]);

  const handleTileClick = (x: number, y: number) => {
    if (onTileClick) {
      onTileClick({ x, y });
    }
  };

  const isSelected = (x: number, y: number) => {
    return selectedPosition?.x === x && selectedPosition?.y === y;
  };

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
        timeoutId = setTimeout(() => setHoveredTile(position), 50);
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
      className="relative overflow-hidden border-2 border-blue-500"
      style={{
        width: `${VIEWPORT_WIDTH}px`,
        height: `${VIEWPORT_HEIGHT}px`,
      }}
    >
    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs z-[1000]">
      Camera: ({camera.x}, {camera.y})
    </div>
    {/* カメラコンテナ */}
    <div
      className="absolute"
      style={{
        width: `${(size.width + size.height) * ISO_TILE_WIDTH + MAP_OFFSET_X * 2}px`,
        height: `${(size.width + size.height) * ISO_TILE_HEIGHT + MAP_OFFSET_Y * 2}px`,
        transform: `translate(-${camera.x}px, -${camera.y}px)`,
      }}
    >
      {visibleTiles.map(({ x, y }) => {
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
                ${previewColor || facilityColor}
                ${isSelected(x, y) ? 'ring-2 ring-yellow-400' : ''}
              `}
              style={{
                left: `${isoPos.x + MAP_OFFSET_X}px`,
                top: `${isoPos.y + MAP_OFFSET_Y}px`,
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
        })}
      </div>
    </div>
  );
};
