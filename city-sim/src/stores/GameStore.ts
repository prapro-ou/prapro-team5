import { create } from 'zustand';
import type { GameStats } from '../types/game';
import { useFacilityStore } from './FacilityStore';
import { getFacilityRegistry } from '../utils/facilityLoader';
import { citizenFeedTask } from './CitizenFeedTask';
import { calculateProduction, calculateConsumptionAndRevenue } from './EconomyStore';
import { useInfrastructureStore } from './InfrastructureStore';
import { playLevelUpSound } from '../components/SoundSettings';
import { saveLoadRegistry } from './SaveLoadRegistry';
import { calculatePopulationChange } from '../utils/populationCalculation';
import { executeMonthlyWorkforceAllocation } from './EconomyStore';
import { calculateTotalTaxRevenue, calculateMonthlyBalance } from './EconomyStore';
import { useProductStore } from './ProductStore';
import { useYearlyEvaluationStore } from './YearlyEvaluationStore';
import { useUIStore } from './UIStore';
import { useTimeControlStore } from './TimeControlStore';
import { useSupportStore } from './SupportStore';
import type { CityStateForSupport } from '../types/support';
import { useMissionStore } from './MissionStore';
import { useCityParameterMapStore } from './CityParameterMapStore';
import { calculateSatisfactionWithFactors } from '../utils/satisfaction';
import { useEconomyStore } from './EconomyStore';

// --- 月次処理の型定義 ---
export type MonthlyTask = (get: () => GameStore, set: (partial: Partial<GameStore>) => void) => void;

interface GameStore {
  stats: GameStats;
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  advanceTime: () => void;
  addPopulation: (count: number) => void;
  
  monthlyTasks: MonthlyTask[];
  levelUpMessage: string | null;
  setLevelUpMessage: (msg: string | null) => void;
  
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
}

// --- 月次処理の具体的なロジックを独立した関数として定義 ---

// 税収を計算し、資金に加算するタスク
const calculateTaxRevenue: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  const hasCityHall = facilities.some(f => f.type === 'city_hall');

  if (hasCityHall && stats.population > 0) {
    const taxRevenue = calculateTotalTaxRevenue(stats, facilities);
    
    if (taxRevenue > 0) {
      const currentMoney = get().stats.money;
      set({
        stats: {
          ...stats,
          money: currentMoney + taxRevenue
        }
      });
    }
  }
};

// 施設の維持費を合計し、資金から差し引くタスク
const payMaintenanceCost: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  let totalCost = 0;
  
  // 活動中の施設のみ維持費を支払う
  facilities.forEach(facility => {
    if (!facility.isActive) {
      return;
    }
    
    const data = getFacilityRegistry()[facility.type];
    if (data && data.maintenanceCost) {
      totalCost += data.maintenanceCost;
    }
  });
  
  if (totalCost > 0) {
    const currentMoney = get().stats.money;
    set({
      stats: {
        ...stats,
        money: currentMoney - totalCost
      }
    });
  }
};

// 人口を新モデルで増減させるタスク
const adjustPopulationByGrowth: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;

  // インフラ状況を取得
  const infraStatus = useInfrastructureStore.getState().getInfrastructureStatus();
  const infraFactors = {
    waterDemand: infraStatus.water.demand,
    waterSupply: infraStatus.water.supply,
    electricityDemand: infraStatus.electricity.demand,
    electricitySupply: infraStatus.electricity.supply,
  };

  // 失業率を算出（労働力=人口の60%ベース）
  const population = stats.population || 0;
  const workforce = Math.floor(population * 0.6);
  const employed = stats.workforceAllocations.reduce((acc, a) => acc + (a.assignedWorkforce || 0), 0);
  const unemploymentRate = workforce > 0 ? Math.max(0, (workforce - employed) / workforce) : 0;

  // 新人口モデルを適用
  const result = calculatePopulationChange({
    population,
    satisfaction: stats.satisfaction,
    unemploymentRate,
    facilities,
    cityParameters: stats.cityParameters,
    infra: infraFactors,
  });

  // 計算結果を一時保存（月次データ記録用）
  const currentStats = get().stats;
  set({
    stats: {
      ...currentStats,
      lastPopulationChange: {
        births: result.births,
        deaths: result.deaths,
        inflow: result.inflow,
        outflow: result.outflow,
        delta: result.delta,
        housingCapacity: result.details.housingCapacity,
      }
    }
  });

  if (result.delta !== 0) {
    get().addPopulation(result.delta);
  }

  console.log(
    `Population Δ=${result.delta} (B:${result.births} D:${result.deaths} In:${result.inflow} Out:${result.outflow}) ` +
    `A=${result.details.attractiveness.toFixed(2)} H=${result.details.healthIndex.toFixed(2)} ` +
    `Emp=${result.details.employmentScore.toFixed(2)} Cap=${result.details.housingCapacity} ` +
    `Vac=${result.details.vacancyRate.toFixed(2)} InM=${result.details.inflowMultiplier.toFixed(2)} OutM=${result.details.outflowMultiplier.toFixed(2)} ` +
    `${result.appliedHousingCap ? '[CAP]' : ''}`
  );
};

