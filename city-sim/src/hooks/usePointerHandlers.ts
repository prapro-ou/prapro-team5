import { Point, Container, Graphics } from 'pixi.js';
import { ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../utils/coordinates';

type Position = { x: number; y: number };
type MutableRef<T> = { current: T };

interface CreatePointerHandlersParams {
  appStage: any;
  world: Container;
  hoverG: Graphics;
  size: { width: number; height: number };

  // Refs
  cameraRef: MutableRef<{ x: number; y: number; scale: number }>;
  dragRef: MutableRef<{ dragging: boolean; startX: number; startY: number; moved: boolean; button: number; downX: number; downY: number }>;
  keysRef: MutableRef<Record<string, boolean>>;
  lastPointerGlobalRef: MutableRef<Point | null>;
  hoverRef: MutableRef<Position | null>;
  roadDragRef: MutableRef<{ isPlacing: boolean; startTile: Position | null; endTile: Position | null }>;
  selectedFacilityTypeRef: MutableRef<string | null | undefined>;
  onTileClickRef: MutableRef<((pos: Position) => void) | undefined>;

  // Helpers
  updateHoverState: (gx: number, gy: number, hoverRef: MutableRef<Position | null>) => boolean;
  startRoadDrag: (gx: number, gy: number, roadDragRef: MutableRef<{ isPlacing: boolean; startTile: Position | null; endTile: Position | null }>) => boolean;
  updateRoadDrag: (gx: number, gy: number, roadDragRef: MutableRef<{ isPlacing: boolean; startTile: Position | null; endTile: Position | null }>) => boolean;
  getClickTile: (gx: number, gy: number) => Position | null;
  tileToIsometric: (tx: number, ty: number) => { x: number; y: number };

  // Draw callbacks
  drawPreviewLayer: () => void;
  drawEffectPreviewLayer: () => void;
  drawRoadDragRangeLayer: () => void;
  clearPreviews: () => void;
}

export function createPointerHandlers(params: CreatePointerHandlersParams) {
  const {
    appStage,
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
  } = params;

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
      appStage.cursor = 'grabbing';
    }
    else if (isLeft && selectedFacilityTypeRef.current) {
      // 道路のドラッグ開始処理
      if (selectedFacilityTypeRef.current === 'road') {
        if (startRoadDrag(e.global.x, e.global.y, roadDragRef)) {
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
      if (updateRoadDrag(e.global.x, e.global.y, roadDragRef)) {
        drawRoadDragRangeLayer();
      }
      return;
    }

    // ホバー更新（ドラッグしていない時）
    const changed = updateHoverState(e.global.x, e.global.y, hoverRef);
    if (changed) {
      if (hoverRef.current) {
        // 再描画
        hoverG.clear();
        const { x: hIsoX, y: hIsoY } = tileToIsometric(hoverRef.current.x, hoverRef.current.y);
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
      } else {
        hoverG.clear();
        // プレビューもクリア
        clearPreviews();
      }
    }
  };

  const onPointerUp = (e: any) => {
    lastPointerGlobalRef.current = new Point(e.global.x, e.global.y);
    const wasDragging = dragRef.current.dragging;
    const pressedButton = dragRef.current.button;

    dragRef.current.dragging = false;
    appStage.cursor = 'grab';

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
        const tile = getClickTile(e.global.x, e.global.y);
        if (tile) {
          onTileClickRef.current(tile);
        }
      }
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}


