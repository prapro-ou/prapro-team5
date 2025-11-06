import { getFacilityRegistry } from '../utils/facilityLoader';
import type { Facility } from '../types/facility';
import type { GameStats } from '../types/game';
import { allocateWorkforce, type WorkforceAllocation } from '../hooks/useWorkforce';
import { useProductStore } from './ProductStore';
import { create } from 'zustand';

// 税率の型定義
interface TaxRates {
  citizenTax: number;      // 市民税率
  corporateTax: number;    // 法人税率
}

// EconomyStoreの型定義
interface EconomyStore {
  taxRates: TaxRates;
  setTaxRates: (rates: Partial<TaxRates>) => void;
  resetTaxRates: () => void;
}

// 初期税率
const INITIAL_TAX_RATES: TaxRates = {
  citizenTax: 0.03,      // 市民税率: 3%
  corporateTax: 0.08,    // 法人税率: 8%
};

// EconomyStoreの作成
export const useEconomyStore = create<EconomyStore>((set) => ({
  taxRates: INITIAL_TAX_RATES,
  
  setTaxRates: (rates: Partial<TaxRates>) => {
    set((state) => ({
      taxRates: { ...state.taxRates, ...rates }
    }));
  },
  
  resetTaxRates: () => {
    set({ taxRates: INITIAL_TAX_RATES });
  },
}));

// 税率を取得する関数
function getTaxRates(): TaxRates {
  return useEconomyStore.getState().taxRates;
}

// 労働力配分を更新・実行
export function executeMonthlyWorkforceAllocation(
  facilities: Facility[], 
  availableWorkforce: number
): { facilityId: string; facilityType: string; position: { x: number; y: number }; assignedWorkforce: number; efficiency: number }[] {
  const allocations = allocateWorkforce(facilities, availableWorkforce);
  
  // 配分結果を返す
  return allocations.map(allocation => ({
    facilityId: allocation.facility.id,
    facilityType: allocation.facility.type,
    position: allocation.facility.position,
    assignedWorkforce: allocation.assignedWorkforce,
    efficiency: allocation.efficiency
  }));
}

// 現在の労働力配分を取得
export function getCurrentWorkforceAllocations(stats: GameStats): WorkforceAllocation[] {
  return stats.workforceAllocations.map(allocation => {
    // 保存された施設情報を使用
    return {
      facility: {
        id: allocation.facilityId,
        type: allocation.facilityType as any, // 型安全性のため
        position: allocation.position,
        occupiedTiles: [], // 簡易的な実装
        variantIndex: 0,
        isConnected: true, // デフォルト値
        isActive: true      // デフォルト値
      } as Facility,
      assignedWorkforce: allocation.assignedWorkforce,
      efficiency: allocation.efficiency
    };
  });
}

// 特定の施設の労働力配分を取得
export function getFacilityWorkforceAllocation(
  facilityId: string, 
  stats: GameStats
): { assignedWorkforce: number; efficiency: number } | undefined {
  const allocation = stats.workforceAllocations.find(a => a.facilityId === facilityId);
  if (!allocation) return undefined;
  
  return {
    assignedWorkforce: allocation.assignedWorkforce,
    efficiency: allocation.efficiency
  };
}

// 施設の最終効率を計算（労働力効率 × 製品効率）
export function calculateFinalFacilityEfficiency(
  facility: Facility, 
  stats: GameStats,
  facilities: Facility[]
): number {
  // 1. 労働力効率を取得
  const workforceAllocation = getFacilityWorkforceAllocation(facility.id, stats);
  const workforceEfficiency = workforceAllocation ? workforceAllocation.efficiency : 0;
  
  // 2. 製品効率を計算
  const { getProductSupplyDemandStatus } = useProductStore.getState();
  const { efficiency: productEfficiency } = getProductSupplyDemandStatus(facilities);
  
  // 3. 最終効率 = 労働力効率 × 製品効率
  const finalEfficiency = workforceEfficiency * productEfficiency;
  
  // デバッグ用ログ（効率が0より大きい場合のみ）
  if (finalEfficiency > 0) {
    console.log(`効率計算: ${facility.type} - 労働力:${(workforceEfficiency*100).toFixed(1)}%, 製品:${(productEfficiency*100).toFixed(1)}%, 最終:${(finalEfficiency*100).toFixed(1)}%`);
  }
  
  return finalEfficiency;
}

/**
 * 工業施設による製品生産量を計算する
 * @param stats - 現在のゲーム統計
 * @param facilities - 現在の施設リスト
 * @returns 生産された製品の量
 */
