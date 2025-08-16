import React from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
import { 
  ISO_TILE_WIDTH, 
  ISO_TILE_HEIGHT 
} from "../utils/coordinates";
import { useCamera } from "../hooks/useCamera";
import { useMouseDrag } from "../hooks/useMouseDrag";
import { useGridCoordinates } from "../hooks/useGridCoordinates";
import { useFacilityPlacement } from "../hooks/useFacilityPlacement";
import { useFacilityPreview } from "../hooks/useFacilityPreview";
import { useFacilityDisplay } from "../hooks/useFacilityDisplay";
import { useHover } from "../hooks/useHover";
import { useGridConstants } from "../hooks/useGridConstants";
import { useMouseEvents } from "../hooks/useMouseEvents";
import { useTileInteraction } from "../hooks/useTileInteraction";

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
  // ホバーフックを使用
  const { hoveredTile, debouncedSetHover } = useHover({ debounceDelay: 50 });
  
  // 定数フックを使用
  const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y } = useGridConstants({ size });
  
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

  // 施設表示フックを使用
  const {
    getFacilityImageData,
    getRoadImageData,
    isFacilityCenter,
    calculateZIndex,
    getIsometricPosition
  } = useFacilityDisplay({
    facilityMap,
    MAP_OFFSET_X,
    MAP_OFFSET_Y
  });

  const visibleTiles = React.useMemo(() => {
    return getVisibleTiles(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  }, [getVisibleTiles, VIEWPORT_WIDTH, VIEWPORT_HEIGHT]);

  // マウスイベントフックを使用
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useMouseEvents({
    handleFacilityMouseDown,
    handleFacilityMouseMove,
    handleFacilityMouseUp,
    cancelPlacement,
    isPlacingFacility,
    startDrag,
    updateDrag,
    endDrag,
    isDragging,
    mouseToGrid,
    selectedFacilityType,
    debouncedSetHover
  });

  // タイルインタラクションフックを使用
  const {
    handleTileClick,
    isSelected
  } = useTileInteraction({
    facilities,
    onSelectParkCenter,
    onTileClick,
    selectedPosition: selectedPosition || null
  });

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
        const isoPos = getIsometricPosition(x, y);
        
        // 施設中心判定
        const isCenter = facility && isFacilityCenter(facility, x, y);
          
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
            {isCenter && facility.type !== 'road' && (() => {
              const { imgPath, imgSize, size } = getFacilityImageData(facility, x, y);
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
                    zIndex: calculateZIndex(x, y, 500),
                  }}
                />
              );
            })()}
            {/* 道路画像表示 */}
            {isCenter && facility.type === 'road' && (() => {
              const { imgPath, imgSize, transform } = getRoadImageData(facility, x, y);
              const { size } = getFacilityImageData(facility, x, y);
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
                    zIndex: calculateZIndex(x, y, 500),
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
                zIndex: calculateZIndex(x, y, 30),
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
