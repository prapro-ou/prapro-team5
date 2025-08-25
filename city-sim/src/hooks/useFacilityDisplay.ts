import React from 'react';
import type { Facility } from '../types/facility';
import { FACILITY_DATA } from '../types/facility';
import { toIsometric } from '../utils/coordinates';
import { getRoadConnectionType } from '../utils/roadConnection';

interface UseFacilityDisplayProps {
  facilityMap: Map<string, Facility>;
  MAP_OFFSET_X: number;
  MAP_OFFSET_Y: number;
}

export const useFacilityDisplay = ({
  facilityMap,
}: UseFacilityDisplayProps) => {

  // 施設の画像情報を取得
  const getFacilityImageData = React.useCallback((facility: Facility) => {
    const facilityData = FACILITY_DATA[facility.type];
    const idx = facility.variantIndex ?? 0;
    const size = facilityData.size;
    const imgPath = facilityData.imgPaths?.[idx] ?? "";
    const imgSize = facilityData.imgSizes?.[idx] ?? { width: 96, height: 79 };
    
    return { imgPath, imgSize, size };
  }, []);

  // 道路接続の画像情報を取得
  const getRoadImageData = React.useCallback((facility: Facility, x: number, y: number) => {
    const connection = getRoadConnectionType(facilityMap, x, y);
    const facilityData = FACILITY_DATA[facility.type];
    
    const imgPath = facilityData.imgPaths?.[connection.variantIndex] ?? "";
    const imgSize = facilityData.imgSizes?.[connection.variantIndex] ?? { width: 32, height: 16 };
    
    // 変形情報の計算
    let transform = undefined;
    switch (connection.type) {
      case 'cross':
        break;
      case 't-junction':
        transform = `rotate(${connection.rotation}deg)`;
        if (connection.flip) {
          transform += ' scaleX(-1)';
        }
        break;
      case 'turn':
        transform = `rotate(${connection.rotation}deg)`;
        if (connection.flip) {
          transform += ' scaleX(-1)';
        }
        break;
      case 'horizontal':
      case 'vertical':
      case 'end':
      case 'isolated':
        if (connection.rotation !== 0) {
          transform = `rotate(${connection.rotation}deg)`;
        }
        if (connection.flip) {
          transform += ' scaleX(-1)';
        }
        break;
    }
    
    return { imgPath, imgSize, transform };
  }, [facilityMap]);

  // 施設中心判定
  const isFacilityCenter = React.useCallback((facility: Facility, x: number, y: number): boolean => {
    return facility.position.x === x && facility.position.y === y;
  }, []);

  // z-indexの計算
  const calculateZIndex = React.useCallback((x: number, y: number, offset: number = 0): number => {
    const baseZ = (x + y) * 100 + x;
    return Math.floor(baseZ + offset);
  }, []);

  // 施設サイズを考慮したZ-index計算
  const calculateFacilityZIndex = React.useCallback((facility: Facility): number => {
    const facilityData = FACILITY_DATA[facility.type];
    const size = facilityData.size;
    
    // 大きい施設の場合は、最も手前のタイルのZ-indexを使用
    // これにより、大きい施設が小さい施設の上に正しく表示される
    const frontTileX = facility.position.x + Math.floor(size / 2);
    const frontTileY = facility.position.y + Math.floor(size / 2);
    
    return calculateZIndex(frontTileX, frontTileY);
  }, [calculateZIndex]);

  // アイソメトリック位置の計算
  const getIsometricPosition = React.useCallback((x: number, y: number) => {
    return toIsometric(x, y);
  }, []);

  return {
    getFacilityImageData,
    getRoadImageData,
    isFacilityCenter,
    calculateZIndex,
    calculateFacilityZIndex,
    getIsometricPosition
  };
};
