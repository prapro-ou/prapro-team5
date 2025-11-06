import type { CityParameters } from '../types/cityParameter';
import type { Facility } from '../types/facility';
import { getFacilityRegistry } from './facilityLoader';

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export interface InfraFactors {
  waterDemand: number;
  waterSupply: number;
  electricityDemand: number;
  electricitySupply: number;
}

export interface PopulationConfig {
  birthBase: number;
  deathBase: number;
  baseInRate: number;
  baseOutRate: number;
  maxInflowMultiplier: number;
  maxOutflowMultiplier: number;
  // HealthIndex 内部重み
  sanitationWeight: number; // 0..1
  infrastructureWeight: number; // 0..1
  infraWaterShortageWeight: number; // 0..1
  infraElectricShortageWeight: number; // 0..1
}

export const POPULATION_CONFIG: PopulationConfig = {
  birthBase: 0.08,
  deathBase: 0.09,
  baseInRate: 0.05,
  baseOutRate: 0.04,
  maxInflowMultiplier: 3.0,
  maxOutflowMultiplier: 5.0,
  sanitationWeight: 0.7,
  infrastructureWeight: 0.3,
  infraWaterShortageWeight: 0.5,
  infraElectricShortageWeight: 0.5,
};

export interface PopulationInputs {
  population: number;
  satisfaction: number; // 0..100
  unemploymentRate: number; // 0..1
  facilities: Facility[];
  cityParameters?: CityParameters;
  infra: InfraFactors;
}

export interface PopulationChangeResult {
  delta: number;
  births: number;
  deaths: number;
  inflow: number;
  outflow: number;
  appliedHousingCap: boolean;
  details: {
    attractiveness: number;
    healthIndex: number;
    employmentScore: number;
    housingCapacity: number;
    vacancyRate: number;
    inflowMultiplier: number;
    outflowMultiplier: number;
  };
}

export function calculateAttractiveness(satisfaction: number): number {
  return clamp(satisfaction / 100, 0, 1);
}

function calculateInfrastructureHealthFactor(
  infra: InfraFactors,
  config: PopulationConfig
): number {
  const waterShortage = infra.waterDemand > 0
    ? clamp((infra.waterDemand - infra.waterSupply) / infra.waterDemand, 0, 1)
    : 0;
  const electricShortage = infra.electricityDemand > 0
    ? clamp((infra.electricityDemand - infra.electricitySupply) / infra.electricityDemand, 0, 1)
    : 0;
  const shortage = clamp(
    config.infraWaterShortageWeight * waterShortage +
    config.infraElectricShortageWeight * electricShortage,
    0,
    1
  );
  return clamp(1 - shortage, 0, 1);
}

export function calculateHealthIndex(
  cityParameters: CityParameters | undefined,
  infra: InfraFactors,
  cfg?: Partial<PopulationConfig>
): number {
  const config = { ...POPULATION_CONFIG, ...cfg } as PopulationConfig;
  const sanitation = cityParameters ? clamp(cityParameters.sanitation / 100, 0, 1) : 0.5;
  const infraHealth = calculateInfrastructureHealthFactor(infra, config);
  const score =
    config.sanitationWeight * sanitation +
    config.infrastructureWeight * infraHealth;
  return clamp(score, 0, 1);
}

export function calculateEmploymentScore(unemploymentRate: number): number {
  return clamp(1 - clamp(unemploymentRate, 0, 1), 0, 1);
}

export function calculateHousingCapacity(facilities: Facility[]): number {
  if (!facilities.length) return 0;
  const registry = getFacilityRegistry();
  let capacity = 0;
  for (const f of facilities) {
    if (!f.isActive) continue;
    const info = registry[f.type];
    if (!info) continue;
    if (info.category !== 'residential') continue;
    const basePop = typeof info.basePopulation === 'number' ? info.basePopulation : 0;
    capacity += basePop;
  }
  return Math.max(0, Math.floor(capacity));
}

export function calculateVacancyRate(population: number, housingCapacity: number): number {
  if (housingCapacity <= 0) return 0;
  const rate = 1 - population / housingCapacity;
  return clamp(rate, 0, 1);
}

export function calculatePopulationChange(
  inputs: PopulationInputs,
  cfg?: Partial<PopulationConfig>
): PopulationChangeResult {
  const config = { ...POPULATION_CONFIG, ...cfg } as PopulationConfig;

  const population = Math.max(0, Math.floor(inputs.population));
  const attractiveness = calculateAttractiveness(inputs.satisfaction);
  const healthIndex = calculateHealthIndex(inputs.cityParameters, inputs.infra, config);
  const employmentScore = calculateEmploymentScore(inputs.unemploymentRate);
  const housingCapacity = calculateHousingCapacity(inputs.facilities);
  const vacancyRate = calculateVacancyRate(population, housingCapacity);

  const fertilityBonus = clamp((attractiveness - 0.5) * 0.4, -0.5, 1.0);
  const births = Math.floor(population * config.birthBase * (1 + fertilityBonus));

  const mortalityPenalty = Math.max(0, 0.5 - healthIndex) * 1.2;
  const deaths = Math.floor(population * config.deathBase * (1 + mortalityPenalty));

  const inflowMultiplier = clamp(
    1.2 * attractiveness +
    0.8 * employmentScore +
    1.0 * vacancyRate,
    0,
    config.maxInflowMultiplier
  );
  const inflow = Math.floor(population * config.baseInRate * inflowMultiplier);

  const overCapacityFactor = housingCapacity > 0 ? Math.max(0, population / housingCapacity - 1) : 1;
  const outflowMultiplier = clamp(
    1.5 * (1 - attractiveness) +
    1.2 * clamp(inputs.unemploymentRate, 0, 1) +
    2.0 * overCapacityFactor,
    0,
    config.maxOutflowMultiplier
  );
  const outflow = Math.floor(population * config.baseOutRate * outflowMultiplier);

  let delta = (births + inflow) - (deaths + outflow);
  let appliedHousingCap = false;
  if (housingCapacity > 0 && population + delta > housingCapacity) {
    delta = housingCapacity - population;
    appliedHousingCap = true;
  }

  return {
    delta,
    births,
    deaths,
    inflow,
    outflow,
    appliedHousingCap,
    details: {
      attractiveness,
      healthIndex,
      employmentScore,
      housingCapacity,
      vacancyRate,
      inflowMultiplier,
      outflowMultiplier,
    },
  };
}
