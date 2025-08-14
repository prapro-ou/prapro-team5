import React from 'react';
import type { Position } from '../types/grid';
import { screenToGrid, getViewportBounds } from '../utils/coordinates';

interface UseGridCoordinatesProps {
  camera: { x: number; y: number };
  mapOffsetX: number;
  mapOffsetY: number;
  gridSize: { width: number; height: number };
}

export const useGridCoordinates = ({ 
  camera, 
  mapOffsetX, 
  mapOffsetY, 
  gridSize 
}: UseGridCoordinatesProps) => {
  
  // マウス座標からグリッド座標への変換
  const mouseToGrid = React.useCallback((
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

  // ビューポート内の可視タイルを計算
  const getVisibleTiles = React.useCallback((
    viewportWidth: number,
    viewportHeight: number
  ) => {
    const bounds = getViewportBounds(
      viewportWidth,
      viewportHeight,
      camera.x,
      camera.y,
      mapOffsetX,
      mapOffsetY
    );
    
    const tiles = [];
    const startX = Math.max(0, bounds.minX - 1);
    const endX = Math.min(gridSize.width, bounds.maxX + 2);
    const startY = Math.max(0, bounds.minY - 1);
    const endY = Math.min(gridSize.height, bounds.maxY + 2);
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        tiles.push({ x, y });
      }
    }
    
    return tiles;
  }, [camera, mapOffsetX, mapOffsetY, gridSize]);

  return {
    mouseToGrid,
    getVisibleTiles
  };
}; 