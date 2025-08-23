import { create } from 'zustand';

interface SoundState {
  bgmVolume: number;
  sfxVolume: number;
  snsVolume: number;
  isBgmMuted: boolean;
  isBgmPlaying: boolean;
  isSfxMuted: boolean;
  isSNSMuted: boolean;
  bgmType: 'bgm' | 'bgm3';
  setBgmVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setSNSVolume: (v: number) => void;
  setBgmMuted: (m: boolean) => void;
  setIsBgmPlaying: (p: boolean) => void;
  setSfxMuted: (m: boolean) => void;
  setSNSMuted: (m: boolean) => void;
  setBgmType: (t: 'bgm' | 'bgm3') => void;
}

// localStorageから初期値取得
const getLS = (key: string, def: any) => {
  const v = localStorage.getItem(key);
  if (v === null) return def;
  if (typeof def === 'boolean') return v === 'true';
  if (typeof def === 'number') return Number(v);
  return v;
};

export const useSoundStore = create<SoundState>((set) => ({
  bgmVolume: getLS('citysim_bgmVolume', 0.2),
  sfxVolume: getLS('citysim_sfxVolume', 0.7),
  snsVolume: getLS('citysim_snsVolume', 0.1),
  isBgmMuted: getLS('citysim_isBgmMuted', false),
  isBgmPlaying: getLS('citysim_isBgmPlaying', false),
  isSfxMuted: getLS('citysim_isSfxMuted', true),
  isSNSMuted: getLS('citysim_isSNSMuted', true),
  bgmType: getLS('citysim_bgmType', 'bgm'),
  setBgmVolume: (v) => {
    set({ bgmVolume: v });
    localStorage.setItem('citysim_bgmVolume', String(v));
  },
  setBgmType: (t) => {
    set({ bgmType: t });
    localStorage.setItem('citysim_bgmType', t);
  },
  setSfxVolume: (v) => {
    set({ sfxVolume: v });
    localStorage.setItem('citysim_sfxVolume', String(v));
  },
  setSNSVolume: (v) => {
    set({ snsVolume: v });
    localStorage.setItem('citysim_snsVolume', String(v));
  },
  setBgmMuted: (m) => {
    set({ isBgmMuted: m });
    localStorage.setItem('citysim_isBgmMuted', String(m));
  },
  setIsBgmPlaying: (p) => {
    set({ isBgmPlaying: p });
    localStorage.setItem('citysim_isBgmPlaying', String(p));
  },
  setSfxMuted: (m) => {
    set({ isSfxMuted: m });
    localStorage.setItem('citysim_isSfxMuted', String(m));
  },
  setSNSMuted: (m) => {
    set({ isSNSMuted: m });
    localStorage.setItem('citysim_isSNSMuted', String(m));
  },
}));
