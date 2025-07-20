import React from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
import { FACILITY_DATA } from "../types/facility";
import { 
  toIsometric, 
  getViewportBounds, 
  screenToGrid,
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

  // 施設敷設用の状態管理
  const [isPlacingFacility, setIsPlacingFacility] = React.useState(false);
  const [dragStartTile, setDragStartTile] = React.useState<Position | null>(null);
  const [dragEndTile, setDragEndTile] = React.useState<Position | null>(null);

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

  // ドラッグ範囲の計算
  const dragRange = React.useMemo(() => {
    if (!isPlacingFacility || !dragStartTile || !dragEndTile) return new Set<string>();
    
    const tiles = new Set<string>();
    
    // 直線一列のみの敷設
    const dx = Math.abs(dragEndTile.x - dragStartTile.x);
    const dy = Math.abs(dragEndTile.y - dragStartTile.y);
    
    // X軸方向の直線
    if (dx > dy) {
      const startX = Math.min(dragStartTile.x, dragEndTile.x);
      const endX = Math.max(dragStartTile.x, dragEndTile.x);
      const y = dragStartTile.y;
      
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.add(`${x}-${y}`);
        }
      }
    }
    // Y軸方向の直線
    else {
      const startY = Math.min(dragStartTile.y, dragEndTile.y);
      const endY = Math.max(dragStartTile.y, dragEndTile.y);
      const x = dragStartTile.x;
      
      for (let y = startY; y <= endY; y++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.add(`${x}-${y}`);
        }
      }
    }
    
    return tiles;
  }, [isPlacingFacility, dragStartTile, dragEndTile, size]);

  // マウスドラッグ処理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 左クリックで施設敷設
    if (e.button === 0 && selectedFacilityType) {
      e.preventDefault();
      const gridPos = mouseToGrid(e.clientX, e.clientY, e.currentTarget as HTMLElement);
      if (gridPos) {
        // インフラカテゴリの施設のみドラッグ敷設を許可
        const facilityData = FACILITY_DATA[selectedFacilityType];
        if (facilityData.category === 'infrastructure') {
          setIsPlacingFacility(true);
          setDragStartTile(gridPos);
          setDragEndTile(gridPos);
        } 
        else {
          handleTileClick(gridPos.x, gridPos.y);
        }
      }
    }
    // 右クリックでカメラドラッグ&敷設キャンセル
    else if (e.button === 2) {
      if (isPlacingFacility) {
        setIsPlacingFacility(false);
        setDragStartTile(null);
        setDragEndTile(null);
      }
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragStartCamera({ x: camera.x, y: camera.y });
    }
  };

  // マウス座標からグリッド座標への変換
  const mouseToGrid = (mouseX: number, mouseY: number, element: HTMLElement): Position | null => {
    const rect = element.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;
    
    const gridPos = screenToGrid(
      relativeX, 
      relativeY, 
      camera.x, 
      camera.y,
      MAP_OFFSET_X,
      MAP_OFFSET_Y
    );
    
    if (gridPos.x >= 0 && gridPos.x < size.width && 
        gridPos.y >= 0 && gridPos.y < size.height) {
      return gridPos;
    }
    
    return null;
  };

  // マウスムーブ処理
  const handleMouseMove = (e: React.MouseEvent) => {
    const gridPos = mouseToGrid(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    // 施設敷設ドラッグ中
  
    if (isPlacingFacility && dragStartTile && gridPos) {
      setDragEndTile(gridPos);
      return;
    }
    
    if (selectedFacilityType && gridPos) {
      debouncedSetHover(gridPos);
    }

    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const mapWidth = (size.width + size.height) * ISO_TILE_WIDTH;
    const mapHeight = (size.width + size.height) * ISO_TILE_HEIGHT;
    
    const maxCameraX = Math.max(0, mapWidth - VIEWPORT_WIDTH + MAP_OFFSET_X);
    const maxCameraY = Math.max(0, mapHeight - VIEWPORT_HEIGHT + MAP_OFFSET_Y);

    const newCameraX = Math.max(-MAP_OFFSET_X, Math.min(maxCameraX, dragStartCamera.x - deltaX));
    const newCameraY = Math.max(-MAP_OFFSET_Y, Math.min(maxCameraY, dragStartCamera.y - deltaY));

    setCamera({ x: newCameraX, y: newCameraY });
  };

  // マウスアップ処理
  const handleMouseUp = (e: React.MouseEvent) => {
    // 施設敷設の確定
    if (isPlacingFacility && dragStartTile && dragEndTile) {
      const dx = Math.abs(dragEndTile.x - dragStartTile.x);
      const dy = Math.abs(dragEndTile.y - dragStartTile.y);
      
      // X軸方向
      if (dx > dy) {
        const startX = Math.min(dragStartTile.x, dragEndTile.x);
        const endX = Math.max(dragStartTile.x, dragEndTile.x);
        const y = dragStartTile.y;
        
        for (let x = startX; x <= endX; x++) {
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            handleTileClick(x, y);
          }
        }
      }
      // Y軸方向
      else {
        const startY = Math.min(dragStartTile.y, dragEndTile.y);
        const endY = Math.max(dragStartTile.y, dragEndTile.y);
        const x = dragStartTile.x;
        
        for (let y = startY; y <= endY; y++) {
          if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
            handleTileClick(x, y);
          }
        }
      }
      
      setIsPlacingFacility(false);
      setDragStartTile(null);
      setDragEndTile(null);
      return;
    }
    
    // カメラドラッグの終了（既存の処理）
    setIsDragging(false);
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
    const tileKey = `${x}-${y}`;
  
    // ドラッグ範囲内のプレビュー
    if (isPlacingFacility && dragRange.has(tileKey)) {
      if (!selectedFacilityType) return null;
      
      const facilityData = FACILITY_DATA[selectedFacilityType];

      if (facilityData.category !== 'infrastructure') return null;

      if (money < facilityData.cost) {
        return 'insufficient-funds';
      }
      if (facilityMap.has(tileKey)) {
        return 'occupied';
      }
      return 'valid';
    }

    // ドラッグ中はホバーによるプレビューを無効にする
    if (isPlacingFacility) return null;

    if (!selectedFacilityType || !hoveredTile) return null;
    
    // ホバー中心から離れすぎてたら計算しない
    const distance = Math.abs(x - hoveredTile.x) + Math.abs(y - hoveredTile.y);
    const facilityData = FACILITY_DATA[selectedFacilityType];
    const maxDistance = Math.floor(facilityData.size / 2) + 1;
    
    if (distance > maxDistance) return null;

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
  }, [selectedFacilityType, hoveredTile, previewTiles, facilityMap, money, isPlacingFacility, dragRange]);

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const debouncedSetHover = React.useCallback((position: Position | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setHoveredTile(position), 50);
  }, []);

  // クリーンアップ
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ドラッグ用のグローバルマウスイベント
  React.useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const mapWidth = (size.width + size.height) * ISO_TILE_WIDTH;
      const mapHeight = (size.width + size.height) * ISO_TILE_HEIGHT;
      
      const maxCameraX = Math.max(0, mapWidth - VIEWPORT_WIDTH + MAP_OFFSET_X);
      const maxCameraY = Math.max(0, mapHeight - VIEWPORT_HEIGHT + MAP_OFFSET_Y);

      const newCameraX = Math.max(-MAP_OFFSET_X, Math.min(maxCameraX, dragStartCamera.x - deltaX));
      const newCameraY = Math.max(-MAP_OFFSET_Y, Math.min(maxCameraY, dragStartCamera.y - deltaY));

      setCamera({ x: newCameraX, y: newCameraY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragStartCamera, size, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y]);

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
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()} // 右クリックメニューを無効化
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
