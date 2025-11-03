import { create } from 'zustand';
import type { CityParameterType } from '../types/cityParameter';

// 都市パラメータマップの設定
export interface CityParameterMapsConfig {
  width: number;
  height: number;
  chunkSize: number;
}

export type ParameterKey = CityParameterType;

export interface CityParameterMapsState {
  config: CityParameterMapsConfig;
  maps: Record<ParameterKey, Float32Array>;
  dirtyChunks: Set<string>;
}

export interface CityParameterMapsActions {
  applyStamp: (
    param: ParameterKey,
    cx: number,
    cy: number,
    radius: number,
    strength: number,
    mode: 'add' | 'sub'
  ) => void;
  applyFacility: (facilityId: string, mode: 'add' | 'sub') => void;
  moveFacility: (facilityId: string, from: { x: number; y: number }, to: { x: number; y: number }) => void;
  sampleAt: (param: ParameterKey, x: number, y: number) => number;
  sampleAverage: (param: ParameterKey, positions: { x: number; y: number }[]) => number;
  readDirtyChunks: () => { x: number; y: number }[];
  clearDirty: () => void;
  resetTo: (config: CityParameterMapsConfig) => void;
}

export type CityParameterMapsStore = CityParameterMapsState & CityParameterMapsActions;

const PARAMS: ParameterKey[] = [
  'entertainment',
  'security',
  'sanitation',
  'transit',
  'environment',
  'education',
  'disaster_prevention',
  'tourism',
];

function newMaps(width: number, height: number): Record<ParameterKey, Float32Array> {
  const len = width * height;
  const m = {} as Record<ParameterKey, Float32Array>;
  for (const k of PARAMS) m[k] = new Float32Array(len);
  return m;
}

function chunkKey(cx: number, cy: number): string { return `${cx}:${cy}`; }

export const useCityParameterMapStore = create<CityParameterMapsStore>((set, get) => ({
  config: { width: 0, height: 0, chunkSize: 32 },
  maps: newMaps(0, 0),
  dirtyChunks: new Set<string>(),

  resetTo: (config) => set(() => ({
    config,
    maps: newMaps(config.width, config.height),
    dirtyChunks: new Set<string>(),
  })),

  applyStamp: (param, cx, cy, radius, strength, mode) => {
    void param; void cx; void cy; void radius; void strength; void mode;
  },

  applyFacility: (_facilityId, _mode) => {
  },

  moveFacility: (_facilityId, _from, _to) => {
  },

  sampleAt: (param, x, y) => {
    const { config, maps } = get();
    if (config.width <= 0 || config.height <= 0) return 0;
    const ix = Math.max(0, Math.min(config.width - 1, x | 0));
    const iy = Math.max(0, Math.min(config.height - 1, y | 0));
    return maps[param][iy * config.width + ix] || 0;
  },

  sampleAverage: (param, positions) => {
    if (!positions.length) return 0;
    let sum = 0;
    for (const p of positions) sum += get().sampleAt(param, p.x, p.y);
    return sum / positions.length;
  },

  readDirtyChunks: () => {
    const { dirtyChunks } = get();
    const out: { x: number; y: number }[] = [];
    for (const key of dirtyChunks) {
      const [sx, sy] = key.split(':');
      out.push({ x: Number(sx), y: Number(sy) });
    }
    return out;
  },

  clearDirty: () => set({ dirtyChunks: new Set<string>() }),
}));