// 新しい経済サイクルを処理するタスク
const processEconomicCycle: MonthlyTask = (get, set) => {
  const facilities = useFacilityStore.getState().facilities;
  let currentStats = get().stats;

  // 1. 製品を生産する
  const producedGoods = calculateProduction(currentStats, facilities);
  if (producedGoods > 0) {
  }

  // 2. 製品を消費して収益を得る
  const { consumed, revenue } = calculateConsumptionAndRevenue(currentStats, facilities);
  if (consumed > 0) {
    currentStats = {
      ...currentStats,
      money: Math.floor(currentStats.money + revenue)
    };
  }
  
  // 3. 製品需給状況をログ出力
  const { getProductSupplyDemandStatus } = useProductStore.getState();
  getProductSupplyDemandStatus(facilities);
  
  // 最終的な状態を更新
  set({ stats: currentStats });
};

// インフラ計算タスク
const processInfrastructure: MonthlyTask = (_get, _set) => {
  const facilities = useFacilityStore.getState().facilities;
  const { calculateInfrastructure } = useInfrastructureStore.getState();
  
  // インフラ状況を計算
  calculateInfrastructure(facilities);
};

// 月次収支を計算し、統計に反映するタスク
const processMonthlyBalance: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  const { income, expense, balance } = calculateMonthlyBalance(stats, facilities);

  set({
    stats: {
      ...stats,
      monthlyBalance: { income, expense, balance }
    }
  });
};

// 影響マップから都市パラメータを算出して反映するタスク
const updateCityParametersFromMaps: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  const mapStore = useCityParameterMapStore.getState();

  // サンプリング対象（住宅中心）無ければ全体平均代替（ここでは50固定）
  const residentials = facilities.filter(f => f.type === 'residential' || f.type === 'large_residential');

  let newParams: any;
  if (residentials.length === 0) {
    newParams = {
      entertainment: 50,
      security: 50,
      sanitation: 50,
      transit: 50,
      environment: 50,
      education: 50,
      disaster_prevention: 50,
      tourism: 50,
    };
  } else {
    // 住宅中心座標で平均サンプル
    const positions = residentials.map(r => ({ x: r.position.x, y: r.position.y }));
    newParams = {
      entertainment: mapStore.sampleAverage('entertainment', positions),
      security: mapStore.sampleAverage('security', positions),
      sanitation: mapStore.sampleAverage('sanitation', positions),
      transit: mapStore.sampleAverage('transit', positions),
      environment: mapStore.sampleAverage('environment', positions),
      education: mapStore.sampleAverage('education', positions),
      disaster_prevention: mapStore.sampleAverage('disaster_prevention', positions),
      tourism: mapStore.sampleAverage('tourism', positions),
    };
    // 正規化（0-100にクリップ）現在はマップ値をそのまま使う前提だが安全のため
    (Object.keys(newParams) as Array<keyof typeof newParams>).forEach((key) => {
      const v = newParams[key] as number;
      (newParams as any)[key] = Math.max(0, Math.min(100, Math.round(v)));
    });
  }

  // インフラ要素の取得
  const { getInfrastructureStatus } = useInfrastructureStore.getState();
  const infraStatus = getInfrastructureStatus();
  const infraFactors = {
    waterDemand: infraStatus.water.demand,
    waterSupply: infraStatus.water.supply,
    electricityDemand: infraStatus.electricity.demand,
    electricitySupply: infraStatus.electricity.supply,
  };

  // 経済要素の取得（住民税・失業率）
  const taxRates = useEconomyStore.getState().taxRates;
  const population = stats.population || 0;
  const workforce = Math.floor(population * 0.6);
  const employed = stats.workforceAllocations.reduce((acc, a) => acc + (a.assignedWorkforce || 0), 0);
  const unemploymentRate = workforce > 0 ? Math.max(0, (workforce - employed) / workforce) : 0;
  const economyFactors = {
    citizenTaxRate: taxRates.citizenTax,
    unemploymentRate,
  };

  // 満足度を再合成
  const newSatisfaction = calculateSatisfactionWithFactors(newParams, infraFactors, economyFactors, stats.happinessPenalty);

  // 月次履歴に反映
  const currentMonth = stats.date.month - 1;
  const newAccum = { ...stats.monthlyAccumulation };
  if (!newAccum.monthlyCityParameters) {
    newAccum.monthlyCityParameters = new Array(12).fill(null).map(() => ({
      entertainment: 50,
      security: 50,
      sanitation: 50,
      transit: 50,
      environment: 50,
      education: 50,
      disaster_prevention: 50,
      tourism: 50,
    }));
  }
  newAccum.monthlyCityParameters[currentMonth] = { ...newParams };

  set({
    stats: {
      ...stats,
      cityParameters: newParams,
      satisfaction: newSatisfaction,
      monthlyAccumulation: newAccum,
    }
  });
};

