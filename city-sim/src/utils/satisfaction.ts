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


