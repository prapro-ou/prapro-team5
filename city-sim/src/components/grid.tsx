import React from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
import { FACILITY_DATA } from "../types/facility";
import { 
  toIsometric, 
  ISO_TILE_WIDTH, 
  ISO_TILE_HEIGHT 
} from "../utils/coordinates";
import { useCamera } from "../hooks/useCamera";
import { useMouseDrag } from "../hooks/useMouseDrag";
import { useGridCoordinates } from "../hooks/useGridCoordinates";
import { useFacilityPlacement } from "../hooks/useFacilityPlacement";
import { useFacilityPreview } from "../hooks/useFacilityPreview";
import { getRoadConnectionType } from "../utils/roadConnection";

// Gridコンポーネントのプロパティ
interface GridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[]; // 施設配置
  selectedFacilityType?: FacilityType | null; // 選択中の施設タイプ
  money?: number;
  onSelectParkCenter?: (pos: Position) => void; // 公園中心選択用
}

// Gridコンポーネント
export const Grid: React.FC<GridProps> = ({ 
  size, 
  onTileClick, 
  selectedPosition,
  facilities = [],
  selectedFacilityType = null,
  money = 0,
  onSelectParkCenter,
}) => {
  const [hoveredTile, setHoveredTile] = React.useState<Position | null>(null);
  
  // ビューポート
  const VIEWPORT_WIDTH = 800;  // 表示領域の幅
  const VIEWPORT_HEIGHT = 400; // 表示領域の高さ
  
  // アイソメトリックマップ全体のオフセット
  const MAP_OFFSET_X = (size.width + size.height) * (ISO_TILE_WIDTH / 2);
  const MAP_OFFSET_Y = 150;

  // カスタムフックを使用
  const { camera, setCamera, getCameraBounds } = useCamera({
    size,
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
    mapOffsetX: MAP_OFFSET_X,
    mapOffsetY: MAP_OFFSET_Y
  });

  const { isDragging, startDrag, updateDrag, endDrag } = useMouseDrag({
    camera,
    setCamera,
    getCameraBounds
  });

  const { mouseToGrid, getVisibleTiles } = useGridCoordinates({
    camera,
    getCameraBounds, // カメラフックから境界値を取得
    mapOffsetX: MAP_OFFSET_X,
    mapOffsetY: MAP_OFFSET_Y,
    gridSize: size
  });

  // 施設配置フックを使用
  const {
    isPlacingFacility,
    dragRange,
    handleMouseDown: handleFacilityMouseDown,
    handleMouseMove: handleFacilityMouseMove,
    handleMouseUp: handleFacilityMouseUp,
    cancelPlacement
  } = useFacilityPlacement({
    size,
    selectedFacilityType,
    mouseToGrid,
    onTileClick: (x, y) => handleTileClick(x, y)
  });

  // 施設プレビューフックを使用
  const {
    facilityMap,
    parkEffectTiles,
    getFacilityColor,
    getPreviewColorValue
  } = useFacilityPreview({
    size,
    selectedFacilityType,
    hoveredTile,
    isPlacingFacility,
    dragRange,
    money,
    facilities,
    selectedPosition: selectedPosition || null
  });

  const visibleTiles = React.useMemo(() => {
    return getVisibleTiles(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  }, [getVisibleTiles, VIEWPORT_WIDTH, VIEWPORT_HEIGHT]);

  // マウスドラッグ処理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 施設配置の処理
    handleFacilityMouseDown(e, e.currentTarget as HTMLElement);
    
    // 右クリックでカメラドラッグ&敷設キャンセル
    if (e.button === 2) {
      if (isPlacingFacility) {
        cancelPlacement();
      }
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    }
  };

  // マウスムーブ処理
  const handleMouseMove = (e: React.MouseEvent) => {
    // 施設配置の処理
    handleFacilityMouseMove(e, e.currentTarget as HTMLElement);
    
    // ホバー処理
    const gridPos = mouseToGrid(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    if (selectedFacilityType && gridPos) {
      debouncedSetHover(gridPos);
    }

    // カメラドラッグ中
    if (isDragging) {
      updateDrag(e.clientX, e.clientY);
    }
  };

  // マウスアップ処理
  const handleMouseUp = () => {
    // 施設配置の確定
    handleFacilityMouseUp();
    
    // カメラドラッグの終了
    endDrag();
  };

  const isSelected = (x: number, y: number) => {
    return selectedPosition?.x === x && selectedPosition?.y === y;
  };

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
      updateDrag(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      endDrag();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updateDrag, endDrag]);

  // タイルクリック時の内部処理
  const handleTileClick = (x: number, y: number) => {
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
        const previewColorValue = getPreviewColorValue(x, y);
        const isoPos = toIsometric(x, y);

        // z-indexの計算
        const baseZ = (x + y) * 100 + x;
        
        let imgPath = "";
        let imgSize = { width: 96, height: 79 };
        let size = 3;

        if (facility) {
          const facilityData = FACILITY_DATA[facility.type];
          const idx = facility.variantIndex ?? 0;
          size = facilityData.size;
          imgPath = facilityData.imgPaths?.[idx] ?? "";
          imgSize = facilityData.imgSizes?.[idx] ?? { width: 96, height: 79 };
        }
        // 施設中心判定
        const isCenter = facility && facility.position.x === x && facility.position.y === y;
          
        // 公園効果範囲の色付け（プレビュー時のみ）
        const isInParkEffect = parkEffectTiles.has(`${x}-${y}`);
        const parkEffectClass = isInParkEffect ? 'bg-lime-200 opacity-40' : '';

        return (
          <div 
            key={`${x}-${y}`} 
            className="absolute"
            style={{
              width: '100%',
              height: '100%'
            }}
          >
            {/* 施設画像表示 */}
            {isCenter && facility.type !== 'road' && (
              <img
                src={imgPath}
                alt={facility.type}
                style={{
                  position: 'absolute',
                  left: `${isoPos.x + MAP_OFFSET_X - imgSize.width / 2 + 16}px`,
                  top: `${isoPos.y + MAP_OFFSET_Y - imgSize.height + 16 * (size + 1) / 2}px`,
                  width: `${imgSize.width}px`,
                  height: `${imgSize.height}px`,
                  zIndex: Math.floor(baseZ + 500),
                }}
              />
            )}
            {isCenter && facility.type === 'road' && (() => {
              const connection = getRoadConnectionType(facilityMap, x, y);
              const facilityData = FACILITY_DATA[facility.type];
              
              let imgPath = facilityData.imgPaths?.[connection.variantIndex] ?? "";
              let imgSize = facilityData.imgSizes?.[connection.variantIndex] ?? { width: 32, height: 16 };
              let transform = undefined;
              
              switch (connection.type) {
                case 'cross':
                  break;
                case 't-junction':
                  transform = `rotate(${connection.rotation}deg)`;
                  if (connection.flip) {
                    transform += ' scaleX(-1)';
                  }
                  break;
                case 'turn':
                  transform = `rotate(${connection.rotation}deg)`;
                  if (connection.flip) {
                    transform += ' scaleX(-1)';
                  }
                  break;
                case 'horizontal':
                case 'vertical':
                case 'end':
                case 'isolated':
                  if (connection.rotation !== 0) {
                    transform = `rotate(${connection.rotation}deg)`;
                  }
                  if (connection.flip) {
                    transform += ' scaleX(-1)';
                  }
                  break;
              }

              return (
                <img
                  src={imgPath}
                  alt={facility.type}
                  style={{
                    position: 'absolute',
                    left: `${isoPos.x + MAP_OFFSET_X - imgSize.width / 2 + 16}px`,
                    top: `${isoPos.y + MAP_OFFSET_Y - imgSize.height + 16 * (size + 1) / 2}px`,
                    width: `${imgSize.width}px`,
                    height: `${imgSize.height}px`,
                    zIndex: Math.floor(baseZ + 500),
                    transform,
                  }}
                />
              );
            })()}
            {/* トップ面 */}
            <div
              className={`
                absolute cursor-pointer border border-gray-500
                ${parkEffectClass} ${previewColorValue || facilityColor}
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
