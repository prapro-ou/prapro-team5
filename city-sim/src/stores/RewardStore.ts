import { create } from 'zustand';
import type { Reward } from '../components/RewardPanel';
import { useGameStore } from './GameStore';
import { useFacilityStore } from './FacilityStore';
import { saveLoadRegistry } from './SaveLoadRegistry';

interface RewardStore {
  rewards: Reward[];
  claimReward: (id: string) => void;
  updateAchievements: () => void;
  hasClaimableRewards: () => boolean;
  
  // セーブ・ロード機能
  saveState: () => any;
  loadState: (savedState: any) => void;
  resetToInitial: () => void;
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
    hidden: true,
  },
  {
    id: 'oneYear',
    title: '一年間の市長',
    description: '都市を一年間運営した記念の報酬です。',
    condition: 'ゲーム内時間で1年経過（52週）',
    achieved: false,
    claimed: false,
    reward: '¥50,000 + 称号「ベテラン市長」',
    hidden: true,
  },
  {
    id: 'commercial10',
    title: '商業地区発展',
    description: '商業施設の発展により多くの人々が街に移住してきました。',
    condition: '商業施設10個建設',
    achieved: false,
    claimed: false,
    reward: '人口+500人 + ¥15,000',
    hidden: true,
  },
  {
    id: 'megacity',
    title: 'メガシティの誕生',
    description: '巨大都市を築き上げた偉大な市長！',
    condition: '人口5000人達成',
    achieved: false,
    claimed: false,
    reward: '¥100,000 + 特別建物解放',
    hidden: true,
  },
  {
    id: 'richMayor',
    title: '裕福な市長',
    description: '経済的成功を収めた手腕の持ち主！',
    condition: '所持金500,000円達成',
    achieved: false,
    claimed: false,
    reward: '税収+30% (永続)',
    hidden: true,
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
      if (reward.id === 'commercial10') {
        useGameStore.getState().addMoney(15000);
        useGameStore.getState().addPopulation(500);
      }
      if (reward.id === 'megacity') {
        useGameStore.getState().addMoney(100000);
        // TODO: 特別建物解放の実装
      }
      if (reward.id === 'richMayor') {
        // TODO: 税収+30%の永続効果実装
        console.log('Rich Mayor reward claimed - Tax bonus should be applied!');
      }
      set(state => ({
        rewards: state.rewards.map(r =>
          r.id === id ? { ...r, claimed: true } : r
        )
      }));
    }
  },

  updateAchievements: () => {
    const { stats } = useGameStore.getState();
    const facilities = useFacilityStore.getState().facilities;
    
    set(state => ({
      rewards: state.rewards.map(reward => {
        let achieved = false;
        
        switch (reward.id) {
          case 'pop1000':
            achieved = stats.population >= 1000;
            break;
          case 'park5':
            achieved = facilities.filter(f => f.type === 'park').length >= 5;
            break;
          case 'level2':
            achieved = stats.level >= 2;
            break;
          case 'level5':
            achieved = stats.level >= 5;
            break;
          case 'halfYear':
            achieved = stats.date.totalWeeks >= 26;
            break;
          case 'oneYear':
            achieved = stats.date.totalWeeks >= 52;
            break;
          case 'commercial10':
            achieved = facilities.filter(f => f.type === 'commercial').length >= 10;
            break;
          case 'megacity':
            achieved = stats.population >= 5000;
            break;
          case 'richMayor':
            achieved = stats.money >= 500000;
            break;
        }
        
        return { ...reward, achieved };
      })
    }));
  },

  hasClaimableRewards: () => {
    return get().rewards.some(r => r.achieved && !r.claimed);
  },

  saveState: () => {
    const state = get();
    return {
      rewards: state.rewards
    };
  },

  loadState: (savedState: any) => {
    if (savedState && savedState.rewards) {
      set({ rewards: savedState.rewards });
    }
  },

  resetToInitial: () => {
    set({ rewards: initialRewards });
  }
}));

saveLoadRegistry.register('reward', useRewardStore.getState());
