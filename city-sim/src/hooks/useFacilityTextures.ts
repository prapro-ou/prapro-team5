import { Assets, Texture } from 'pixi.js';
import { getFacilityRegistry } from '../utils/facilityLoader';

type MutableRef<T> = { current: T };

export const useFacilityTextures = (texturesRef: MutableRef<Map<string, Texture>>) => {
  const loadFacilityTextures = async (): Promise<void> => {
    const uniquePaths = Array.from(new Set(
      Object.values(getFacilityRegistry())
        .flatMap(f => f.imgPaths ?? [])
    ));

    if (uniquePaths.length === 0) return;

    try {
      await Assets.load(uniquePaths);
      uniquePaths.forEach((p) => {
        const tex = Assets.get<Texture>(p);
        if (tex) texturesRef.current.set(p, tex);
      });
    } catch {
      // 読み込み失敗は無視（スプライトが出ないだけ）
    }
  };

  return { loadFacilityTextures };
};
