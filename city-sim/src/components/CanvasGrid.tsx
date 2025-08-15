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

  // CSSクラス名をCanvas描画用の色値に変換
  const convertCssClassToColor = useCallback((cssClass: string): string => {
    if (!cssClass) return '';
    
    // CSSクラス名から色を抽出
    if (cssClass.includes('bg-green-300')) return '#86EFAC';
    if (cssClass.includes('bg-blue-300')) return '#93C5FD';
    if (cssClass.includes('bg-yellow-200')) return '#FEF3C7';
    if (cssClass.includes('bg-gray-400')) return '#9CA3AF';
    if (cssClass.includes('bg-purple-300')) return '#C4B5FD';
    if (cssClass.includes('bg-lime-200')) return '#D3FCAE';
    if (cssClass.includes('bg-red-300')) return '#FCA5A5';
    if (cssClass.includes('bg-red-500')) return '#EF4444';
    
    // デフォルト色
    return '#90EE90';
  }, []);

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
      
      // タイルの色を決定（プレビュー優先）
      let tileColor = '#90EE90'; // デフォルトは薄い緑
      
      // 既存施設の色を設定
      if (facilityColor) {
        tileColor = convertCssClassToColor(facilityColor);
      }
      
      // プレビュー色がある場合は上書き
      if (previewColorValue) {
        tileColor = convertCssClassToColor(previewColorValue);
      }
      
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
      
      // 境界線の色を設定
      let borderColor = '#666';
      let borderWidth = 1;
      
      // 選択状態の表示
      if (isSelected(x, y)) {
        borderColor = '#FFD700';
        borderWidth = 3;
      }
      
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    });
    
    // 公園効果範囲の描画
    if (parkEffectTiles.size > 0) {
      ctx.globalAlpha = 0.4; // 透明度設定
      ctx.fillStyle = '#90EE90'; // 薄い緑
      
      parkEffectTiles.forEach(tileKey => {
        const [x, y] = tileKey.split('-').map(Number);
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          const isoPos = getIsometricPosition(x, y);
          
          ctx.beginPath();
          ctx.moveTo(isoPos.x + MAP_OFFSET_X, isoPos.y + MAP_OFFSET_Y);
          ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH / 2, isoPos.y + MAP_OFFSET_Y - ISO_TILE_HEIGHT / 2);
          ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH, isoPos.y + MAP_OFFSET_Y);
          ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH / 2, isoPos.y + MAP_OFFSET_Y + ISO_TILE_HEIGHT / 2);
          ctx.closePath();
          ctx.fill();
        }
      });
      
      ctx.globalAlpha = 1.0; // 透明度をリセット
    }
    
    // ドラッグ範囲の視覚化
    if (isPlacingFacility && dragRange.size > 0) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#FFD700'; // 金色
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      
      dragRange.forEach(tileKey => {
        const [x, y] = tileKey.split('-').map(Number);
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          const isoPos = getIsometricPosition(x, y);
          
          ctx.beginPath();
          ctx.moveTo(isoPos.x + MAP_OFFSET_X, isoPos.y + MAP_OFFSET_Y);
          ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH / 2, isoPos.y + MAP_OFFSET_Y - ISO_TILE_HEIGHT / 2);
          ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH, isoPos.y + MAP_OFFSET_Y);
          ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH / 2, isoPos.y + MAP_OFFSET_Y + ISO_TILE_HEIGHT / 2);
          ctx.lineTo(isoPos.x + MAP_OFFSET_X + ISO_TILE_WIDTH / 2, isoPos.y + MAP_OFFSET_Y + ISO_TILE_HEIGHT / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });
      
      ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
  }, [camera, visibleTiles, facilityMap, getFacilityColor, getPreviewColorValue, getIsometricPosition, isSelected, parkEffectTiles, isPlacingFacility, dragRange, size, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y, convertCssClassToColor]);

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

  // 画面サイズ変更時のCanvasサイズ調整
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Canvasの実際のサイズを更新
    canvas.style.width = `${VIEWPORT_WIDTH}px`;
    canvas.style.height = `${VIEWPORT_HEIGHT}px`;
    
    // 描画コンテキストのサイズも更新
    canvas.width = VIEWPORT_WIDTH;
    canvas.height = VIEWPORT_HEIGHT;
    
    // 再描画
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawGrid(ctx);
    }
  }, [VIEWPORT_WIDTH, VIEWPORT_HEIGHT, drawGrid]);

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
