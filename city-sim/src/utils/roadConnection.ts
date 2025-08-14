import type { Facility } from '../types/facility';

export interface RoadConnection {
  type: 'cross' | 't-junction' | 'turn' | 'horizontal' | 'vertical' | 'end' | 'isolated';
  variantIndex: number;
  rotation: number;
  flip: boolean;
}

export const getRoadConnectionType = (
  facilityMap: Map<string, Facility>, 
  x: number, 
  y: number
): RoadConnection => {
  const left  = facilityMap.get(`${x-1}-${y}`)?.type === 'road';
  const right = facilityMap.get(`${x+1}-${y}`)?.type === 'road';
  const up    = facilityMap.get(`${x}-${y-1}`)?.type === 'road';
  const down  = facilityMap.get(`${x}-${y+1}`)?.type === 'road';
  const leftUp  = facilityMap.get(`${x-1}-${y-1}`)?.type === 'road';
  const rightUp = facilityMap.get(`${x+1}-${y-1}`)?.type === 'road';
  const leftDown = facilityMap.get(`${x-1}-${y+1}`)?.type === 'road';
  const rightDown = facilityMap.get(`${x+1}-${y+1}`)?.type === 'road';

  const connections = [left, right, up, down].filter(Boolean).length;

  // 十字路
  if (left && right && up && down) {
    return { type: 'cross', variantIndex: 1, rotation: 0, flip: false };
  }
  
  // T字路
  if (connections >= 1) {
    if (left && leftUp && leftDown) return { type: 't-junction', variantIndex: 5, rotation: 0, flip: true };
    if (right && rightUp && rightDown) return { type: 't-junction', variantIndex: 5, rotation: 180, flip: true};
    if (up && leftUp && rightUp) return { type: 't-junction', variantIndex: 4, rotation: 0, flip: false};
    if (down && leftDown && rightDown) return { type: 't-junction', variantIndex: 4, rotation: 180, flip: false};
  }
  
  // カーブ
  if (connections === 2) {
    if (right && up) return { type: 'turn', variantIndex: 2, rotation: 0, flip: true };
    if (left && down) return { type: 'turn', variantIndex: 2, rotation: 0, flip: false };
    if (right && down) return { type: 'turn', variantIndex: 3, rotation: 180, flip: false };
    if (left && up) return { type: 'turn', variantIndex: 3, rotation: 0, flip: false };
  }
  
  // 直線
  if (left && right) {
    return { type: 'horizontal', variantIndex: 0, rotation: 180, flip: true };
  }
  if (up && down) {
    return { type: 'vertical', variantIndex: 0, rotation: 0, flip: false };
  }
  
  // 端
  if (left) return { type: 'end', variantIndex: 0, rotation: 180, flip: true };
  if (right) return { type: 'end', variantIndex: 0, rotation: 180, flip: true };
  if (up) return { type: 'end', variantIndex: 0, rotation: 0, flip: false };
  if (down) return { type: 'end', variantIndex: 0, rotation: 0, flip: false };
  
  // 孤立
  return { type: 'isolated', variantIndex: 0, rotation: 0, flip: false };
};
