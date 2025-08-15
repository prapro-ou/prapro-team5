import React, { useRef, useEffect, useCallback } from "react";
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

// CanvasGridコンポーネントのプロパティ
interface CanvasGridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[];
  selectedFacilityType?: FacilityType | null;
  money?: number;
  onSelectParkCenter?: (pos: Position) => void;
}

// CanvasGridコンポーネント
export const CanvasGrid: React.FC<CanvasGridProps> = ({ 
  size, 
  onTileClick, 
  selectedPosition,
  facilities = [],
  selectedFacilityType = null,
  money = 0,
  onSelectParkCenter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 既存のフックをそのまま使用
  const { hoveredTile, debouncedSetHover } = useHover({ debounceDelay: 50 });
  
  const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y } = useGridConstants({ size });
  
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
    getCameraBounds,
    mapOffsetX: MAP_OFFSET_X,
    mapOffsetY: MAP_OFFSET_Y,
    gridSize: size
  });

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

  const {
    handleTileClick,
    isSelected
  } = useTileInteraction({
    facilities,
    onSelectParkCenter,
    onTileClick,
    selectedPosition: selectedPosition || null
  });

  // Canvas描画関数
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    // 背景をクリア
    ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    
    // カメラ位置を考慮した変換
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // 可視タイルのみ描画
    visibleTiles.forEach(({ x, y }) => {
      const facility = facilityMap.get(`${x}-${y}`);
      const facilityColor = getFacilityColor(facility);
      const previewColorValue = getPreviewColorValue(x, y);
      const isoPos = getIsometricPosition(x, y);
      
      // タイルの色を決定
      const tileColor = previewColorValue || facilityColor || '#90EE90'; // デフォルトは薄い緑
      
      // アイソメトリックタイルを描画
      ctx.beginPath();
      ctx.moveTo(isoPos.x + MAP_OFFSET_X, isoPos.y + MAP_OFFSET_Y);
      ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH / 2, isoPos.y + MAP_OFFSET_Y - ISO_TILE_HEIGHT / 2);
      ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH, isoPos.y + MAP_OFFSET_Y);
      ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH / 2, isoPos.y + MAP_OFFSET_Y + ISO_TILE_HEIGHT / 2);
      ctx.closePath();
      
      // タイルの色を設定
      ctx.fillStyle = tileColor;
      ctx.fill();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 選択状態の表示
      if (isSelected(x, y)) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
    
    ctx.restore();
  }, [camera, visibleTiles, facilityMap, getFacilityColor, getPreviewColorValue, getIsometricPosition, isSelected, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y]);

  // Canvas描画の実行
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Canvasサイズを設定
    canvas.width = VIEWPORT_WIDTH;
    canvas.height = VIEWPORT_HEIGHT;
    
    drawGrid(ctx);
  }, [drawGrid, VIEWPORT_WIDTH, VIEWPORT_HEIGHT]);

  return (
    <div className="relative overflow-hidden border-2 border-blue-500">
      {/* カメラ情報表示（デバッグ用） */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs z-[1000]">
        Camera: ({camera.x}, {camera.y})
      </div>
      
      {/* Canvas要素 */}
      <canvas
        ref={canvasRef}
        className="block cursor-grab"
        style={{
          width: `${VIEWPORT_WIDTH}px`,
          height: `${VIEWPORT_HEIGHT}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
