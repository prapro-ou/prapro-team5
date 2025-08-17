import { useState, useCallback } from 'react';
import type { SaveResult, LoadResult } from '../types/save';
import {
  createSaveData,
  saveToLocalStorage,
  loadFromLocalStorage,
  exportSaveData,
  importSaveDataFromFile,
  getSaveMetadata,
  deleteSaveData
} from '../utils/saveUtils';

export function useSaveLoad() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaveResult, setLastSaveResult] = useState<SaveResult | null>(null);
  const [lastLoadResult, setLastLoadResult] = useState<LoadResult | null>(null);

  // ゲームを保存する
  const saveGame = useCallback(async (
    gameStats: any,
    facilities: any[],
    terrainMap: Map<string, any>,
    infrastructureStatus: any,
    rewards: any[],
    gameSettings: any,
    cityName?: string
  ): Promise<SaveResult> => {
    setIsLoading(true);
    try {
      const saveData = createSaveData(
        gameStats,
        facilities,
        terrainMap,
        infrastructureStatus,
        rewards,
        gameSettings,
        cityName
      );
      
      const result = saveToLocalStorage(saveData);
      setLastSaveResult(result);
      return result;
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  // ゲームを読み込む
  const loadGame = useCallback(async (): Promise<LoadResult> => {
    setIsLoading(true);
    try {
      const result = loadFromLocalStorage();
      setLastLoadResult(result);
      return result;
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  // セーブデータをファイルにエクスポート
  const exportGame = useCallback(async (
    gameStats: any,
    facilities: any[],
    terrainMap: Map<string, any>,
    infrastructureStatus: any,
    rewards: any[],
    gameSettings: any,
    cityName?: string
  ): Promise<void> => {
    const saveData = createSaveData(
      gameStats,
      facilities,
      terrainMap,
      infrastructureStatus,
      rewards,
      gameSettings,
      cityName
    );
    
    exportSaveData(saveData);
  }, []);

  // ファイルからゲームをインポート
  const importGame = useCallback(async (file: File): Promise<LoadResult> => {
    setIsLoading(true);
    try {
      const result = await importSaveDataFromFile(file);
      setLastLoadResult(result);
      return result;
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  // セーブデータの存在確認
  const hasSaveData = useCallback((): boolean => {
    const metadata = getSaveMetadata();
    return metadata !== null;
  }, []);

  // セーブデータの削除
  const clearSaveData = useCallback((): boolean => {
    const success = deleteSaveData();
    if (success) {
      setLastSaveResult(null);
      setLastLoadResult(null);
    }
    return success;
  }, []);

  // セーブデータのメタデータ取得
  const getSaveInfo = useCallback(() => {
    return getSaveMetadata();
  }, []);

  return {
    // 状態
    isLoading,
    lastSaveResult,
    lastLoadResult,
    
    // アクション
    saveGame,
    loadGame,
    exportGame,
    importGame,
    hasSaveData,
    clearSaveData,
    getSaveInfo
  };
}