// ミッション条件チェックタスク
const checkMissionConditions: MonthlyTask = (_get, _set) => {
  const { checkMissionConditions } = useMissionStore.getState();
  checkMissionConditions();
};

// 支持率を更新するタスク
const updateSupportRatings: MonthlyTask = (get, set) => {
  const { stats } = get();
  const facilities = useFacilityStore.getState().facilities;
  const { calculateSupportRatings, recordMonthlyHistory } = useSupportStore.getState();
  
  // 都市の状態データを構築
  const cityState: CityStateForSupport = {
    satisfaction: stats.satisfaction,
    population: stats.population,
    populationGrowth: 0, // 前月比の人口増加（後で計算）
    taxRevenue: stats.monthlyBalance.income,
    taxRevenueGrowth: 0, // 前月比の税収成長（後で計算）
    infrastructureEfficiency: 0, // インフラ効率（後で計算）
    infrastructureSurplus: 0, // インフラ余剰（後で計算）
    commercialFacilityCount: facilities.filter(f => f.type === 'commercial').length,
    industrialFacilityCount: facilities.filter(f => f.type === 'industrial').length,
    parkCount: facilities.filter(f => f.type === 'park').length,
    totalFacilityCount: facilities.length,
    fiscalBalance: stats.monthlyBalance.balance,
    workforceEfficiency: 0.8 // 仮の値（後で実際の計算に置き換え）
  };
  
  // 支持率を計算
  const newSupportRatings = calculateSupportRatings(cityState);
  
  // SupportStoreの支持率を更新
  useSupportStore.getState().updateAllFactionSupports(newSupportRatings);
  
  // 月次履歴を記録
  recordMonthlyHistory(stats.date.year, stats.date.month);
  
  // 支持率データを月次累積データに追加
  const currentMonth = stats.date.month - 1;
  const newAccumulation = { ...stats.monthlyAccumulation };
  
  // 各派閥の支持率を累積
  Object.entries(newSupportRatings).forEach(([factionType, rating]) => {
    if (!newAccumulation.monthlySupportRatings[factionType as keyof typeof newAccumulation.monthlySupportRatings]) {
      newAccumulation.monthlySupportRatings[factionType as keyof typeof newAccumulation.monthlySupportRatings] = new Array(12).fill(50);
    }
    newAccumulation.monthlySupportRatings[factionType as keyof typeof newAccumulation.monthlySupportRatings][currentMonth] = rating;
  });
  
  set({
    stats: {
      ...stats,
      monthlyAccumulation: newAccumulation
    }
  });
};

