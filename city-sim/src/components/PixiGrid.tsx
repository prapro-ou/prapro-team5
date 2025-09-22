import React, { useEffect, useRef } from 'react';
import type { Position, GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Application, Graphics, Container, Point, Assets, Texture } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT, fromIsometric } from '../utils/coordinates';
import { FACILITY_DATA } from '../types/facility';
import { useTerrainStore } from '../stores/TerrainStore';
import { useGraphicsPool } from '../hooks/useGraphicsPool';
import { usePixiDrawing } from '../hooks/usePixiDrawing';

interface PixiGridProps {
  size: GridSize;
  onTileClick?: (position: Position) => void;
  selectedPosition?: Position | null;
  facilities?: Facility[];
  selectedFacilityType?: FacilityType | null;
  money?: number;
  deleteMode?: boolean;
}

// グリッド描画
export const PixiGrid: React.FC<PixiGridProps> = ({ size, onTileClick, facilities = [], selectedFacilityType, money = 0 }) => {
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

  // 描画フックの使用
  const {
    terrainLayerRef,
    facilitiesLayerRef,
    previewLayerRef,
    effectPreviewLayerRef,
    drawTerrainLayer,
    drawFacilitiesLayer,
    drawPreviewLayer,
    drawEffectPreviewLayer,
    drawRoadDragRangeLayer,
    clearPreviews
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
      drawTerrainLayer();
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

      const onPointerDown = (e: any) => {
        const isSpacePressed = !!(keysRef.current['Space']);
        const isLeft = e.button === 0;
        // 左クリックは建設用。パンは右/中ボタン、またはSpace+左で開始
        const shouldDrag = !isLeft || isSpacePressed;
        
        dragRef.current.dragging = shouldDrag;
        dragRef.current.moved = false;
        dragRef.current.startX = e.global.x;
        dragRef.current.startY = e.global.y;
        dragRef.current.downX = e.global.x;
        dragRef.current.downY = e.global.y;
        dragRef.current.button = e.button;
        
        if (shouldDrag) {
          app.stage.cursor = 'grabbing';
        } 
        else if (isLeft && selectedFacilityTypeRef.current) {
          // 道路のドラッグ開始処理
          if (selectedFacilityTypeRef.current === 'road') {
            const local = world.toLocal(new Point(e.global.x, e.global.y));
            const isoX = (local.x - offsetX);
            const isoY = (local.y - offsetY);
            const tile = fromIsometric(isoX, isoY);
            
            if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
              roadDragRef.current.isPlacing = true;
              roadDragRef.current.startTile = { x: tile.x, y: tile.y };
              roadDragRef.current.endTile = { x: tile.x, y: tile.y };
              drawRoadDragRangeLayer();
            }
          }
        }
      };

      const onPointerMove = (e: any) => {
        // 最新のグローバル座標を保存（ホイール時のズーム原点に使用）
        lastPointerGlobalRef.current = new Point(e.global.x, e.global.y);
        
        if (dragRef.current.dragging) {
          const dx = e.global.x - dragRef.current.startX;
          const dy = e.global.y - dragRef.current.startY;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragRef.current.moved = true;
          dragRef.current.startX = e.global.x;
          dragRef.current.startY = e.global.y;
          cameraRef.current.x += dx;
          cameraRef.current.y += dy;
          world.position.set(cameraRef.current.x, cameraRef.current.y);
          return;
        }

        // 道路ドラッグ更新処理
        if (roadDragRef.current.isPlacing) {
          const local = world.toLocal(new Point(e.global.x, e.global.y));
          const isoX = (local.x - offsetX);
          const isoY = (local.y - offsetY);
          const tile = fromIsometric(isoX, isoY);
          
          if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
            roadDragRef.current.endTile = { x: tile.x, y: tile.y };
            drawRoadDragRangeLayer();
          }
          return;
        }

         // ホバー更新（ドラッグしていない時）
         const local = world.toLocal(new Point(e.global.x, e.global.y));
         const isoX = (local.x - offsetX);
         const isoY = (local.y - offsetY);
         const tile = fromIsometric(isoX, isoY);
         
         if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
           const changed = !hoverRef.current || hoverRef.current.x !== tile.x || hoverRef.current.y !== tile.y;
           if (changed) {
             hoverRef.current = { x: tile.x, y: tile.y };
             // 再描画
             hoverG.clear();
             const hIsoX = (tile.x - tile.y) * (ISO_TILE_WIDTH / 2) + offsetX;
             const hIsoY = (tile.x + tile.y) * (ISO_TILE_HEIGHT / 2) + offsetY;
             hoverG.moveTo(hIsoX, hIsoY)
               .lineTo(hIsoX + ISO_TILE_WIDTH / 2, hIsoY - ISO_TILE_HEIGHT / 2)
               .lineTo(hIsoX + ISO_TILE_WIDTH, hIsoY)
               .lineTo(hIsoX + ISO_TILE_WIDTH / 2, hIsoY + ISO_TILE_HEIGHT / 2)
               .lineTo(hIsoX, hIsoY)
               .fill({ color: 0xf59e0b, alpha: 0.2 })
               .stroke({ color: 0xf59e0b, width: 2 });
             
             // プレビューも更新
             drawPreviewLayer();
             drawEffectPreviewLayer();
           }
         }
        else {
          hoverRef.current = null;
          hoverG.clear();
          // プレビューもクリア
          clearPreviews();
        }
      };

      const onPointerUp = (e: any) => {
        lastPointerGlobalRef.current = new Point(e.global.x, e.global.y);
        const wasDragging = dragRef.current.dragging;
        // const moved = dragRef.current.moved;
        const pressedButton = dragRef.current.button;
        
        dragRef.current.dragging = false;
        app.stage.cursor = 'grab';

        // 道路ドラッグ確定処理
        if (roadDragRef.current.isPlacing && onTileClickRef.current) {
          const startTile = roadDragRef.current.startTile;
          const endTile = roadDragRef.current.endTile;
          
          if (startTile && endTile) {
            const dx = Math.abs(endTile.x - startTile.x);
            const dy = Math.abs(endTile.y - startTile.y);
            
            // X軸方向の直線
            if (dx > dy) {
              const startX = Math.min(startTile.x, endTile.x);
              const endX = Math.max(startTile.x, endTile.x);
              const y = startTile.y;
              
              for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
                  onTileClickRef.current({ x, y });
                }
              }
            }
            // Y軸方向の直線
            else {
              const startY = Math.min(startTile.y, endTile.y);
              const endY = Math.max(startTile.y, endTile.y);
              const x = startTile.x;
              
              for (let y = startY; y <= endY; y++) {
                if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
                  onTileClickRef.current({ x, y });
                }
              }
            }
          }
          
          // 道路ドラッグ状態をリセット
          roadDragRef.current.isPlacing = false;
          roadDragRef.current.startTile = null;
          roadDragRef.current.endTile = null;
          // 通常のプレビューに戻す
          if (hoverRef.current) {
            drawPreviewLayer();
            drawEffectPreviewLayer();
          }
        }
        // 左クリックかつドラッグ開始ではない、かつ移動が小さい → クリック扱い
        else if (onTileClickRef.current && pressedButton === 0 && !wasDragging) {
          const distSq = (e.global.x - dragRef.current.downX) ** 2 + (e.global.y - dragRef.current.downY) ** 2;
          if (distSq <= 25) { // 5px以内
            const local = world.toLocal(new Point(e.global.x, e.global.y));
            const isoX = (local.x - offsetX);
            const isoY = (local.y - offsetY);
            const tile = fromIsometric(isoX, isoY);
            if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
              onTileClickRef.current({ x: tile.x, y: tile.y });
            }
          }
        }
      };

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

      // 施設テクスチャのプリロード
      const uniquePaths = Array.from(new Set(
        Object.values(FACILITY_DATA)
          .flatMap(f => f.imgPaths ?? [])
      ));
      
      if (uniquePaths.length > 0) {
        try {
          await Assets.load(uniquePaths);
          uniquePaths.forEach((p) => {
            const tex = Assets.get<Texture>(p);
            if (tex) texturesRef.current.set(p, tex);
          });
        }
        catch {
          // 読み込み失敗は無視（スプライトが出ないだけ）
        }
      }

      // 初期化完了フラグを設定
      isInitializedRef.current = true;
      
      // 初期化完了後に描画を更新
      drawTerrainLayer();
      drawFacilitiesLayer();
      drawPreviewLayer();
      drawEffectPreviewLayer();

      // ホイールでズーム（カーソル位置を基準に）
      const onWheel = (ev: WheelEvent) => {
        ev.preventDefault();
        // 直近のポインタ位置を優先してグローバル座標とする（Pixiの座標系）
        let globalPt: Point;
        if (lastPointerGlobalRef.current) {
          globalPt = lastPointerGlobalRef.current.clone();
        } else {
          const rect = (app.renderer.canvas as HTMLCanvasElement).getBoundingClientRect();
          const cssX = ev.clientX - rect.left;
          const cssY = ev.clientY - rect.top;
          const resolution = (app.renderer as any).resolution ?? 1;
          globalPt = new Point(cssX * resolution, cssY * resolution);
        }

        // ズーム前にカーソル直下のワールド座標を取得
        const beforeLocal = world.toLocal(globalPt);

        // スケール更新
        const delta = ev.deltaY > 0 ? -0.1 : 0.1;
        const oldScale = cameraRef.current.scale;
        const newScale = Math.max(0.5, Math.min(3, oldScale + delta));
        if (newScale === oldScale) return;
        cameraRef.current.scale = newScale;
        world.scale.set(newScale);

        // ズーム後に同じローカル点がどこに表示されるかを取得し、差分だけカメラ位置を補正
        const afterGlobal = world.toGlobal(beforeLocal);
        const dx = afterGlobal.x - globalPt.x;
        const dy = afterGlobal.y - globalPt.y;
        cameraRef.current.x -= dx;
        cameraRef.current.y -= dy;
        world.position.set(cameraRef.current.x, cameraRef.current.y);
      };
      canvas.addEventListener('wheel', onWheel, { passive: false });
      
      // 右クリック時のコンテキストメニューを無効化
      canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });

      // WASD/矢印キーでパン
      const onKeyDown = (e: KeyboardEvent) => {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
          keysRef.current[e.code] = true;
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
          keysRef.current[e.code] = false;
        }
      };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      const panSpeed = 8;
      const tickerFn = (ticker: any) => {
        const delta = ticker.deltaTime ?? 1;
        let dx = 0;
        let dy = 0;
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) dy += panSpeed * delta;
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) dy += -panSpeed * delta;
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) dx += panSpeed * delta;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) dx += -panSpeed * delta;
        if (dx !== 0 || dy !== 0) {
          cameraRef.current.x += dx;
          cameraRef.current.y += dy;
          world.position.set(cameraRef.current.x, cameraRef.current.y);
        }
      };
      app.ticker.add(tickerFn);

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
    };
  }, [size.width, size.height]);

  return (
    <div ref={containerRef} className="relative overflow-hidden border-2 border-blue-500" style={{ width: '100%', height: '100%' }} />
  );
};

export default PixiGrid;
