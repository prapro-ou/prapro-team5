import type { HeightLevel, HeightTerrainTile } from '../types/terrainWithHeight';

export const canBuildFacility = (
  tile: HeightTerrainTile,
  _facilityType: string
): boolean => {
  if (tile.isSlope) {
    return false;
  }
  return true;
};

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
