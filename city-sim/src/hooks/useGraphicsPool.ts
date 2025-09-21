import { useRef } from 'react';
import { Graphics } from 'pixi.js';

// Graphicsオブジェクトのプール管理フック
export const useGraphicsPool = () => {
  const graphicsPoolRef = useRef<Graphics[]>([]);

  const getPooledGraphics = (): Graphics => {
    const pool = graphicsPoolRef.current;
    if (pool.length > 0) {
      const g = pool.pop()!;
      g.clear();
      return g;
    }
    return new Graphics();
  };

  const returnGraphics = (g: Graphics): void => {
    g.clear();
    graphicsPoolRef.current.push(g);
  };

  const clearPool = (): void => {
    graphicsPoolRef.current.forEach(g => g.destroy());
    graphicsPoolRef.current = [];
  };

  return {
    getPooledGraphics,
    returnGraphics,
    clearPool
  };
};
