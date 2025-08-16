import React from 'react';
import type { Position } from '../types/grid';
import type { FacilityType } from '../types/facility';

interface UseMouseEventsProps {
  // 施設配置関連
  handleFacilityMouseDown: (e: React.MouseEvent, element: HTMLElement) => void;
  handleFacilityMouseMove: (e: React.MouseEvent, element: HTMLElement) => void;
  handleFacilityMouseUp: () => void;
  cancelPlacement: () => void;
  isPlacingFacility: boolean;
  
  // カメラドラッグ関連
  startDrag: (clientX: number, clientY: number) => void;
  updateDrag: (clientX: number, clientY: number) => void;
  endDrag: () => void;
  isDragging: boolean;
  
  // その他
  mouseToGrid: (mouseX: number, mouseY: number, element: HTMLElement) => Position | null;
  selectedFacilityType: FacilityType | null;
  debouncedSetHover: (position: Position | null) => void;
}

export const useMouseEvents = ({
  handleFacilityMouseDown,
  handleFacilityMouseMove,
  handleFacilityMouseUp,
  cancelPlacement,
  isPlacingFacility,
  startDrag,
  updateDrag,
  endDrag,
  isDragging,
  mouseToGrid,
  selectedFacilityType,
  debouncedSetHover
}: UseMouseEventsProps) => {

  // マウスダウン処理
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    // 施設配置の処理
    handleFacilityMouseDown(e, e.currentTarget as HTMLElement);
    
    // 右クリックでカメラドラッグ&敷設キャンセル
    if (e.button === 2) {
      if (isPlacingFacility) {
        cancelPlacement();
      }
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    }
  }, [handleFacilityMouseDown, isPlacingFacility, cancelPlacement, startDrag]);

  // マウスムーブ処理
  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    // 施設配置の処理
    handleFacilityMouseMove(e, e.currentTarget as HTMLElement);
    
    // ホバー処理
    const gridPos = mouseToGrid(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    if (selectedFacilityType && gridPos) {
      debouncedSetHover(gridPos);
    }

    // カメラドラッグ中
    if (isDragging) {
      updateDrag(e.clientX, e.clientY);
    }
  }, [handleFacilityMouseMove, mouseToGrid, selectedFacilityType, debouncedSetHover, isDragging, updateDrag]);

  // マウスアップ処理
  const handleMouseUp = React.useCallback(() => {
    // 施設配置の確定
    handleFacilityMouseUp();
    
    // カメラドラッグの終了
    endDrag();
  }, [handleFacilityMouseUp, endDrag]);

  // グローバルマウスイベントの管理
  React.useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      updateDrag(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      endDrag();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updateDrag, endDrag]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