// 月次データを累積するタスク
const accumulateMonthlyData: MonthlyTask = (get, set) => {
  const { stats } = get();
  const currentMonth = stats.date.month - 1; // 配列のインデックスは0ベース
  
  // 年度が変わった場合は累積データをリセット
  if (stats.monthlyAccumulation.year !== stats.date.year) {
    set({
      stats: {
        ...stats,
        monthlyAccumulation: {
          year: stats.date.year,
          monthlyTaxRevenue: new Array(12).fill(0),
          monthlyMaintenanceCost: new Array(12).fill(0),
          monthlyPopulation: new Array(12).fill(0),
          monthlySatisfaction: new Array(12).fill(50),
          monthlySupportRatings: {
            central_government: new Array(12).fill(50),
            citizens: new Array(12).fill(50),
            chamber_of_commerce: new Array(12).fill(50)
          },
          monthlyBirths: new Array(12).fill(0),
          monthlyDeaths: new Array(12).fill(0),
          monthlyInflow: new Array(12).fill(0),
          monthlyOutflow: new Array(12).fill(0),
          monthlyDelta: new Array(12).fill(0),
          monthlyHousingCapacity: new Array(12).fill(0),
        }
      }
    });
  }
  
  // 現在の月次データを累積
  const newAccumulation = { ...stats.monthlyAccumulation };
  
  // 配列が初期化されていない場合は初期化
  if (!newAccumulation.monthlyBirths) {
    newAccumulation.monthlyBirths = new Array(12).fill(0);
  }
  if (!newAccumulation.monthlyDeaths) {
    newAccumulation.monthlyDeaths = new Array(12).fill(0);
  }
  if (!newAccumulation.monthlyInflow) {
    newAccumulation.monthlyInflow = new Array(12).fill(0);
  }
  if (!newAccumulation.monthlyOutflow) {
    newAccumulation.monthlyOutflow = new Array(12).fill(0);
  }
  if (!newAccumulation.monthlyDelta) {
    newAccumulation.monthlyDelta = new Array(12).fill(0);
  }
  if (!newAccumulation.monthlyHousingCapacity) {
    newAccumulation.monthlyHousingCapacity = new Array(12).fill(0);
  }
  
  // 税収を累積（市庁舎がある場合のみ）
  const facilities = useFacilityStore.getState().facilities;
  const hasCityHall = facilities.some(f => f.type === 'city_hall');
  if (hasCityHall && stats.population > 0) {
    const taxRevenue = calculateTotalTaxRevenue(stats, facilities);
    newAccumulation.monthlyTaxRevenue[currentMonth] = taxRevenue;
  }
  
  // 維持費を累積
  let totalMaintenanceCost = 0;
  facilities.forEach(facility => {
    if (facility.isActive) {
      const data = getFacilityRegistry()[facility.type];
      if (data && data.maintenanceCost) {
        totalMaintenanceCost += data.maintenanceCost;
      }
    }
  });
  newAccumulation.monthlyMaintenanceCost[currentMonth] = totalMaintenanceCost;
  
  // 人口と満足度を累積
  newAccumulation.monthlyPopulation[currentMonth] = stats.population;
  newAccumulation.monthlySatisfaction[currentMonth] = stats.satisfaction;
  
  // 人口増減の詳細を累積（前回の計算結果から）
  if (stats.lastPopulationChange) {
    newAccumulation.monthlyBirths![currentMonth] = stats.lastPopulationChange.births;
    newAccumulation.monthlyDeaths![currentMonth] = stats.lastPopulationChange.deaths;
    newAccumulation.monthlyInflow![currentMonth] = stats.lastPopulationChange.inflow;
    newAccumulation.monthlyOutflow![currentMonth] = stats.lastPopulationChange.outflow;
    newAccumulation.monthlyDelta![currentMonth] = stats.lastPopulationChange.delta;
    newAccumulation.monthlyHousingCapacity![currentMonth] = stats.lastPopulationChange.housingCapacity;
  }
  
  set({
    stats: {
      ...stats,
      monthlyAccumulation: newAccumulation,
      lastPopulationChange: undefined // 記録後にクリア
    }
  });
  
};

