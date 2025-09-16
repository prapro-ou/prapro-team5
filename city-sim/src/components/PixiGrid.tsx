import React, { useRef, useEffect, useCallback } from "react";
import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import type { Position, GridSize } from "../types/grid";
import type { Facility, FacilityType } from "../types/facility";
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
import { FACILITY_DATA } from '../types/facility';
import { useTerrainStore } from '../stores/TerrainStore';
import { TERRAIN_DATA } from '../types/terrain';
import { toIsometric } from '../utils/coordinates';

// PixiGridコンポーネントのプロパティ
interface PixiGridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[];
  selectedFacilityType?: FacilityType | null;
  money?: number;
  onSelectParkCenter?: (pos: Position) => void;
  deleteMode?: boolean;
}

// PixiJS用の描画レイヤー
interface PixiLayers {
  terrain: Container;
  facilities: Container;
  effects: Container;
  ui: Container;
}

// PixiGridコンポーネント
export const PixiGrid: React.FC<PixiGridProps> = ({ 
  size, 
  onTileClick, 
  selectedPosition,
  facilities = [],
  selectedFacilityType = null,
  money = 0,
  onSelectParkCenter,
  deleteMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const layersRef = useRef<PixiLayers | null>(null);
  
  // 地形ストアの使用
  const { terrainMap, generateTerrain, getTerrainAt } = useTerrainStore();
  
  // フックの呼び出し順序を固定
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
    onTileClick: (x: number, y: number) => {
      if (onTileClick) {
        onTileClick({ x, y });
      }
    }
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
    getIsometricPosition,
    calculateZIndex,
    calculateFacilityZIndex,
    calculateIsometricZIndex
  } = useFacilityDisplay({
    facilityMap,
    MAP_OFFSET_X,
    MAP_OFFSET_Y
  });

  // 地形に応じた色を取得する関数
  const getTerrainColor = useCallback((terrain: string): number => {
    const terrainColors: Record<string, number> = {
      grass: 0x90EE90,      // 薄い緑
      water: 0x87CEEB,      // 空色
      forest: 0x228B22,     // 濃い緑
      desert: 0xF4A460,     // 砂色
      mountain: 0x696969,   // 暗いグレー
      beach: 0xF5DEB3,      // 小麦色
      swamp: 0x8B4513,      // 茶色
      rocky: 0xA0522D,      // シエナ
    };
    return terrainColors[terrain] || 0x90EE90;
  }, []);

  // PixiJSアプリケーションの初期化
  const initializePixiApp = useCallback(async () => {
    if (!canvasRef.current) return;

    const app = new Application();
    await app.init({
      canvas: canvasRef.current,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
      backgroundColor: 0x1f2937, // gray-900
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    appRef.current = app;

    // レイヤーの作成
    const layers: PixiLayers = {
      terrain: new Container(),
      facilities: new Container(),
      effects: new Container(),
      ui: new Container(),
    };

    // レイヤーをステージに追加（描画順序を考慮）
    app.stage.addChild(layers.terrain);
    app.stage.addChild(layers.facilities);
    app.stage.addChild(layers.effects);
    app.stage.addChild(layers.ui);

    layersRef.current = layers;

    // カメラ位置の初期設定
    app.stage.x = -camera.x;
    app.stage.y = -camera.y;

    // 地形の描画
    drawTerrain();
    
    // 施設の描画
    drawFacilities();

    console.log('PixiJSアプリケーションが初期化されました');
  }, [VIEWPORT_WIDTH, VIEWPORT_HEIGHT, camera.x, camera.y]);

  // 地形の描画
  const drawTerrain = useCallback(() => {
    if (!layersRef.current) return;

    const terrainLayer = layersRef.current.terrain;
    terrainLayer.removeChildren();

    const visibleTiles = getVisibleTiles();
    
    visibleTiles.forEach(({ x, y }) => {
      const terrain = getTerrainAt(x, y);
      const color = getTerrainColor(terrain);
      const isoPos = toIsometric(x, y);
      
      // アイソメトリックタイルの描画
      const tile = new Graphics();
      tile.beginFill(color);
      
      // アイソメトリックタイルのパスを作成
      const tileWidth = 32;
      const tileHeight = 16;
      
      tile.moveTo(isoPos.x + MAP_OFFSET_X, isoPos.y + MAP_OFFSET_Y);
      tile.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth / 2, isoPos.y + MAP_OFFSET_Y - tileHeight / 2);
      tile.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth, isoPos.y + MAP_OFFSET_Y);
      tile.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth / 2, isoPos.y + MAP_OFFSET_Y + tileHeight / 2);
      tile.closePath();
      tile.endFill();
      
      // 境界線
      tile.lineStyle(1, 0x666666);
      tile.moveTo(isoPos.x + MAP_OFFSET_X, isoPos.y + MAP_OFFSET_Y);
      tile.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth / 2, isoPos.y + MAP_OFFSET_Y - tileHeight / 2);
      tile.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth, isoPos.y + MAP_OFFSET_Y);
      tile.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth / 2, isoPos.y + MAP_OFFSET_Y + tileHeight / 2);
      tile.closePath();
      
      terrainLayer.addChild(tile);
    });
  }, [getVisibleTiles, getTerrainAt, getTerrainColor, MAP_OFFSET_X, MAP_OFFSET_Y]);

  // 施設の描画
  const drawFacilities = useCallback(() => {
    if (!layersRef.current) return;

    const facilityLayer = layersRef.current.facilities;
    facilityLayer.removeChildren();

    const visibleTiles = getVisibleTiles();
    
    // 施設をZ-index順にソート
    const visibleFacilities = Array.from(facilityMap.values())
      .filter(facility => {
        return facility.occupiedTiles.some(tile => 
          visibleTiles.some(vt => vt.x === tile.x && vt.y === tile.y)
        );
      })
      .sort((a, b) => {
        const zIndexA = calculateFacilityZIndex(a);
        const zIndexB = calculateFacilityZIndex(b);
        return zIndexA - zIndexB;
      });

    visibleFacilities.forEach(facility => {
      facility.occupiedTiles.forEach(tile => {
        if (visibleTiles.some(vt => vt.x === tile.x && vt.y === tile.y)) {
          const isCenter = isFacilityCenter(facility, tile.x, tile.y);
          if (!isCenter) return;

          const isoPos = toIsometric(tile.x, tile.y);
          
          // 施設の色を取得
          const facilityColor = getFacilityColor(facility);
          const color = facilityColor ? parseInt(facilityColor.replace('#', '0x')) : 0x9CA3AF;
          
          // 施設の描画
          const facilitySprite = new Graphics();
          facilitySprite.beginFill(color);
          
          const tileWidth = 32;
          const tileHeight = 16;
          
          facilitySprite.moveTo(isoPos.x + MAP_OFFSET_X, isoPos.y + MAP_OFFSET_Y);
          facilitySprite.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth / 2, isoPos.y + MAP_OFFSET_Y - tileHeight / 2);
          facilitySprite.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth, isoPos.y + MAP_OFFSET_Y);
          facilitySprite.lineTo(isoPos.x + MAP_OFFSET_X + tileWidth / 2, isoPos.y + MAP_OFFSET_Y + tileHeight / 2);
          facilitySprite.closePath();
          facilitySprite.endFill();
          
          facilityLayer.addChild(facilitySprite);
        }
      });
    });
  }, [facilityMap, getVisibleTiles, isFacilityCenter, getFacilityColor, calculateFacilityZIndex, MAP_OFFSET_X, MAP_OFFSET_Y]);

  // カメラ位置の更新
  const updateCamera = useCallback(() => {
    if (!appRef.current) return;
    
    appRef.current.stage.x = -camera.x;
    appRef.current.stage.y = -camera.y;
  }, [camera.x, camera.y]);

  // 地形の初期化
  useEffect(() => {
    if (terrainMap.size === 0) {
      generateTerrain(size);
    }
  }, [terrainMap.size, generateTerrain, size]);

  // PixiJSアプリケーションの初期化
  useEffect(() => {
    initializePixiApp();
    
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [initializePixiApp]);

  // カメラ位置の更新
  useEffect(() => {
    updateCamera();
  }, [updateCamera]);

  // 施設の更新
  useEffect(() => {
    drawFacilities();
  }, [drawFacilities]);

  // 地形の更新
  useEffect(() => {
    drawTerrain();
  }, [drawTerrain]);

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

  return (
    <div className={`relative overflow-hidden border-2 transition-colors duration-300 ${deleteMode ? 'border-red-500' : 'border-blue-500'}`}>
      {/* PixiJS Canvas要素 */}
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
