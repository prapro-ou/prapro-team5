import React from 'react';
import type { Position } from '../types/grid';
import type { FacilityType } from '../types/facility';
import { getFacilityRegistry } from '../utils/facilityLoader';

interface UseFacilityPlacementProps {
  size: { width: number; height: number };
  selectedFacilityType: FacilityType | null;
  mouseToGrid: (mouseX: number, mouseY: number, element: HTMLElement) => Position | null;
  onTileClick: (x: number, y: number) => void;
}

export const useFacilityPlacement = ({
  size,
  selectedFacilityType,
  mouseToGrid,
  onTileClick
}: UseFacilityPlacementProps) => {
  // 施設敷設用の状態管理
  const [isPlacingFacility, setIsPlacingFacility] = React.useState(false);
  const [dragStartTile, setDragStartTile] = React.useState<Position | null>(null);
  const [dragEndTile, setDragEndTile] = React.useState<Position | null>(null);

  // ドラッグ範囲の計算
  const dragRange = React.useMemo(() => {
    if (!isPlacingFacility || !dragStartTile || !dragEndTile) return new Set<string>();
    
    const tiles = new Set<string>();
    
    // 直線一列のみの敷設
    const dx = Math.abs(dragEndTile.x - dragStartTile.x);
    const dy = Math.abs(dragEndTile.y - dragStartTile.y);
    
    // X軸方向の直線
    if (dx > dy) {
      const startX = Math.min(dragStartTile.x, dragEndTile.x);
      const endX = Math.max(dragStartTile.x, dragEndTile.x);
      const y = dragStartTile.y;
      
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.add(`${x}-${y}`);
        }
      }
    }
    // Y軸方向の直線
    else {
      const startY = Math.min(dragStartTile.y, dragEndTile.y);
      const endY = Math.max(dragStartTile.y, dragEndTile.y);
      const x = dragStartTile.x;
      
      for (let y = startY; y <= endY; y++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          tiles.add(`${x}-${y}`);
        }
      }
    }
    
    return tiles;
  }, [isPlacingFacility, dragStartTile, dragEndTile, size]);

  // 施設配置開始
  const startPlacement = (gridPos: Position) => {
    if (!selectedFacilityType) return false;
    
    const facilityData = getFacilityRegistry()[selectedFacilityType];
    if (facilityData.category === 'infrastructure') {
      setIsPlacingFacility(true);
      setDragStartTile(gridPos);
      setDragEndTile(gridPos);
      return true;
    }
    return false;
  };

  // 施設配置更新（ドラッグ中）
  const updatePlacement = (gridPos: Position) => {
    if (isPlacingFacility && dragStartTile) {
      setDragEndTile(gridPos);
    }
  };

  // 施設配置確定
  const confirmPlacement = () => {
    if (!isPlacingFacility || !dragStartTile || !dragEndTile) return;
    
    const dx = Math.abs(dragEndTile.x - dragStartTile.x);
    const dy = Math.abs(dragEndTile.y - dragStartTile.y);
    
    // X軸方向
    if (dx > dy) {
      const startX = Math.min(dragStartTile.x, dragEndTile.x);
      const endX = Math.max(dragStartTile.x, dragEndTile.x);
      const y = dragStartTile.y;
      
      for (let x = startX; x <= endX; x++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          onTileClick(x, y);
        }
      }
    }
    // Y軸方向
    else {
      const startY = Math.min(dragStartTile.y, dragEndTile.y);
      const endY = Math.max(dragStartTile.y, dragEndTile.y);
      const x = dragStartTile.x;
      
      for (let y = startY; y <= endY; y++) {
        if (x >= 0 && x < size.width && y >= 0 && y < size.height) {
          onTileClick(x, y);
        }
      }
    }
    
    // 状態をリセット
    setIsPlacingFacility(false);
    setDragStartTile(null);
    setDragEndTile(null);
  };

  // 施設配置キャンセル
  const cancelPlacement = () => {
    setIsPlacingFacility(false);
    setDragStartTile(null);
    setDragEndTile(null);
  };

  // マウスダウン処理
  const handleMouseDown = (e: React.MouseEvent, element: HTMLElement) => {
    if (e.button === 0 && selectedFacilityType) {
      e.preventDefault();
      const gridPos = mouseToGrid(e.clientX, e.clientY, element);
      if (gridPos) {
        if (!startPlacement(gridPos)) {
          // インフラ施設でない場合は直接クリック
          onTileClick(gridPos.x, gridPos.y);
        }
      }
    }
  };

  // マウスムーブ処理
  const handleMouseMove = (e: React.MouseEvent, element: HTMLElement) => {
    const gridPos = mouseToGrid(e.clientX, e.clientY, element);
    if (gridPos) {
      updatePlacement(gridPos);
    }
  };

  // マウスアップ処理
  const handleMouseUp = () => {
    if (isPlacingFacility) {
      confirmPlacement();
    }
  };

  return {
    // 状態
    isPlacingFacility,
    dragStartTile,
    dragEndTile,
    dragRange,
    
    // アクション
    startPlacement,
    updatePlacement,
    confirmPlacement,
    cancelPlacement,
    
    // イベントハンドラー
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}; 