// 年末評価処理タスク
const processYearlyEvaluation: MonthlyTask = (get, set) => {
  const { stats } = get();
  
  // 12月の最終週の場合のみ実行
  if (stats.date.month === 12 && stats.date.week === 4) {
    
    const facilities = useFacilityStore.getState().facilities;
    const { executeYearlyEvaluation, calculateYearlyStats } = useYearlyEvaluationStore.getState();
    
    // 現在の年度の統計データを計算
    const yearlyStats = calculateYearlyStats(stats, facilities);
    
    // 年末評価を実行
    const yearlyEvaluation = executeYearlyEvaluation(stats, facilities);

    // 前年度データの保存処理
    
    // 前年度の統計データを構築（月次累積データから計算）
    const previousYearStats = {
      year: stats.date.year,
      totalTaxRevenue: stats.monthlyAccumulation.monthlyTaxRevenue.reduce((sum, revenue) => sum + revenue, 0),
      totalMaintenanceCost: stats.monthlyAccumulation.monthlyMaintenanceCost.reduce((sum, cost) => sum + cost, 0),
      populationGrowth: stats.monthlyAccumulation.monthlyPopulation[11] - stats.monthlyAccumulation.monthlyPopulation[0],
      facilityCount: facilities.length,
      infrastructureEfficiency: facilities.filter(f => f.isActive).length / Math.max(facilities.length, 1)
    };
    
    // 評価結果、年次統計、前年度データを一括でGameStoreの状態に反映
    set({
      stats: {
        ...stats,
        yearlyEvaluation,
        yearlyStats,
        previousYearStats: { ...previousYearStats },
        previousYearEvaluation: { ...yearlyEvaluation }
      }
    });

    // 補助金を資金に追加
    if (yearlyEvaluation.subsidy > 0) {
      const currentMoney = get().stats.money;
      set({
        stats: {
          ...get().stats,
          money: currentMoney + yearlyEvaluation.subsidy
        }
      });
      
      console.log(`年末評価完了: ${yearlyEvaluation.grade}評価 (${yearlyEvaluation.totalScore}点)`);
      console.log(`補助金: +¥${yearlyEvaluation.subsidy.toLocaleString()}`);
      console.log(`前年度データ保存完了: 税収${previousYearStats.totalTaxRevenue}, 維持費${previousYearStats.totalMaintenanceCost}, 人口増加${previousYearStats.populationGrowth}`);
      
      // 年末評価完了時に時間を停止
      useTimeControlStore.getState().pause();
      
      // 年末評価結果表示画面を自動的に開く
      useUIStore.getState().openYearlyEvaluationResult();
    }
  }
};

// 人口が一定数を超えたらレベルアップするタスク
// レベルアップ判定関数（人口や満足度など複数条件に対応可能）
function checkLevelUp(stats: GameStats, set: (partial: Partial<GameStore>) => void) {
  // レベルごとの人口閾値
  const levelThresholds = [0, 100, 300, 1000, 3000, 10000];
  let newLevel = stats.level;
  let levelUpMsg = null;
  // 例：今後は満足度条件も追加可能
  while (
    newLevel + 1 < levelThresholds.length &&
    stats.population >= levelThresholds[newLevel + 1]
    // && stats.satisfaction >= 50  // 例：満足度条件を追加したい場合
  ) {
    newLevel++;
    levelUpMsg = `レベル${newLevel}にアップしました！`;
  }
  if (newLevel !== stats.level) {
    // レベルアップ効果音を再生
    playLevelUpSound();
    
    set({
      stats: {
        ...stats,
        level: newLevel
      },
      levelUpMessage: levelUpMsg
    });
  }
}

