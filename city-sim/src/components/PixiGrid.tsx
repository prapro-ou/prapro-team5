import React, { useEffect, useRef } from 'react';
import type { Position, GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Application, Graphics, Container, Point } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT, fromIsometric } from '../utils/coordinates';

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
export const PixiGrid: React.FC<PixiGridProps> = ({ size, onTileClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldRef = useRef<Container | null>(null);
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, moved: false });

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
      // init 完了後にのみ参照を保存
      appRef.current = app;
      didInit = true;

      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      const g = new Graphics();
      world.addChild(g);

      const offsetX = width / 2;
      const offsetY = 120;
      const maxX = Math.min(size.width, 20);
      const maxY = Math.min(size.height, 20);

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
        dragRef.current.dragging = true;
        dragRef.current.moved = false;
        dragRef.current.startX = e.global.x;
        dragRef.current.startY = e.global.y;
        app.stage.cursor = 'grabbing';
      };
      const onPointerMove = (e: any) => {
        if (!dragRef.current.dragging) return;
        const dx = e.global.x - dragRef.current.startX;
        const dy = e.global.y - dragRef.current.startY;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragRef.current.moved = true;
        dragRef.current.startX = e.global.x;
        dragRef.current.startY = e.global.y;
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
        world.position.set(cameraRef.current.x, cameraRef.current.y);
      };
      const onPointerUp = (e: any) => {
        const wasDragging = dragRef.current.dragging;
        const moved = dragRef.current.moved;
        dragRef.current.dragging = false;
        app.stage.cursor = 'grab';

        if (onTileClick && wasDragging && !moved) {
          const local = world.toLocal(new Point(e.global.x, e.global.y));
          const isoX = (local.x - offsetX) / cameraRef.current.scale;
          const isoY = (local.y - offsetY) / cameraRef.current.scale;
          const tile = fromIsometric(isoX, isoY);
          if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
            onTileClick({ x: tile.x, y: tile.y });
          }
        }
      };
      app.stage.on('pointerdown', onPointerDown);
      app.stage.on('pointermove', onPointerMove);
      app.stage.on('pointerup', onPointerUp);

      // ホイールでズーム
      const onWheel = (ev: WheelEvent) => {
        ev.preventDefault();
        const delta = ev.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(3, cameraRef.current.scale + delta));
        cameraRef.current.scale = newScale;
        world.scale.set(newScale);
      };
      canvas.addEventListener('wheel', onWheel, { passive: false });

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
    };

    init();

    return () => {
      const app = appRef.current;
      appRef.current = null;
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
          if (pd) app.stage.off('pointerdown', pd);
          if (pm) app.stage.off('pointermove', pm);
          if (pu) app.stage.off('pointerup', pu);
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
