import { useRef } from 'react';

// 再描画制御用のフック
export const useRedrawControl = () => {
  const lastTerrainMapRef = useRef<string | null>(null);
  const lastFacilitiesRef = useRef<string | null>(null);
  const lastPreviewMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastEffectPreviewMousePositionRef = useRef<{ x: number; y: number } | null>(null);

  // 地形データの変更をチェック
  const shouldRedrawTerrain = (terrainMap: any): boolean => {
    const terrainHash = terrainMap instanceof Map
      ? `size:${terrainMap.size}`
      : JSON.stringify(terrainMap);
    if (lastTerrainMapRef.current !== null && terrainHash === lastTerrainMapRef.current) {
      return false; // 変更なしの場合はスキップ
    }
    lastTerrainMapRef.current = terrainHash;
    return true;
  };

  // 施設データの変更をチェック
  const shouldRedrawFacilities = (facilities: any[]): boolean => {
    const facilitiesHash = JSON.stringify(facilities);
    if (lastFacilitiesRef.current !== null && facilitiesHash === lastFacilitiesRef.current) {
      return false; // 変更なしの場合はスキップ
    }
    lastFacilitiesRef.current = facilitiesHash;
    return true;
  };

  // プレビューのマウス位置変更をチェック
  const shouldRedrawPreview = (mousePosition: { x: number; y: number } | null): boolean => {
    if (mousePosition && lastPreviewMousePositionRef.current &&
        mousePosition.x === lastPreviewMousePositionRef.current.x &&
        mousePosition.y === lastPreviewMousePositionRef.current.y) {
      return false; // マウス位置が変わっていない場合はスキップ
    }
    lastPreviewMousePositionRef.current = mousePosition ? { ...mousePosition } : null;
    return true;
  };

  // 効果範囲プレビューのマウス位置変更をチェック
  const shouldRedrawEffectPreview = (mousePosition: { x: number; y: number } | null): boolean => {
    if (mousePosition && lastEffectPreviewMousePositionRef.current &&
        mousePosition.x === lastEffectPreviewMousePositionRef.current.x &&
        mousePosition.y === lastEffectPreviewMousePositionRef.current.y) {
      return false; // マウス位置が変わっていない場合はスキップ
    }
    lastEffectPreviewMousePositionRef.current = mousePosition ? { ...mousePosition } : null;
    return true;
  };

  // 状態をリセット
  const resetPreviewStates = (): void => {
    lastPreviewMousePositionRef.current = null;
    lastEffectPreviewMousePositionRef.current = null;
  };

  // 地形の再描画判定をリセット
  const resetTerrainState = (): void => {
    lastTerrainMapRef.current = null;
  };

  return {
    shouldRedrawTerrain,
    shouldRedrawFacilities,
    shouldRedrawPreview,
    shouldRedrawEffectPreview,
    resetPreviewStates,
    resetTerrainState
  };
};