export const INITIAL_STATS: GameStats = {
    level: 1, 
    money: 10000,
    population: 100,
    satisfaction: 50,
    workforceAllocations: [], 
    date: { year: 2024, month: 1, week: 1, totalWeeks: 1 },
    monthlyBalance: { income: 0, expense: 0, balance: 0 }, 
    // 都市パラメータ初期値
    cityParameters: {
      entertainment: 50,
      security: 50,
      sanitation: 50,
      transit: 50,
      environment: 50,
      education: 50,
      disaster_prevention: 50,
      tourism: 50
    },
    yearlyEvaluation: null, // 年次評価データ（初期値はnull）
    yearlyStats: null, // 年次統計データ（初期値はnull）
    previousYearStats: null, // 前年度統計データ（初期値はnull）
    previousYearEvaluation: null, // 前年度評価データ（初期値はnull）
    monthlyAccumulation: { // 月次データの累積（初期値は12ヶ月分の0配列）
      year: 2024,
      monthlyTaxRevenue: new Array(12).fill(0),
      monthlyMaintenanceCost: new Array(12).fill(0),
      monthlyPopulation: new Array(12).fill(0),
      monthlySatisfaction: new Array(12).fill(50),
      monthlySupportRatings: {
        central_government: new Array(12).fill(50),
        citizens: new Array(12).fill(50),
        chamber_of_commerce: new Array(12).fill(50)
      },
      // 都市パラメータの月次履歴
      monthlyCityParameters: new Array(12).fill(null).map(() => ({
        entertainment: 50,
        security: 50,
        sanitation: 50,
        transit: 50,
        environment: 50,
        education: 50,
        disaster_prevention: 50,
        tourism: 50
      })),
      // 人口増減の詳細
      monthlyBirths: new Array(12).fill(0),
      monthlyDeaths: new Array(12).fill(0),
      monthlyInflow: new Array(12).fill(0),
      monthlyOutflow: new Array(12).fill(0),
      monthlyDelta: new Array(12).fill(0),
      monthlyHousingCapacity: new Array(12).fill(0),
    },
    supportSystem: {
      factionSupports: [
        { type: 'central_government', currentRating: 50, previousRating: 50, change: 0 },
        { type: 'citizens', currentRating: 50, previousRating: 50, change: 0 },
        { type: 'chamber_of_commerce', currentRating: 50, previousRating: 50, change: 0 }
      ],
      monthlyHistory: [],
      yearlyHistory: [],
      lastCalculationDate: { year: 2024, month: 1 }
    }
}


