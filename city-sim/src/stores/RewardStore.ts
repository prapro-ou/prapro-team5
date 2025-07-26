import { create } from 'zustand';
import type { Reward } from '../components/RewardPanel';
import { useGameStore } from './GameStore';
import { useFacilityStore } from './FacilityStore';

interface RewardStore {
  rewards: Reward[];
  claimReward: (id: string) => void;
  updateAchievements: () => void;
}

const initialRewards: Reward[] = [
  {
    id: 'pop1000',
    title: '人口1000人達成',
    description: '人口が1000人に到達すると報酬がもらえます。',
    condition: '人口1000人以上',
    achieved: false,
    claimed: false,
    reward: '¥10,000',
  },
  {
    id: 'park5',
    title: '公園5つ設置',
    description: '公園を5つ設置すると特別な報酬がもらえます。',
    condition: '公園5つ以上',
    achieved: false,
    claimed: false,
    reward: '特別な公園',
  },
];

export const useRewardStore = create<RewardStore>((set, get) => ({
  rewards: initialRewards,
  claimReward: (id: string) => {
    set(state => ({
      rewards: state.rewards.map(r =>
        r.id === id ? { ...r, claimed: true } : r
      )
    }));
    // 報酬反映処理（資金加算など）
    const reward = get().rewards.find(r => r.id === id);
    if (reward && reward.achieved && !reward.claimed) {
      if (reward.id === 'pop1000') {
        useGameStore.getState().addMoney(10000);
      }
      // 他の報酬処理もここに追加
    }
  },
  updateAchievements: () => {
    const stats = useGameStore.getState().stats;
    const facilities = useFacilityStore.getState().facilities;
    set(state => ({
      rewards: state.rewards.map(r => {
        if (r.id === 'pop1000') {
          return { ...r, achieved: stats.population >= 1000 };
        }
        if (r.id === 'park5') {
          const parkCount = facilities.filter(f => f.type === 'park').length;
          return { ...r, achieved: parkCount >= 5 };
        }
        return r;
      })
    }));
  },
}));
