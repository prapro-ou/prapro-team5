import React, { useEffect, useRef } from 'react';
import type { Position, GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Application, Graphics, Container, Point, Assets, Sprite, Texture } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT, fromIsometric } from '../utils/coordinates';
import { FACILITY_DATA } from '../types/facility';

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
export const PixiGrid: React.FC<PixiGridProps> = ({ size, onTileClick, facilities = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, moved: false, button: 0, downX: 0, downY: 0 });
  const keysRef = useRef<{ [code: string]: boolean }>({});
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerGlobalRef = useRef<Point | null>(null);
  const facilitiesLayerRef = useRef<Container | null>(null);
  const texturesRef = useRef<Map<string, Texture>>(new Map());
  const offsetsRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });
  const isInitializedRef = useRef(false);
  const onTileClickRef = useRef<((position: Position) => void) | undefined>(onTileClick);

  // 施設描画関数
  const drawFacilities = () => {
    if (!facilitiesLayerRef.current || !isInitializedRef.current) return;
    
    const layer = facilitiesLayerRef.current;
    layer.removeChildren();
    const { offsetX, offsetY } = offsetsRef.current;
    
    facilities
      .map(f => {
        const data = FACILITY_DATA[f.type];
        const imgPath = data.imgPaths?.[f.variantIndex ?? 0] ?? data.imgPaths?.[0];
        const texture = imgPath ? texturesRef.current.get(imgPath) : undefined;
        return { f, data, texture };
      })
      .filter(x => !!x.texture)
      .forEach(({ f, data, texture }) => {
        if (!texture) return;
        const center = f.position;
        const isoX = (center.x - center.y) * (ISO_TILE_WIDTH / 2) + offsetX;
        const isoY = (center.x + center.y) * (ISO_TILE_HEIGHT / 2) + offsetY;
        const sprite = new Sprite(texture);
        
        // 画像サイズが分かる場合は中央寄せ。なければそのまま
        const size = data.imgSizes?.[0];
        if (size) {
          sprite.anchor.set(0.5, 1.0);
          sprite.x = isoX + ISO_TILE_WIDTH / 2;
          sprite.y = isoY + (ISO_TILE_HEIGHT / 2) + ISO_TILE_HEIGHT * Math.floor(data.size / 2);
          sprite.width = size.width;
          sprite.height = size.height;
        }
        else {
          sprite.x = isoX;
          sprite.y = isoY;
        }
        
        // 簡易Z-index
        sprite.zIndex = isoY;
        layer.addChild(sprite);
      });
  };

  // onTileClickRefを最新の値に更新
  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);

  // 施設描画の更新
  useEffect(() => {
    drawFacilities();
  }, [facilities]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
        
        if (shouldDrag) app.stage.cursor = 'grabbing';
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
          }
        }
        else {
          hoverRef.current = null;
          hoverG.clear();
        }
      };

      const onPointerUp = (e: any) => {
        lastPointerGlobalRef.current = new Point(e.global.x, e.global.y);
        const wasDragging = dragRef.current.dragging;
        // const moved = dragRef.current.moved;
        const pressedButton = dragRef.current.button;
        
        dragRef.current.dragging = false;
        app.stage.cursor = 'grab';

        // 左クリックかつドラッグ開始ではない、かつ移動が小さい → クリック扱い
        if (onTileClickRef.current && pressedButton === 0 && !wasDragging) {
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

      // 施設用レイヤ
      const facilitiesLayer = new Container();
      facilitiesLayer.sortableChildren = true;
      world.addChild(facilitiesLayer);
      facilitiesLayerRef.current = facilitiesLayer;

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
      (app as any).__ptrLeave = () => { hoverRef.current = null; hoverG.clear(); };
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