export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,
  monthlyTasks: [
    // 労働力配分を最初に実行
    (get, set) => {
      const facilities = useFacilityStore.getState().facilities;
      const { stats } = get();
      
      // 人口0の場合は配分をスキップ
      if (stats.population === 0) {
        return;
      }
      
      // 労働力配分を実行（人口の60%を労働力として使用）
      const availableWorkforce = Math.floor(stats.population * 0.6);
      const newAllocations = executeMonthlyWorkforceAllocation(facilities, availableWorkforce);
      
      // 配分結果をGameStoreの状態に反映
      set({
        stats: {
          ...stats,
          workforceAllocations: newAllocations
        }
      });
    },
    calculateTaxRevenue,
    payMaintenanceCost,
    processEconomicCycle,
    processInfrastructure,
    processMonthlyBalance,
    processYearlyEvaluation,
    updateCityParametersFromMaps,
    adjustPopulationByGrowth,
    accumulateMonthlyData,
    citizenFeedTask,
    updateSupportRatings,
    checkMissionConditions,
  ],
  levelUpMessage: null,
  setLevelUpMessage: (msg) => set({ levelUpMessage: msg }),

  addMoney: (amount) => set((state) => ({ stats: { ...state.stats, money: Math.floor(state.stats.money + amount) }})),
  
  spendMoney: (amount) => {
    const currentMoney = get().stats.money;
    if (currentMoney >= amount) {
      set((state) => ({
        stats: {
          ...state.stats,
          money: Math.floor(currentMoney - amount)
        }
      }));
      return true;
    }
    return false;
  },

  advanceTime: () => {
    const { stats, monthlyTasks } = get();
    const newStats = { ...stats };
    
    // 週の進行
    newStats.date.week++;
    newStats.date.totalWeeks++;
    
    // 月次タスクの実行（第4週の時点で実行）
    if (newStats.date.week === 4) {
      // 月次タスク実行
    }
    
    // 月の進行（4週目が終わったら次の月へ）
    if (newStats.date.week > 4) {
      newStats.date.week = 1;
      newStats.date.month++;
      
      // 年の進行
      if (newStats.date.month > 12) {
        newStats.date.month = 1;
        newStats.date.year++;
        console.log(`年度変更: ${stats.date.year} → ${newStats.date.year}`);
      }
      
      // 日付更新とその他の状態更新を一括で実行
      const currentStats = get().stats;
      set({
        stats: {
          ...currentStats,
          date: newStats.date
        }
      });
    } else {
      // 週の進行のみの場合
      set({ stats: newStats });
    }

    // レベルアップチェック
    checkLevelUp(get().stats, set);

    // 月次タスク実行完了直後に前年度データを保存
    if (newStats.date.week === 4) {
      monthlyTasks.forEach((task, _index) => {
        task(get, set);
      });
      
      // 月次タスク実行完了直後に前年度データを保存
      const currentStats = get().stats;
      if (currentStats.yearlyEvaluation && !currentStats.previousYearEvaluation) {
        set({
          stats: {
            ...currentStats,
            previousYearEvaluation: { ...currentStats.yearlyEvaluation }
          }
        });
      }
    }
  },

  addPopulation: (count) => {
    const { stats } = get();
    const newPopulation = Math.max(0, stats.population + count);
    
    set({
      stats: {
        ...stats,
        population: newPopulation
      }
    });
  },

  

  // セーブ・ロード機能
  saveState: () => {
    const state = get();
    return {
      stats: state.stats,
      levelUpMessage: state.levelUpMessage
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.stats) {
      const savedStats = savedState.stats;
      
      // 新しく追加したフィールドの初期化
      const validatedStats: GameStats = {
        ...INITIAL_STATS, // デフォルト値を設定
        ...savedStats,
        yearlyEvaluation: savedStats.yearlyEvaluation || null,
        yearlyStats: savedStats.yearlyStats || null,
        previousYearStats: savedStats.previousYearStats || null,
        previousYearEvaluation: savedStats.previousYearEvaluation || null,
        cityParameters: savedStats.cityParameters || {
          entertainment: 50,
          security: 50,
          sanitation: 50,
          transit: 50,
          environment: 50,
          education: 50,
          disaster_prevention: 50,
          tourism: 50
        },
        monthlyAccumulation: savedStats.monthlyAccumulation ? {
          ...savedStats.monthlyAccumulation,
          monthlyBirths: savedStats.monthlyAccumulation.monthlyBirths || new Array(12).fill(0),
          monthlyDeaths: savedStats.monthlyAccumulation.monthlyDeaths || new Array(12).fill(0),
          monthlyInflow: savedStats.monthlyAccumulation.monthlyInflow || new Array(12).fill(0),
          monthlyOutflow: savedStats.monthlyAccumulation.monthlyOutflow || new Array(12).fill(0),
          monthlyDelta: savedStats.monthlyAccumulation.monthlyDelta || new Array(12).fill(0),
          monthlyHousingCapacity: savedStats.monthlyAccumulation.monthlyHousingCapacity || new Array(12).fill(0),
        } : {
          year: savedStats.date?.year || 2024,
          monthlyTaxRevenue: new Array(12).fill(0),
          monthlyMaintenanceCost: new Array(12).fill(0),
          monthlyPopulation: new Array(12).fill(0),
          monthlySatisfaction: new Array(12).fill(50),
          monthlySupportRatings: {
            central_government: new Array(12).fill(50),
            citizens: new Array(12).fill(50),
            chamber_of_commerce: new Array(12).fill(50)
          },
          monthlyCityParameters: new Array(12).fill(null).map(() => ({
            entertainment: 50,
            security: 50,
            sanitation: 50,
            transit: 50,
            environment: 50,
            education: 50,
            disaster_prevention: 50,
            tourism: 50
          })),
          monthlyBirths: new Array(12).fill(0),
          monthlyDeaths: new Array(12).fill(0),
          monthlyInflow: new Array(12).fill(0),
          monthlyOutflow: new Array(12).fill(0),
          monthlyDelta: new Array(12).fill(0),
          monthlyHousingCapacity: new Array(12).fill(0),
        }
      };
      
      set({
        stats: validatedStats,
        levelUpMessage: savedState.levelUpMessage || null
      });
      
    }
  },

  resetToInitial: () => {
    set({
      stats: INITIAL_STATS,
      levelUpMessage: null
    });
  }
}));

// 自動登録
saveLoadRegistry.register('game', useGameStore.getState());
