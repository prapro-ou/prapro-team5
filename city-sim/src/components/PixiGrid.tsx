import React, { useEffect, useRef } from 'react';
import type { Position, GridSize } from '../types/grid';
import type { Facility, FacilityType } from '../types/facility';
import { Application, Graphics } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../utils/coordinates';

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
export const PixiGrid: React.FC<PixiGridProps> = ({ size }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

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

      const g = new Graphics();
      app.stage.addChild(g);

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

      const handleResize = () => {
        const w = Math.min(window.innerWidth, 1280);
        const h = Math.min(window.innerHeight, 720);
        app.renderer.resize(w, h);
      };
      window.addEventListener('resize', handleResize);
      // クリーンアップで外せるように、関数をref経由で保持
      (app as any).__handleResize = handleResize;
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
