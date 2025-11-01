import React from 'react';
import type { GridSize } from '../types/grid';
import { toIsometric, ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../utils/coordinates';

export interface Camera {
  x: number;
  y: number;
}

interface UseCameraProps {
  size: GridSize;
  viewportWidth: number;
  viewportHeight: number;
  mapOffsetX: number;
  mapOffsetY: number;
}

export const useCamera = ({ 
  size, 
  viewportWidth, 
  viewportHeight, 
  mapOffsetX, 
  mapOffsetY 
}: UseCameraProps) => {
  // カメラの初期位置を計算（マップ中心）
  const getInitialCamera = (): Camera => {
    const centerGridX = size.width / 2;
    const centerGridY = size.height / 2;
    
    const centerIso = toIsometric(centerGridX, centerGridY);
    
    return {
      x: centerIso.x + mapOffsetX - viewportWidth / 2,
      y: centerIso.y + mapOffsetY - viewportHeight / 2
    };
  };

  const [camera, setCamera] = React.useState<Camera>(getInitialCamera);

  // カメラの境界値を計算
  const getCameraBounds = () => {
    const mapWidth = (size.width + size.height) * ISO_TILE_WIDTH;
    const mapHeight = (size.width + size.height) * ISO_TILE_HEIGHT;
    
    return {
      maxX: Math.max(0, mapWidth - viewportWidth + mapOffsetX),
      maxY: Math.max(0, mapHeight - viewportHeight + mapOffsetY),
      minX: -mapOffsetX,
      minY: -mapOffsetY
    };
  };

  // カメラを指定位置に移動
  const moveCamera = (deltaX: number, deltaY: number) => {
    const bounds = getCameraBounds();
    
    setCamera(prev => ({
      x: Math.max(bounds.minX, Math.min(bounds.maxX, prev.x + deltaX)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, prev.y + deltaY))
    }));
  };

  // キーボードによるカメラ移動
  const handleKeyboardMove = React.useCallback((e: KeyboardEvent) => {
    const scrollSpeed = 64;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        moveCamera(0, -scrollSpeed);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        moveCamera(0, scrollSpeed);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        moveCamera(-scrollSpeed, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        moveCamera(scrollSpeed, 0);
        break;
    }
  }, []);

  // キーボードイベントの登録
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyboardMove);
    return () => window.removeEventListener('keydown', handleKeyboardMove);
  }, [handleKeyboardMove]);

  return {
    camera,
    setCamera,
    moveCamera,
    getCameraBounds
  };
};
