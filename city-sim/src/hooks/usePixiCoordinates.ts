import { Point } from 'pixi.js';
import { fromIsometric, ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../utils/coordinates';
import type { GridSize } from '../types/grid';

interface CoordinateHelpersProps {
  size: GridSize;
  worldRef: React.MutableRefObject<any>;
  offsetsRef: React.MutableRefObject<{ offsetX: number; offsetY: number }>;
}

export const usePixiCoordinates = ({
  size,
  worldRef,
  offsetsRef
}: CoordinateHelpersProps) => {
  
  // グローバル座標からタイル座標に変換
  const globalToTile = (globalX: number, globalY: number): { x: number; y: number } | null => {
    if (!worldRef.current) return null;
    
    const local = worldRef.current.toLocal(new Point(globalX, globalY));
    const { offsetX, offsetY } = offsetsRef.current;
    const isoX = (local.x - offsetX);
    const isoY = (local.y - offsetY);
    const tile = fromIsometric(isoX, isoY);
    
    // グリッド範囲内かチェック
    if (tile.x >= 0 && tile.x < size.width && tile.y >= 0 && tile.y < size.height) {
      return tile;
    }
    
    return null;
  };

  // タイル座標からアイソメトリック座標に変換
  const tileToIsometric = (tileX: number, tileY: number): { x: number; y: number } => {
    const { offsetX, offsetY } = offsetsRef.current;
    return {
      x: (tileX - tileY) * (ISO_TILE_WIDTH / 2) + offsetX,
      y: (tileX + tileY) * (ISO_TILE_HEIGHT / 2) + offsetY
    };
  };

  // タイルがグリッド範囲内かチェック
  const isTileInBounds = (tileX: number, tileY: number): boolean => {
    return tileX >= 0 && tileX < size.width && tileY >= 0 && tileY < size.height;
  };

  // ホバー状態の更新（座標計算と状態更新を分離）
  const updateHoverState = (
    globalX: number, 
    globalY: number, 
    hoverRef: React.MutableRefObject<{ x: number; y: number } | null>
  ): boolean => {
    const tile = globalToTile(globalX, globalY);
    
    if (tile) {
      const changed = !hoverRef.current || 
        hoverRef.current.x !== tile.x || 
        hoverRef.current.y !== tile.y;
      
      if (changed) {
        hoverRef.current = { x: tile.x, y: tile.y };
        return true; // 変更があった
      }
      return false; // 変更なし
    }
    else {
      if (hoverRef.current !== null) {
        hoverRef.current = null;
        return true; // 変更があった（クリア）
      }
      return false; // 変更なし
    }
  };

  // 道路ドラッグの開始位置を設定
  const startRoadDrag = (
    globalX: number, 
    globalY: number, 
    roadDragRef: React.MutableRefObject<{
      isPlacing: boolean;
      startTile: { x: number; y: number } | null;
      endTile: { x: number; y: number } | null;
    }>
  ): boolean => {
    const tile = globalToTile(globalX, globalY);
    
    if (tile) {
      roadDragRef.current.isPlacing = true;
      roadDragRef.current.startTile = { x: tile.x, y: tile.y };
      roadDragRef.current.endTile = { x: tile.x, y: tile.y };
      return true;
    }
    
    return false;
  };

  // 道路ドラッグの終了位置を更新
  const updateRoadDrag = (
    globalX: number, 
    globalY: number, 
    roadDragRef: React.MutableRefObject<{
      isPlacing: boolean;
      startTile: { x: number; y: number } | null;
      endTile: { x: number; y: number } | null;
    }>
  ): boolean => {
    if (!roadDragRef.current.isPlacing) return false;
    
    const tile = globalToTile(globalX, globalY);
    
    if (tile) {
      roadDragRef.current.endTile = { x: tile.x, y: tile.y };
      return true;
    }
    
    return false;
  };

  // クリック位置のタイル座標を取得
  const getClickTile = (globalX: number, globalY: number): { x: number; y: number } | null => {
    return globalToTile(globalX, globalY);
  };

  return {
    globalToTile,
    tileToIsometric,
    isTileInBounds,
    updateHoverState,
    startRoadDrag,
    updateRoadDrag,
    getClickTile
  };
};
