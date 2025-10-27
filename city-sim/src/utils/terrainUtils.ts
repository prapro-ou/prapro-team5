// 高さ地形システムのユーティリティ関数

import type { HeightLevel, CornerHeights, HeightTerrainTile, SlopeInfo } from '../types/terrainWithHeight';

// 斜面を判定
export const isSlope = (cornerHeights: CornerHeights): boolean => {
  const firstHeight = cornerHeights[0];
  return cornerHeights.some(height => height !== firstHeight);
};

// 斜面情報を分析
export const analyzeSlope = (cornerHeights: CornerHeights): SlopeInfo => {
  const maxHeight = Math.max(...cornerHeights);
  const minHeight = Math.min(...cornerHeights);
  const heightDifference = maxHeight - minHeight;
  
  if (heightDifference === 0) {
    return { 
      isSlope: false, 
      slopeDirection: 'none', 
      heightDifference: 0 
    };
  }
  
  // 斜面の方向を判定
  const [topLeft, topRight, bottomRight, bottomLeft] = cornerHeights;
  
  // 北向きの斜面（上が低い）
  if (topLeft === topRight && bottomLeft === bottomRight && topLeft < bottomLeft) {
    return { 
      isSlope: true, 
      slopeDirection: 'north', 
      heightDifference 
    };
  }
  
  // 南向きの斜面（下が低い）
  if (topLeft === topRight && bottomLeft === bottomRight && topLeft > bottomLeft) {
    return { 
      isSlope: true, 
      slopeDirection: 'south', 
      heightDifference 
    };
  }
  
  // 東向きの斜面（右が低い）
  if (topLeft === bottomLeft && topRight === bottomRight && topLeft > topRight) {
    return { 
      isSlope: true, 
      slopeDirection: 'east', 
      heightDifference 
    };
  }
  
  // 西向きの斜面（左が低い）
  if (topLeft === bottomLeft && topRight === bottomRight && topLeft < topRight) {
    return { 
      isSlope: true, 
      slopeDirection: 'west', 
      heightDifference 
    };
  }
  
  // 対角線の斜面
  return { 
    isSlope: true, 
    slopeDirection: 'diagonal', 
    heightDifference 
  };
};

export const isBuildableByHeight = (
  _height: HeightLevel, 
  _facilityType: string
): boolean => {
  // 高さによる制限はなし（常にtrue）
  return true;
};


export const canBuildOnSlope = (
  _facilityType: string,
  _slopeInfo: SlopeInfo
): boolean => {

  return true;
};

export const canBuildFacility = (
  _tile: HeightTerrainTile,
  _facilityType: string
): boolean => {

  return true;
};

// 高度を文字列で取得
export const getHeightDescription = (height: HeightLevel): string => {
  const descriptions = {
    0: '海面下/水',
    1: '平地',
    2: '低い丘',
    3: '高い丘',
    4: '山'
  };
  
  return descriptions[height];
};
