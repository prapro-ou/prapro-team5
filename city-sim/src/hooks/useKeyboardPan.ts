import { Container } from 'pixi.js';

type MutableRef<T> = { current: T };

interface UseKeyboardPanParams {
  appRef: MutableRef<any>;
  worldRef: MutableRef<Container | null>;
  cameraRef: MutableRef<{ x: number; y: number; scale: number }>;
  keysRef: MutableRef<Record<string, boolean>>;
}

export const useKeyboardPan = ({ appRef, worldRef, cameraRef, keysRef }: UseKeyboardPanParams) => {
  const panSpeed = 8;

  // キーボードイベントハンドラを作成
  const createKeyHandlers = () => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
        keysRef.current[e.code] = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
        keysRef.current[e.code] = false;
      }
    };

    return { onKeyDown, onKeyUp };
  };

  // パン処理のticker関数を作成
  const createTickerFn = () => (ticker: any) => {
    const world = worldRef.current;
    if (!world) return;

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

  // イベントリスナーの登録関数
  const attachKeyboardPan = () => {
    const { onKeyDown, onKeyUp } = createKeyHandlers();
    const tickerFn = createTickerFn();
    
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // appが利用可能になったらtickerを追加
    const addTicker = () => {
      const app = appRef.current;
      if (app) {
        app.ticker.add(tickerFn);
      }
    };
    
    // 即座に追加を試行
    addTicker();

    return { onKeyDown, onKeyUp, tickerFn, addTicker };
  };

  return { attachKeyboardPan };
};
