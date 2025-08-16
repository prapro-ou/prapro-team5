import React, { useRef, useEffect, useCallback } from "react";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
import type { ImageCache } from "../types/drawing";
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
import { DRAWING_CONSTANTS } from '../constants/drawingConstants';
import { FACILITY_DATA } from '../types/facility';
import { 
  drawTile, 
  drawFacilityImage, 
  drawFacilityEffects, 
  drawDragRange 
} from '../utils/drawingUtils';

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
  
  // 画像キャッシュの状態管理
  const [imageCache, setImageCache] = React.useState<ImageCache>({});
  const [imagesLoaded, setImagesLoaded] = React.useState(false);
  
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
    facilityEffectTiles,
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
    handleTileClick
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
    if (cssClass.includes('bg-green-500')) return '#22C55E';
    if (cssClass.includes('bg-blue-300')) return '#93C5FD';
    if (cssClass.includes('bg-blue-500')) return '#3B82F6';
    if (cssClass.includes('bg-yellow-200')) return '#FEF3C7';
    if (cssClass.includes('bg-yellow-500')) return '#EAB308';
    if (cssClass.includes('bg-gray-400')) return '#9CA3AF';
    if (cssClass.includes('bg-gray-700')) return '#374151';
    if (cssClass.includes('bg-gray-900')) return '#111827';
    if (cssClass.includes('bg-purple-300')) return '#C4B5FD';
    if (cssClass.includes('bg-purple-500')) return '#8B5CF6';
    if (cssClass.includes('bg-lime-200')) return '#D3FCAE';
    if (cssClass.includes('bg-lime-400')) return '#A3E635';
    if (cssClass.includes('bg-red-300')) return '#FCA5A5';
    if (cssClass.includes('bg-red-500')) return '#EF4444';
    
    // デバッグ用：未対応の色クラスをログ出力
    return '#9CA3AF';
  }, []);

  // 画像ロード機能
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // 施設画像の事前ロード
  const preloadFacilityImages = useCallback(async () => {
    try {
      // 施設マスターデータから画像パスを取得
      const imagePaths = Object.values(FACILITY_DATA)
        .filter(facility => facility.imgPaths && facility.imgPaths.length > 0)
        .flatMap(facility => facility.imgPaths!)
        .filter((path, index, array) => array.indexOf(path) === index); // 重複除去

      const loadedImages: ImageCache = {};
      
      for (const path of imagePaths) {
        try {
          const img = await loadImage(path);
          loadedImages[path] = img;
        } catch (error) {
          console.warn(`画像のロードに失敗: ${path}`, error);
        }
      }

      setImageCache(loadedImages);
      setImagesLoaded(true);
    } catch (error) {
      console.error('画像ロード中にエラーが発生:', error);
    }
  }, [loadImage]);

  // コンポーネントマウント時に画像をロード
  useEffect(() => {
    preloadFacilityImages();
  }, [preloadFacilityImages]);

  // Canvas描画関数
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    // 背景をクリア
    ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    
    // カメラ位置を考慮した変換
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // タイルの描画
    visibleTiles.forEach(({ x, y }) => {
      const facility = facilityMap.get(`${x}-${y}`);
      const facilityColor = getFacilityColor(facility);
      const previewColorValue = getPreviewColorValue(x, y);
      
      const tileColor = previewColorValue 
        ? convertCssClassToColor(previewColorValue)
        : (facilityColor ? convertCssClassToColor(facilityColor) : DRAWING_CONSTANTS.DEFAULT_TILE_COLOR);
      
      drawTile({
        ctx,
        x,
        y,
        tileColor,
        mapOffsetX: MAP_OFFSET_X,
        mapOffsetY: MAP_OFFSET_Y,
        getIsometricPosition
      });
    });
    
    // 施設画像の描画
    visibleTiles.forEach(({ x, y }) => {
      const facility = facilityMap.get(`${x}-${y}`);
      if (facility && imagesLoaded) {
        drawFacilityImage({
          ctx,
          facility,
          x,
          y,
          mapOffsetX: MAP_OFFSET_X,
          mapOffsetY: MAP_OFFSET_Y,
          imageCache,
          getIsometricPosition,
          isFacilityCenter,
          getFacilityImageData,
          getRoadImageData
        });
      }
    });
    
    // 施設効果範囲の描画
    drawFacilityEffects({
      ctx,
      facilityEffectTiles,
      size,
      mapOffsetX: MAP_OFFSET_X,
      mapOffsetY: MAP_OFFSET_Y,
      selectedPosition: selectedPosition || null,
      facilities,
      getIsometricPosition,
      drawTile
    });
    
    // ドラッグ範囲の描画
    drawDragRange({
      ctx,
      isPlacingFacility,
      dragRange,
      size,
      mapOffsetX: MAP_OFFSET_X,
      mapOffsetY: MAP_OFFSET_Y,
      getIsometricPosition
    });
    
    ctx.restore();
  }, [camera, visibleTiles, facilityMap, getFacilityColor, getPreviewColorValue, convertCssClassToColor, imagesLoaded, getIsometricPosition, isFacilityCenter, getFacilityImageData, getRoadImageData, facilityEffectTiles, selectedPosition, facilities, isPlacingFacility, dragRange, size, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, MAP_OFFSET_X, MAP_OFFSET_Y]);

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
      {/* <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs z-[1000]">
        Camera: ({camera.x}, {camera.y})
      </div> */}
      
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
        onClick={(e) => {
          const gridPos = mouseToGrid(e.clientX, e.clientY, e.currentTarget);
          if (gridPos) {
            handleTileClick(gridPos.x, gridPos.y);
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
