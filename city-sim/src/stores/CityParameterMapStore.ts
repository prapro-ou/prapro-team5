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

const LUT_SIZE = 256;
function buildLinearLUT(): Float32Array {
  const lut = new Float32Array(LUT_SIZE);
  for (let i = 0; i < LUT_SIZE; i++) {
    const u = i / (LUT_SIZE - 1); // 0..1
    lut[i] = Math.max(0, 1 - u);  // 線形減衰（最近傍参照）
  }
  return lut;
}
const ATTENUATION_LUT = buildLinearLUT();

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
    const { config, maps, dirtyChunks } = get();
    const { width, height, chunkSize } = config;
    if (width <= 0 || height <= 0) return;
    if (radius <= 0 || strength === 0) return;

    const map = maps[param];
    const r = Math.floor(radius);
    const minX = Math.max(0, cx - r);
    const maxX = Math.min(width - 1, cx + r);
    const minY = Math.max(0, cy - r);
    const maxY = Math.min(height - 1, cy + r);
    const rInv = 1 / Math.max(1, radius);
    const sign = mode === 'sub' ? -1 : 1;

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) continue;
        const u = dist * rInv; // 0..1
        const idx = (u >= 1) ? (LUT_SIZE - 1) : (u <= 0 ? 0 : (u * (LUT_SIZE - 1)) | 0);
        const a = ATTENUATION_LUT[idx];
        const delta = sign * strength * a;
        map[y * width + x] += delta;
      }
    }

    const minChunkX = Math.floor(minX / chunkSize);
    const maxChunkX = Math.floor(maxX / chunkSize);
    const minChunkY = Math.floor(minY / chunkSize);
    const maxChunkY = Math.floor(maxY / chunkSize);
    for (let cyi = minChunkY; cyi <= maxChunkY; cyi++) {
      for (let cxi = minChunkX; cxi <= maxChunkX; cxi++) {
        dirtyChunks.add(chunkKey(cxi, cyi));
      }
    }
    set({ maps, dirtyChunks: new Set(dirtyChunks) });
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


