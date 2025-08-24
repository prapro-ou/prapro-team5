import React, { useCallback } from 'react';
import type { Position } from '../types/grid';
import type { Camera } from './useCamera';
import { screenToGrid } from '../utils/coordinates';

interface UseGridCoordinatesProps {
  camera: Camera;
  getCameraBounds: () => { maxX: number; maxY: number; minX: number; minY: number };
  mapOffsetX: number;
  mapOffsetY: number;
  gridSize: { width: number; height: number };
}

export const useGridCoordinates = ({ 
  camera, 
  getCameraBounds, 
  mapOffsetX, 
  mapOffsetY, 
  gridSize 
}: UseGridCoordinatesProps) => {
  
  // マウス座標からグリッド座標への変換
  const mouseToGrid = useCallback((
    mouseX: number, 
    mouseY: number, 
    element: HTMLElement
  ): Position | null => {
    const rect = element.getBoundingClientRect();
    const relativeX = mouseX - rect.left;
    const relativeY = mouseY - rect.top;
    
    const gridPos = screenToGrid(
      relativeX, 
      relativeY, 
      camera.x, 
      camera.y,
      mapOffsetX,
      mapOffsetY
    );
    
    // グリッド境界内かチェック
    if (gridPos.x >= 0 && gridPos.x < gridSize.width && 
        gridPos.y >= 0 && gridPos.y < gridSize.height) {
      return gridPos;
    }
    
    return null;
  }, [camera, mapOffsetX, mapOffsetY, gridSize]);

  // カメラ内のタイルのみを取得する関数
  const getVisibleTilesInCamera = useCallback(() => {
    const cameraBounds = getCameraBounds();
    
    // カメラの表示範囲を少し拡張（タイルが途中で切れるのを防ぐ）
    const buffer = 100;
    const left = Math.max(0, Math.floor((cameraBounds.minX - buffer) / 16)); // ISO_TILE_WIDTH
    const right = Math.min(gridSize.width, Math.ceil((cameraBounds.maxX + buffer) / 16)); // ISO_TILE_WIDTH
    const top = Math.max(0, Math.floor((cameraBounds.minY - buffer) / 16)); // ISO_TILE_HEIGHT
    const bottom = Math.min(gridSize.height, Math.ceil((cameraBounds.maxY + buffer) / 16)); // ISO_TILE_HEIGHT
    
    const tiles: Position[] = [];
    for (let x = left; x < right; x++) {
      for (let y = top; y < bottom; y++) {
        tiles.push({ x, y });
      }
    }
    
    return tiles;
  }, [getCameraBounds, gridSize.width, gridSize.height]);

  const getVisibleTiles = useCallback(() => {
    return getVisibleTilesInCamera();
  }, [getVisibleTilesInCamera]);

  // カメラ境界内かチェック
  const isWithinCameraBounds = React.useCallback((x: number, y: number): boolean => {
    const bounds = getCameraBounds();
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
  }, [getCameraBounds]);

  return {
    mouseToGrid,
    getVisibleTiles,
    getVisibleTilesInCamera,
    isWithinCameraBounds
  };
};
