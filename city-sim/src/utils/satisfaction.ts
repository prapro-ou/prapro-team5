import type { CityParameters } from '../types/cityParameter';

export const PARAM_WEIGHTS = {
  entertainment: 0.2,
  security: 0.2,
  sanitation: 0.2,
  transit: 0.1,
  environment: 0.2,
  education: 0.1,
  disaster_prevention: 0.15,
  tourism: 0.1,
} as const;

export function calculateSatisfactionFromParameters(params?: CityParameters, penalty?: number): number {
  if (!params) return 50;
  let sum = 0;
  let wsum = 0;
  (Object.keys(PARAM_WEIGHTS) as (keyof typeof PARAM_WEIGHTS)[]).forEach((k) => {
    const w = PARAM_WEIGHTS[k] as number;
    const v = params[k] as number;
    sum += v * w;
    wsum += w;
  });
  let sat = wsum > 0 ? sum / wsum : 50;
  if (typeof penalty === 'number') sat -= penalty;
  if (Number.isNaN(sat)) sat = 50;
  return Math.max(0, Math.min(100, Math.round(sat)));
}

// 係数（暫定）
const WEIGHT_P = 0.6; // 都市パラメータ
const WEIGHT_I = 0.2; // インフラ
const WEIGHT_E = 0.2; // 経済

const INFRA_A = 0.5; // 水不足係数
const INFRA_B = 0.5; // 電力不足係数

const ECON_ALPHA_TAX = 0.6;   // 税率感度
const ECON_BETA_UNEMP = 0.8;  // 失業率感度
const ECON_W_TAX = 0.4;       // 経済内の税率重み
const ECON_W_UNEMP = 0.6;     // 経済内の失業重み

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

export interface InfraFactors {
  waterDemand: number;
  waterSupply: number;
  electricityDemand: number;
  electricitySupply: number;
}

export interface EconomyFactors {
  citizenTaxRate: number;   // 0.01-0.10 など
  unemploymentRate: number; // 0..1
}

export function calculateSatisfactionWithFactors(
  params: CityParameters | undefined,
  infra: InfraFactors,
  economy: EconomyFactors,
  penalty?: number
): number {
  // P: 都市パラメータ（0..1）
  let pSum = 0; let pWsum = 0;
  if (params) {
    (Object.keys(PARAM_WEIGHTS) as (keyof typeof PARAM_WEIGHTS)[]).forEach((k) => {
      const w = PARAM_WEIGHTS[k] as number;
      const v = (params[k] as number) / 100; // 0..1
      pSum += v * w;
      pWsum += w;
    });
  }
  const P = pWsum > 0 ? clamp01(pSum / pWsum) : 0.5;

  // I: インフラ（不足率から負寄与）
  const rW = infra.waterDemand > 0 ? clamp01(Math.max(0, infra.waterDemand - infra.waterSupply) / infra.waterDemand) : 0;
  const rE = infra.electricityDemand > 0 ? clamp01(Math.max(0, infra.electricityDemand - infra.electricitySupply) / infra.electricityDemand) : 0;
  const I = clamp01(1 - clamp01(INFRA_A * rW + INFRA_B * rE));

  // E: 経済（住民税・失業率）
  const tPrime = clamp01((economy.citizenTaxRate - 0.05) / 0.05); // 基準5%
  const e_tax = 1 - ECON_ALPHA_TAX * tPrime;
  const uPrime = clamp01(economy.unemploymentRate);
  const e_unemp = 1 - ECON_BETA_UNEMP * uPrime;
  const E = clamp01(ECON_W_TAX * e_tax + ECON_W_UNEMP * e_unemp);

  let score01 = clamp01(WEIGHT_P * P + WEIGHT_I * I + WEIGHT_E * E);
  let result = score01 * 100;
  if (typeof penalty === 'number') result -= penalty;
  return Math.max(0, Math.min(100, Math.round(result)));
}


