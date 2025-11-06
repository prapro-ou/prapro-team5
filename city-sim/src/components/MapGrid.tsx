import React, { useEffect, useRef } from 'react';
import type { Position, GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Application, Graphics, Container, Point, Texture, Rectangle } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../utils/coordinates';
import { useTerrainStore } from '../stores/TerrainStore';
import { useTimeControlStore } from '../stores/TimeControlStore';
import { useGraphicsPool } from '../hooks/useGraphicsPool';
import { usePixiDrawing } from '../hooks/useDrawing';
import { usePixiCoordinates } from '../hooks/useCoordinates';
import { useWheelZoom } from '../hooks/useWheelZoom';
import { useFacilityTextures } from '../hooks/useFacilityTextures';
import { useKeyboardPan } from '../hooks/useKeyboardPan';
import { GRID_WIDTH, GRID_HEIGHT } from '../constants/gridConstants';
import { useUIStore } from '../stores/UIStore';

interface IsometricGridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  onReady?: () => void;
  selectedPosition?: Position | null;
  facilities?: Facility[];
  selectedFacilityType?: FacilityType | null;
  money?: number;
  deleteMode?: boolean;
}

// グリッド描画
export const IsometricGrid: React.FC<IsometricGridProps> = React.memo(({ size, onTileClick, onReady, facilities = [], selectedFacilityType, money = 0, deleteMode = false }) => {
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
  const onReadyRef = useRef<(() => void) | undefined>(onReady);
  const readyNotifiedRef = useRef(false);

  // UIストアからカメラ状態取得/保存
  const cameraX = useUIStore(state => state.cameraX);
  const cameraY = useUIStore(state => state.cameraY);
  const cameraScaleFromStore = useUIStore(state => state.cameraScale);
  const setCameraState = useUIStore(state => state.setCameraState);

  // オブジェクトプール
  const { getPooledGraphics, returnGraphics, clearPool } = useGraphicsPool();
  
  // 時間制御の状態を取得
  const { isPaused } = useTimeControlStore();

  // 地形ストアの使用
  const { terrainMap, getTerrainAt, heightTerrainMap } = useTerrainStore();

  // 座標計算フックの使用
  const {
    updateHoverState,
    startRoadDrag,
    updateRoadDrag,
    getClickTile,
    tileToIsometric,
    getTileHeightOffset
  } = usePixiCoordinates({
    size,
    worldRef,
    offsetsRef,
    heightTerrainMap
  });

  // 描画フックの使用
  const {
    terrainLayerRef,
    facilitiesLayerRef,
    previewLayerRef,
    effectPreviewLayerRef,
    drawTerrainLayerForced,
    drawFacilitiesLayerForced,
    drawFacilitiesLayer,
    drawPreviewLayer,
    drawEffectPreviewLayer,
    drawRoadDragRangeLayer,
    clearPreviews,
    resetTerrainState
  } = usePixiDrawing({
    terrainMap,
    getTerrainAt,
    heightTerrainMap,
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

  // 高さ地形マップが変更されたら強制描画
  useEffect(() => {
    if (heightTerrainMap && heightTerrainMap.size > 0) {
      drawTerrainLayerForced();
    }
  }, [heightTerrainMap, drawTerrainLayerForced]);

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

  // onReady を最新に保持
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

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
      // PixiJSの最適化設定
      await app.init({ 
        canvas, 
        width, 
        height, 
        backgroundAlpha: 1, 
        background: 0x111827,
        antialias: false, 
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        powerPreference: 'high-performance'
      });
      
      appRef.current = app;
      didInit = true;

      const canvasEl = app.renderer.canvas as HTMLCanvasElement;
      canvasEl.tabIndex = 0;
      canvasEl.style.outline = 'none';
      canvasEl.style.pointerEvents = 'auto';
      const ensureFocus = () => { try { canvasEl.focus(); } catch {} };
      ensureFocus();

      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      const g = new Graphics();
      world.addChild(g);

      const offsetX = width / 2;
      const offsetY = GRID_HEIGHT;
      offsetsRef.current = { offsetX, offsetY };
      const maxX = Math.min(size.width, GRID_WIDTH);
      const maxY = Math.min(size.height, GRID_HEIGHT);

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
      cameraRef.current.x = cameraX ?? 0;
      cameraRef.current.y = cameraY ?? 0;
      cameraRef.current.scale = cameraScaleFromStore ?? 1;
      world.position.set(cameraRef.current.x, cameraRef.current.y);
      world.scale.set(cameraRef.current.scale);

      // ステージにイベント設定（パン用）
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.cursor = 'grab';

      // 地形用レイヤ（最下層）
      const terrainLayer = new Container();
      terrainLayer.sortableChildren = false;
      terrainLayer.interactiveChildren = false;
      terrainLayer.cullable = true; // ビューポート外の自動カリングを有効化
      terrainLayer.cullArea = new Rectangle(-width, -height, width * 3, height * 3); // カリング範囲を設定
      world.addChild(terrainLayer);
      terrainLayerRef.current = terrainLayer;

      // 施設用レイヤ
      const facilitiesLayer = new Container();
      facilitiesLayer.sortableChildren = false;
      facilitiesLayer.interactiveChildren = false;
      facilitiesLayer.cullable = true; // ビューポート外の自動カリングを有効化
      facilitiesLayer.cullArea = new Rectangle(-width, -height, width * 3, height * 3);
      world.addChild(facilitiesLayer);
      facilitiesLayerRef.current = facilitiesLayer;

      // プレビュー用レイヤ（施設レイヤーの上）
      const previewLayer = new Container();
      previewLayer.sortableChildren = true;
      previewLayer.interactiveChildren = false;
      previewLayer.cullable = true;
      previewLayer.cullArea = new Rectangle(-width, -height, width * 3, height * 3);
      world.addChild(previewLayer);
      previewLayerRef.current = previewLayer;

      // 効果範囲プレビュー用レイヤ（プレビューレイヤーの上）
      const effectPreviewLayer = new Container();
      effectPreviewLayer.sortableChildren = true;
      effectPreviewLayer.interactiveChildren = false;
      effectPreviewLayer.cullable = true;
      effectPreviewLayer.cullArea = new Rectangle(-width, -height, width * 3, height * 3);
      world.addChild(effectPreviewLayer);
      effectPreviewLayerRef.current = effectPreviewLayer;

      // ホバー表示用レイヤ（最前面）
      const hoverLayer = new Container();
      hoverLayer.sortableChildren = true;
      hoverLayer.interactiveChildren = false;
      hoverLayer.cullable = false; // ホバーは常に表示するためカリングしない
      world.addChild(hoverLayer);
      const hoverG = new Graphics();
      hoverLayer.addChild(hoverG);

      // 施設テクスチャのプリロード（フックに分離）
      const { loadFacilityTextures } = useFacilityTextures(texturesRef);
      await loadFacilityTextures();

      // 分離したポインタイベントハンドラを作成（テクスチャ読み込み後）
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
        getTileHeightOffset,
        drawPreviewLayer,
        drawEffectPreviewLayer,
        drawRoadDragRangeLayer,
        clearPreviews,
      });

      app.stage.on('pointerdown', onPointerDown);
      app.stage.on('pointermove', onPointerMove);
      app.stage.on('pointerup', onPointerUp);
      app.stage.on('pointerleave', () => { hoverRef.current = null; hoverG.clear(); });
      // クリック時にキャンバスへフォーカスを戻す
      canvasEl.addEventListener('pointerdown', ensureFocus);

      // 初期化完了フラグを設定（イベントハンドラ設定後）
      isInitializedRef.current = true;
      
      // 初期化完了後に描画を更新（強制描画で一度確実に反映）
      resetTerrainState();
      drawTerrainLayerForced();
      drawFacilitiesLayerForced();
      drawPreviewLayer();
      drawEffectPreviewLayer();

      // 初期描画完了を親へ通知（2フレーム待ってから）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!readyNotifiedRef.current && onReadyRef.current) {
            readyNotifiedRef.current = true;
            try { onReadyRef.current(); } catch {}
          }
        });
      });

      // ホイールズーム
      const { attachWheelZoom } = useWheelZoom({ appRef, worldRef, cameraRef, lastPointerGlobalRef });
      const onWheel = attachWheelZoom();
      
      // 右クリック時のコンテキストメニューを無効化（ハンドラを保持してクリーンアップ時に解除）
      const onContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false as any;
      };
      canvasEl.addEventListener('contextmenu', onContextMenu);

      // キーボードパン（フックに分離）
      const { attachKeyboardPan } = useKeyboardPan({ appRef, worldRef, cameraRef, keysRef });
      const { onKeyDown, onKeyUp, tickerFn, addTicker } = attachKeyboardPan();
      
      // app初期化後にtickerを確実に追加
      addTicker();

      const handleResize = () => {
        const w = Math.min(window.innerWidth, 1280);
        const h = Math.min(window.innerHeight, 720);
        app.renderer.resize(w, h);
        
        // カリングエリアを更新
        const cullArea = new Rectangle(-w, -h, w * 3, h * 3);
        if (terrainLayerRef.current) {
          terrainLayerRef.current.cullArea = cullArea;
        }
        if (facilitiesLayerRef.current) {
          facilitiesLayerRef.current.cullArea = cullArea;
        }
        if (previewLayerRef.current) {
          previewLayerRef.current.cullArea = cullArea;
        }
        if (effectPreviewLayerRef.current) {
          effectPreviewLayerRef.current.cullArea = cullArea;
        }
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
      (app as any).__ctxMenu = onContextMenu;
      (app as any).__ensureFocus = ensureFocus;
    };

    init();

    return () => {
      const app = appRef.current;
      appRef.current = null;
      isInitializedRef.current = false;

      // 現在のカメラ状態を保存
      try { setCameraState(cameraRef.current.x, cameraRef.current.y, cameraRef.current.scale); } catch {}
      
      // init 完了していない場合は destroy を呼ばない
      if (didInit && app) {
        try {
          const handler = (app as any).__handleResize as (() => void) | undefined;
          if (handler) window.removeEventListener('resize', handler);
          
          const wheel = (app as any).__wheel as ((e: WheelEvent) => void) | undefined;
          if (wheel) (app.renderer.canvas as HTMLCanvasElement)?.removeEventListener('wheel', wheel as any);
          
          // コンテキストメニュー無効化のイベントリスナーを削除
          const ctx = (app as any).__ctxMenu as any;
          if (ctx) (app.renderer.canvas as HTMLCanvasElement)?.removeEventListener('contextmenu', ctx);

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

          // フォーカス用リスナー解除
          const ens = (app as any).__ensureFocus as any;
          if (ens) (app.renderer.canvas as HTMLCanvasElement)?.removeEventListener('pointerdown', ens);
          
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
      readyNotifiedRef.current = false;
    };
  }, [size.width, size.height]);

  // ボーダー色を決定
  let borderColor = 'border-blue-500';
  if (deleteMode) {
    borderColor = 'border-red-500';
  } else if (isPaused) {
    borderColor = 'border-yellow-500';
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden border-2 ${borderColor}`} style={{ width: '100%', height: '100%' }} />
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数：重要なpropsのみ比較
  return prevProps.size.width === nextProps.size.width &&
         prevProps.size.height === nextProps.size.height &&
         prevProps.deleteMode === nextProps.deleteMode &&
         prevProps.money === nextProps.money &&
         prevProps.selectedFacilityType === nextProps.selectedFacilityType &&
         JSON.stringify(prevProps.facilities) === JSON.stringify(nextProps.facilities);
});

export default IsometricGrid;
