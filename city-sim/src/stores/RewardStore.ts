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
    reward: '後楽園（まだ実装していません）',
  },
  {
    id: 'level2',
    title: 'レベル2達成',
    description: '都市レベルが2に到達すると報酬がもらえます。',
    condition: 'レベル2以上',
    achieved: false,
    claimed: false,
    reward: '¥5,000',
  },
  {
    id: 'level5',
    title: 'レベル5達成',
    description: '都市レベルが5に到達すると報酬がもらえます。',
    condition: 'レベル5以上',
    achieved: false,
    claimed: false,
    reward: '¥20,000',
  },
  {
    id: 'halfYear',
    title: '半年間の市長',
    description: '都市を半年間運営した記念の報酬です。',
    condition: 'ゲーム内時間で半年経過（26週）',
    achieved: false,
    claimed: false,
    reward: '¥25,000 + 称号「経験豊富な市長」',
  },
  {
    id: 'oneYear',
    title: '一年間の市長',
    description: '都市を一年間運営した記念の報酬です。',
    condition: 'ゲーム内時間で1年経過（52週）',
    achieved: false,
    claimed: false,
    reward: '¥50,000 + 称号「ベテラン市長」',
  },
];

export const useRewardStore = create<RewardStore>((set, get) => ({
  rewards: initialRewards,
  claimReward: (id: string) => {
    const reward = get().rewards.find(r => r.id === id);
    if (reward && reward.achieved && !reward.claimed) {
      if (reward.id === 'pop1000') {
        useGameStore.getState().addMoney(10000);
      }
      if (reward.id === 'level2') {
        useGameStore.getState().addMoney(5000);
      }
      if (reward.id === 'level5') {
        useGameStore.getState().addMoney(20000);
      }
      if (reward.id === 'halfYear') {
        useGameStore.getState().addMoney(25000);
        // TODO: 称号「経験豊富な市長」の実装
      }
      if (reward.id === 'oneYear') {
        useGameStore.getState().addMoney(50000);
        // TODO: 称号「ベテラン市長」の実装
      }
      set(state => ({
        rewards: state.rewards.map(r =>
          r.id === id ? { ...r, claimed: true } : r
        )
      }));
    }
  },

  updateAchievements: () => {
    const stats = useGameStore.getState().stats;
    const facilities = useFacilityStore.getState().facilities;
    console.log('updateAchievements called, current stats:', stats);
    set(state => ({
      rewards: state.rewards.map(r => {
        if (r.id === 'pop1000') {
          return { ...r, achieved: stats.population >= 1000 };
        }
        if (r.id === 'park5') {
          const parkCount = facilities.filter(f => f.type === 'park').length;
          return { ...r, achieved: parkCount >= 5 };
        }
        if (r.id === 'level2') {
          return { ...r, achieved: stats.level >= 2 };
        }
        if (r.id === 'level5') {
          return { ...r, achieved: stats.level >= 5 };
        }
        if (r.id === 'halfYear') {
          // ゲーム内時間で半年経過（26週）
          console.log(`HalfYear reward check - Current week: ${stats.date.week}, Required: 26, Achieved: ${stats.date.week >= 26}`);
          return { ...r, achieved: stats.date.week >= 26 };
        }
        if (r.id === 'oneYear') {
          // ゲーム内時間で1年経過（52週）
          console.log(`OneYear reward check - Current week: ${stats.date.week}, Required: 52, Achieved: ${stats.date.week >= 52}`);
          return { ...r, achieved: stats.date.week >= 52 };
        }
        return r;
      })
    }));
  },
}));
