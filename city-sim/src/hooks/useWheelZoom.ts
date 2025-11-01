import { Point, Container } from 'pixi.js';

type MutableRef<T> = { current: T };

interface UseWheelZoomParams {
  appRef: MutableRef<any>;
  worldRef: MutableRef<Container | null>;
  cameraRef: MutableRef<{ x: number; y: number; scale: number }>;
  lastPointerGlobalRef: MutableRef<Point | null>;
}

export const useWheelZoom = ({ appRef, worldRef, cameraRef, lastPointerGlobalRef }: UseWheelZoomParams) => {
  // ホイールズーム用ハンドラを生成
  const createWheelHandler = () => (ev: WheelEvent): void => {
    const app = appRef.current;
    const world = worldRef.current;
    if (!app || !world) return;

    ev.preventDefault();

    // 直近のポインタ位置を優先してグローバル座標とする
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

  // リスナーの取り付け関数を返す
  const attachWheelZoom = (): ((ev: WheelEvent) => void) => {
    const app = appRef.current;
    if (!app) return () => {};
    const handler = createWheelHandler();
    (app.renderer.canvas as HTMLCanvasElement).addEventListener('wheel', handler, { passive: false });
    return handler;
  };

  return { attachWheelZoom };
};