export function calculateProduction(stats: GameStats, facilities: Facility[]): number {
  const industrials = facilities.filter(f => f.type === 'industrial' && f.isActive);
  let totalProduced = 0;

  industrials.forEach(facility => {
    const workforceData = getFacilityRegistry()[facility.type].workforceRequired;
    if (!workforceData || !workforceData.baseProduction) {
      console.log(`${facility.type}: 労働力データまたは生産データが不足`);
      return;
    }
    
    // 最終効率を使用（労働力効率 × 製品効率）
    const finalEfficiency = calculateFinalFacilityEfficiency(facility, stats, facilities);
    
    const production = workforceData.baseProduction * finalEfficiency;
    totalProduced += production;
    
    console.log(`${facility.type}: 生産量 ${production.toFixed(1)} (効率: ${(finalEfficiency*100).toFixed(1)}%)`);
  });
  
  return totalProduced;
}

/**
 * 商業施設による収益を計算する（製品需給制）
 * @param stats - 現在のゲーム統計
 * @param facilities - 現在の施設リスト
 * @returns 消費された製品の量と発生した収益
 */
export function calculateConsumptionAndRevenue(stats: GameStats, facilities: Facility[]): { consumed: number, revenue: number } {
  const commercials = facilities.filter(f => f.type === 'commercial' && f.isActive);
  let totalConsumed = 0;
  let totalRevenue = 0;

  commercials.forEach(facility => {
    const workforceData = getFacilityRegistry()[facility.type].workforceRequired;
    if (!workforceData || !workforceData.baseRevenue) {
      console.log(`${facility.type}: 労働力データまたは収益データが不足`);
      return;
    }
    
    // 最終効率を使用（労働力効率 × 製品効率）
    const finalEfficiency = calculateFinalFacilityEfficiency(facility, stats, facilities);
    
    const baseConsumption = workforceData.baseConsumption || 0;
    const baseRevenue = workforceData.baseRevenue;
    
    const consumption = baseConsumption * finalEfficiency;
    totalConsumed += consumption;
    totalRevenue += baseRevenue * finalEfficiency;
    
    console.log(`${facility.type}: 消費量 ${consumption.toFixed(1)}, 収益 ${totalRevenue.toFixed(1)} (効率: ${(finalEfficiency*100).toFixed(1)}%)`);
  });
  
  return { consumed: totalConsumed, revenue: totalRevenue };
}

// 各施設の資産価値を計算
export function calculateFacilityAssetValue(facility: Facility, satisfaction: number): number {
  const facilityData = getFacilityRegistry()[facility.type];
  const baseAssetValue = facilityData.baseAssetValue;
  
  if (!baseAssetValue) return 0; // 資産価値が設定されていない施設は0
  
  // 住宅なら満足度倍率、工業・商業なら固定値
  if (facility.type === 'residential') {
    // 満足度による倍率: 0.5-1.5の範囲
    const satisfactionMultiplier = Math.max(0.5, Math.min(1.5, satisfaction / 50));
    return Math.floor(baseAssetValue * satisfactionMultiplier);
  }
  else {
    // 工業・商業は固定値
    return baseAssetValue;
  }
}

// 総資産を計算
export function calculateTotalAssets(facilities: Facility[], satisfaction: number): number {
  return facilities.reduce((total, facility) => {
    return total + calculateFacilityAssetValue(facility, satisfaction);
  }, 0);
}

// 平均資産を計算
export function calculateAverageAssets(facilities: Facility[], satisfaction: number): number {
  // 資産価値がある施設のみをフィルタリング
  const facilitiesWithAssets = facilities.filter(facility => {
    const facilityData = getFacilityRegistry()[facility.type];
    return facilityData.baseAssetValue && facilityData.baseAssetValue > 0;
  });
  
  if (facilitiesWithAssets.length === 0) {
    return 0;
  }
  
  // 資産価値がある施設のみで総資産を計算
  const totalAssets = facilitiesWithAssets.reduce((total, facility) => {
    return total + calculateFacilityAssetValue(facility, satisfaction);
  }, 0);
  
  return Math.floor(totalAssets / facilitiesWithAssets.length);
}

// 各施設の利益を計算
export function calculateFacilityProfit(facility: Facility, efficiency: number): number {
  const facilityData = getFacilityRegistry()[facility.type];
  const workforceData = facilityData.workforceRequired;
  
  if (!workforceData || !workforceData.baseRevenue) return 0; // 収益が設定されていない施設は0
  
  // 収益 = 基本収益 × 稼働効率
  const revenue = workforceData.baseRevenue * efficiency;
  
  // 利益 = 収益 - 維持費
  const profit = revenue - facilityData.maintenanceCost;
  
  return Math.max(0, profit); // 利益は最低0
}

