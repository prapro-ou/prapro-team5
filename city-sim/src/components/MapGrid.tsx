import React, { useEffect, useRef } from 'react';
import type { Position, GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Application, Graphics, Container, Point, Texture } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../utils/coordinates';
import { useTerrainStore } from '../stores/TerrainStore';
import { useGraphicsPool } from '../hooks/useGraphicsPool';
import { usePixiDrawing } from '../hooks/useDrawing';
import { usePixiCoordinates } from '../hooks/useCoordinates';
import { useWheelZoom } from '../hooks/useWheelZoom';
import { useFacilityTextures } from '../hooks/useFacilityTextures';
import { useKeyboardPan } from '../hooks/useKeyboardPan';

interface IsometricGridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[];
  selectedFacilityType?: FacilityType | null;
  money?: number;
  deleteMode?: boolean;
}

// グリッド描画
export const IsometricGrid: React.FC<IsometricGridProps> = ({ size, onTileClick, facilities = [], selectedFacilityType, money = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, moved: false, button: 0, downX: 0, downY: 0 });
  const keysRef = useRef<{ [code: string]: boolean }>({});
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  // 道路ドラッグ連続設置用の状態管理
  const roadDragRef = useRef({ 
    isPlacing: false, 
    startTile: null as { x: number; y: number } | null, 
    endTile: null as { x: number; y: number } | null 
  });
  const lastPointerGlobalRef = useRef<Point | null>(null);
  const texturesRef = useRef<Map<string, Texture>>(new Map());
  const offsetsRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });
  const isInitializedRef = useRef(false);
  const onTileClickRef = useRef<((position: Position) => void) | undefined>(onTileClick);
  // プロップスの最新値を保持するref（イベントハンドラの古いクロージャ問題対策）
  const selectedFacilityTypeRef = useRef<FacilityType | null | undefined>(selectedFacilityType);
  const moneyRef = useRef<number>(money);
  const facilitiesRef = useRef<Facility[]>(facilities);

  // オブジェクトプール
  const { getPooledGraphics, returnGraphics, clearPool } = useGraphicsPool();

  // 地形ストアの使用
  const { terrainMap, getTerrainAt } = useTerrainStore();

  // 座標計算フックの使用
  const {
    updateHoverState,
    startRoadDrag,
    updateRoadDrag,
    getClickTile,
    tileToIsometric
  } = usePixiCoordinates({
    size,
    worldRef,
    offsetsRef
  });

  // 描画フックの使用
  const {
    terrainLayerRef,
    facilitiesLayerRef,
    previewLayerRef,
    effectPreviewLayerRef,
    drawTerrainLayerForced,
    drawFacilitiesLayer,
    drawPreviewLayer,
    drawEffectPreviewLayer,
    drawRoadDragRangeLayer,
    clearPreviews,
    resetTerrainState
  } = usePixiDrawing({
    terrainMap,
    getTerrainAt,
    facilitiesRef,
    selectedFacilityTypeRef,
    moneyRef,
    size,
    hoverRef,
    roadDragRef,
    offsetsRef,
    texturesRef,
    getPooledGraphics,
    returnGraphics,
    isInitializedRef
  });

  useEffect(() => { selectedFacilityTypeRef.current = selectedFacilityType; }, [selectedFacilityType]);
  useEffect(() => { moneyRef.current = money; }, [money]);
  useEffect(() => { facilitiesRef.current = facilities; }, [facilities]);

  // 建設パネルが閉じられた時にプレビューをクリア
  useEffect(() => {
    if (!selectedFacilityType) {
      clearPreviews();
    }
  }, [selectedFacilityType]);

  // onTileClickRefを最新の値に更新
  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);

  // 地形描画の更新（地形データが変更された時のみ）
  useEffect(() => {
    if (isInitializedRef.current) {
      // セーブデータロード直後など、差分判定をバイパスして一度だけ強制描画
      resetTerrainState();
      drawTerrainLayerForced();
    }
  }, [terrainMap]);

  // 施設描画の更新（施設データが変更された時のみ）
  useEffect(() => {
    if (isInitializedRef.current) {
      drawFacilitiesLayer();
    }
  }, [facilities]);

  // プレビュー描画の更新
  useEffect(() => {
    if (isInitializedRef.current) {
      drawPreviewLayer();
      drawEffectPreviewLayer();
    }
  }, [selectedFacilityType, money, facilities]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !size.width || !size.height) return;


    let didInit = false;
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const init = async () => {
      const app = new Application();
      const width = Math.min(window.innerWidth, 1280);
      const height = Math.min(window.innerHeight, 720);
      await app.init({ canvas, width, height, backgroundAlpha: 1, background: 0x111827 }); // gray-900
      
      appRef.current = app;
      didInit = true;

      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      const g = new Graphics();
      world.addChild(g);
      
      // ホバー表示用レイヤ
      const hoverG = new Graphics();
      world.addChild(hoverG);

      const offsetX = width / 2;
      const offsetY = 120;
      offsetsRef.current = { offsetX, offsetY };
      const maxX = Math.min(size.width, 120);
      const maxY = Math.min(size.height, 120);

      g.rect(0, 0, width, height).fill({ color: 0x111827 });

      for (let y = 0; y < maxY; y++) {
        for (let x = 0; x < maxX; x++) {
          const isoX = (x - y) * (ISO_TILE_WIDTH / 2);
          const isoY = (x + y) * (ISO_TILE_HEIGHT / 2);
          const cx = isoX + offsetX;
          const cy = isoY + offsetY;

          g.moveTo(cx, cy)
            .lineTo(cx + ISO_TILE_WIDTH / 2, cy - ISO_TILE_HEIGHT / 2)
            .lineTo(cx + ISO_TILE_WIDTH, cy)
            .lineTo(cx + ISO_TILE_WIDTH / 2, cy + ISO_TILE_HEIGHT / 2)
            .lineTo(cx, cy)
            .fill({ color: 0x3b82f6, alpha: 0.15 })
            .stroke({ color: 0x666666, width: 1 });
        }
      }

      // 初期カメラ適用
      world.position.set(cameraRef.current.x, cameraRef.current.y);
      world.scale.set(cameraRef.current.scale);

      // ステージにイベント設定（パン用）
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.cursor = 'grab';

      // 分離したポインタイベントハンドラを作成
      const { createPointerHandlers } = await import('../hooks/usePointerHandlers');
      const { onPointerDown, onPointerMove, onPointerUp } = createPointerHandlers({
        appStage: app.stage,
        world,
        hoverG,
        size,
        cameraRef,
        dragRef,
        keysRef,
        lastPointerGlobalRef,
        hoverRef,
        roadDragRef,
        selectedFacilityTypeRef,
        onTileClickRef,
        updateHoverState,
        startRoadDrag,
        updateRoadDrag,
        getClickTile,
        tileToIsometric,
        drawPreviewLayer,
        drawEffectPreviewLayer,
        drawRoadDragRangeLayer,
        clearPreviews,
      });

      app.stage.on('pointerdown', onPointerDown);
      app.stage.on('pointermove', onPointerMove);
      app.stage.on('pointerup', onPointerUp);
      app.stage.on('pointerleave', () => { hoverRef.current = null; hoverG.clear(); });

      // 地形用レイヤ（最下層）
      const terrainLayer = new Container();
      terrainLayer.sortableChildren = true;
      world.addChild(terrainLayer);
      terrainLayerRef.current = terrainLayer;

      // 施設用レイヤ
      const facilitiesLayer = new Container();
      facilitiesLayer.sortableChildren = true;
      world.addChild(facilitiesLayer);
      facilitiesLayerRef.current = facilitiesLayer;

      // プレビュー用レイヤ（施設レイヤーの上）
      const previewLayer = new Container();
      previewLayer.sortableChildren = true;
      world.addChild(previewLayer);
      previewLayerRef.current = previewLayer;

      // 効果範囲プレビュー用レイヤ（プレビューレイヤーの上）
      const effectPreviewLayer = new Container();
      effectPreviewLayer.sortableChildren = true;
      world.addChild(effectPreviewLayer);
      effectPreviewLayerRef.current = effectPreviewLayer;

      // 施設テクスチャのプリロード（フックに分離）
      const { loadFacilityTextures } = useFacilityTextures(texturesRef);
      await loadFacilityTextures();

      // 初期化完了フラグを設定
      isInitializedRef.current = true;
      
      // 初期化完了後に描画を更新（強制描画で一度確実に反映）
      resetTerrainState();
      drawTerrainLayerForced();
      drawFacilitiesLayer();
      drawPreviewLayer();
      drawEffectPreviewLayer();

      // ホイールズーム
      const { attachWheelZoom } = useWheelZoom({ appRef, worldRef, cameraRef, lastPointerGlobalRef });
      const onWheel = attachWheelZoom();
      
      // 右クリック時のコンテキストメニューを無効化
      canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      // キーボードパン（フックに分離）
      const { attachKeyboardPan } = useKeyboardPan({ appRef, worldRef, cameraRef, keysRef });
      const { onKeyDown, onKeyUp, tickerFn, addTicker } = attachKeyboardPan();
      
      // app初期化後にtickerを確実に追加
      addTicker();

      const handleResize = () => {
        const w = Math.min(window.innerWidth, 1280);
        const h = Math.min(window.innerHeight, 720);
        app.renderer.resize(w, h);
      };
      window.addEventListener('resize', handleResize);
      
      // クリーンアップで外せるように、関数をref経由で保持
      (app as any).__handleResize = handleResize;
      (app as any).__wheel = onWheel;
      (app as any).__ptrDown = onPointerDown;
      (app as any).__ptrMove = onPointerMove;
      (app as any).__ptrUp = onPointerUp;
      (app as any).__ptrLeave = () => { 
        hoverRef.current = null; 
        hoverG.clear(); 
        clearPreviews();
      };
      (app as any).__keyDown = onKeyDown;
      (app as any).__keyUp = onKeyUp;
      (app as any).__tickerFn = tickerFn;
    };

    init();

    return () => {
      const app = appRef.current;
      appRef.current = null;
      isInitializedRef.current = false;
      
      // init 完了していない場合は destroy を呼ばない
      if (didInit && app) {
        try {
          const handler = (app as any).__handleResize as (() => void) | undefined;
          if (handler) window.removeEventListener('resize', handler);
          
          const wheel = (app as any).__wheel as ((e: WheelEvent) => void) | undefined;
          if (wheel) (app.renderer.canvas as HTMLCanvasElement)?.removeEventListener('wheel', wheel as any);
          
          // コンテキストメニュー無効化のイベントリスナーを削除
          (app.renderer.canvas as HTMLCanvasElement)?.removeEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
          });

          const pd = (app as any).__ptrDown as any;
          const pm = (app as any).__ptrMove as any;
          const pu = (app as any).__ptrUp as any;
          const pl = (app as any).__ptrLeave as any;
          if (pd) app.stage.off('pointerdown', pd);
          if (pm) app.stage.off('pointermove', pm);
          if (pu) app.stage.off('pointerup', pu);
          if (pl) app.stage.off('pointerleave', pl);

          const kd = (app as any).__keyDown as any;
          const ku = (app as any).__keyUp as any;
          if (kd) window.removeEventListener('keydown', kd);
          if (ku) window.removeEventListener('keyup', ku);
          const tf = (app as any).__tickerFn as ((t: any) => void) | undefined;
          if (tf) app.ticker.remove(tf);
          
          // オブジェクトプールをクリア
          clearPool();
          
          app.destroy(true);
        }
        catch {
          // 破棄中例外は無視（未初期化や二重破棄対策）
        }
      }
      if (container.contains(canvas)) container.removeChild(canvas);

      // レイヤ参照をクリアして次回初期化時の初期状態を保証
      terrainLayerRef.current = null;
      facilitiesLayerRef.current = null;
      previewLayerRef.current = null;
      effectPreviewLayerRef.current = null;
    };
  }, [size.width, size.height]);

  return (
    <div ref={containerRef} className="relative overflow-hidden border-2 border-blue-500" style={{ width: '100%', height: '100%' }} />
  );
};

export default IsometricGrid;
