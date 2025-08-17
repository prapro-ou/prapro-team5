import React from 'react';
import type { Camera } from './useCamera';

interface UseMouseDragProps {
  camera: Camera;
  setCamera: (camera: Camera) => void;
  getCameraBounds: () => { maxX: number; maxY: number; minX: number; minY: number };
}

export const useMouseDrag = ({ camera, setCamera, getCameraBounds }: UseMouseDragProps) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [dragStartCamera, setDragStartCamera] = React.useState({ x: 0, y: 0 });

  // ドラッグ開始
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragStartCamera({ x: camera.x, y: camera.y });
  };

  // ドラッグ中
  const updateDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    const bounds = getCameraBounds();

    const newCameraX = Math.max(bounds.minX, Math.min(bounds.maxX, dragStartCamera.x - deltaX));
    const newCameraY = Math.max(bounds.minY, Math.min(bounds.maxY, dragStartCamera.y - deltaY));

    setCamera({ x: newCameraX, y: newCameraY });
  };

  // ドラッグ終了
  const endDrag = () => {
    setIsDragging(false);
  };

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
  }, [isDragging, dragStart, dragStartCamera, updateDrag]);

  return {
    isDragging,
    startDrag,
    updateDrag,
    endDrag
  };
};