// 総利益を計算
export function calculateTotalProfit(facilities: Facility[], stats: GameStats): number {
  return facilities.reduce((total, facility) => {
    // 最終効率を使用（労働力効率 × 製品効率）
    const finalEfficiency = calculateFinalFacilityEfficiency(facility, stats, facilities);
    
    return total + calculateFacilityProfit(facility, finalEfficiency);
  }, 0);
}

// 平均利益を計算（後方互換性のため残す）
export function calculateAverageProfit(facilities: Facility[], stats: GameStats): number {
  const totalProfit = calculateTotalProfit(facilities, stats);
  const businessFacilities = facilities.filter(f => 
    f.type === 'commercial' || f.type === 'industrial'
  );
  
  return businessFacilities.length > 0 ? Math.floor(totalProfit / businessFacilities.length) : 0;
}

// 平均法人資産を計算（法人税用）
export function calculateAverageBusinessAssets(facilities: Facility[], satisfaction: number): number {
  // 商業・工業施設のみをフィルタリング
  const businessFacilities = facilities.filter(f => 
    f.type === 'commercial' || f.type === 'industrial'
  );
  
  if (businessFacilities.length === 0) {
    return 0;
  }
  
  // 法人施設の資産価値を合計
  const totalBusinessAssets = businessFacilities.reduce((total, facility) => {
    return total + calculateFacilityAssetValue(facility, satisfaction);
  }, 0);
  
  return Math.floor(totalBusinessAssets / businessFacilities.length);
}

// 市民税を計算
export function calculateCitizenTax(population: number, averageAssets: number): number {
  const taxRates = getTaxRates();
  return Math.floor(population * averageAssets * taxRates.citizenTax);
}

// 法人税を計算（資産ベース）
export function calculateCorporateTax(businessCount: number, averageBusinessAssets: number): number {
  const taxRates = getTaxRates();
  return Math.floor(businessCount * averageBusinessAssets * taxRates.corporateTax);
}

// 総税収を計算
export function calculateTotalTaxRevenue(stats: GameStats, facilities: Facility[]): number {
  // 平均資産を計算（市民税用）
  const averageAssets = calculateAverageAssets(facilities, stats.satisfaction);
  
  // 平均法人資産を計算（法人税用）
  const averageBusinessAssets = calculateAverageBusinessAssets(facilities, stats.satisfaction);
  
  // 企業数を計算（商業・工業施設）
  const businessCount = facilities.filter(f => 
    f.type === 'commercial' || f.type === 'industrial'
  ).length;
  
  // 市民税
  const citizenTax = calculateCitizenTax(stats.population, averageAssets);
  
  // 法人税（資産ベース）
  const corporateTax = calculateCorporateTax(businessCount, averageBusinessAssets);
  
  // 総税収
  const totalTaxRevenue = citizenTax + corporateTax;
  
  console.log(`=== 税収計算 ===`);
  console.log(`人口: ${stats.population}, 平均資産: ${averageAssets}`);
  console.log(`企業数: ${businessCount}, 平均法人資産: ${averageBusinessAssets}`);
  console.log(`市民税: ${citizenTax} (税率: ${getTaxRates().citizenTax * 100}%)`);
  console.log(`法人税: ${corporateTax} (税率: ${getTaxRates().corporateTax * 100}%)`);
  console.log(`総税収: ${totalTaxRevenue}`);
  console.log(`================`);
  
  return totalTaxRevenue;
}

// 月次収支を計算
export function calculateMonthlyBalance(stats: GameStats, facilities: Facility[]): { income: number; expense: number; balance: number } {
  // 税収（市庁舎がある場合のみ）
  const hasCityHall = facilities.some(f => f.type === 'city_hall');
  const taxRevenue = hasCityHall && stats.population > 0 ? calculateTotalTaxRevenue(stats, facilities) : 0;
  
  // 維持費（全施設の維持費合計）
  const maintenanceCost = facilities.reduce((total, facility) => {
    const facilityData = getFacilityRegistry()[facility.type];
    return total + (facilityData.maintenanceCost || 0);
  }, 0);
  
  const income = taxRevenue;
  const expense = maintenanceCost;
  const balance = income - expense;
  
  console.log(`=== 月次収支計算 ===`);
  console.log(`税収: +${income}`);
  console.log(`維持費: -${expense}`);
  console.log(`純利益: ${balance >= 0 ? '+' : ''}${balance}`);
  console.log(`====================`);
  
  return { income, expense, balance };
}
