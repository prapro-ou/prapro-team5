import type { FacilityInfo, FacilityType } from '../types/facility';

interface FacilitiesJsonRoot {
  metadata?: Record<string, unknown>;
  facilities: FacilityInfo[];
}

export interface FacilityLoadResult {
  success: boolean;
  registry: Record<FacilityType, FacilityInfo>;
  error?: string;
}

let facilityRegistry: Record<FacilityType, FacilityInfo> = {} as unknown as Record<FacilityType, FacilityInfo>;

export function getFacilityRegistry(): Record<FacilityType, FacilityInfo> {
  return facilityRegistry;
}

// フォールバックは廃止

export async function loadFacilitiesFromJSON(filePath: string = 'data/facilities.json'): Promise<FacilityLoadResult> {
  try {
    // JSON取得
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`施設ファイルの読み込みに失敗しました: ${response.status} ${response.statusText}`);
    }

    const data: FacilitiesJsonRoot = await response.json();

    if (!data || !Array.isArray(data.facilities)) {
      throw new Error('施設データの形式が正しくありません: facilities配列が見つかりません');
    }

    // バリデーション & 正規化
    const validList: FacilityInfo[] = [];

    for (const item of data.facilities) {
      if (!validateFacilityInfo(item)) {
        console.warn('無効な施設定義をスキップしました:', item);
        continue;
      }
      validList.push(item);
    }

    const registry: Record<FacilityType, FacilityInfo> = {} as unknown as Record<FacilityType, FacilityInfo>;
    for (const info of validList) {
      if (registry[info.type as FacilityType]) {
        registry[info.type as FacilityType] = info;
      }
      else {
        registry[info.type as FacilityType] = info;
      }
    }

    const result = {
      success: true,
      registry,
    };
    facilityRegistry = registry;
    return result;
  } catch (error) {
    console.error('施設データの読み込みエラー:', error);
    return {
      success: false,
      registry: {} as unknown as Record<FacilityType, FacilityInfo>,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました',
    };
  }
}

export function validateFacilityInfo(obj: any): obj is FacilityInfo {
  if (!obj || typeof obj !== 'object') return false;

  // 必須フィールドの基本チェック
  const requiredString = ['type', 'name', 'description', 'category', 'unlockCondition'] as const;
  for (const key of requiredString) {
    if (typeof obj[key] !== 'string') return false;
  }

  if (typeof obj.size !== 'number' || obj.size < 1 || obj.size % 2 === 0) return false;
  if (typeof obj.cost !== 'number' || obj.cost < 0) return false;
  if (typeof obj.maintenanceCost !== 'number' || obj.maintenanceCost < 0) return false;
  if (typeof obj.satisfaction !== 'number') return false;
  if (typeof obj.initiallyUnlocked !== 'boolean') return false;

  // 任意フィールドの軽い整合性
  if (obj.imgPaths && !Array.isArray(obj.imgPaths)) return false;
  if (obj.imgSizes && !Array.isArray(obj.imgSizes)) return false;
  if (obj.imgPaths && obj.imgSizes && obj.imgPaths.length !== obj.imgSizes.length) return false;

  if (obj.workforceRequired) {
    const w = obj.workforceRequired;
    if (typeof w.min !== 'number' || typeof w.max !== 'number') return false;
    if (w.min < 0 || w.max < 0 || w.min > w.max) return false;
    if (w.baseRevenue !== undefined && typeof w.baseRevenue !== 'number') return false;
    if (w.baseProduction !== undefined && typeof w.baseProduction !== 'number') return false;
    if (w.baseConsumption !== undefined && typeof w.baseConsumption !== 'number') return false;
  }

  if (obj.productDemand && !Array.isArray(obj.productDemand)) return false;
  if (obj.productProduction && !Array.isArray(obj.productProduction)) return false;

  if (obj.effectRadius !== undefined && (typeof obj.effectRadius !== 'number' || obj.effectRadius <= 0)) return false;

  return true;
}
