import { useEffect } from 'react';
import { playPanelSound, playCoinSound } from './SoundSettings';

export type Reward = {
  id: string;
  title: string;
  description: string;
  condition: string;
  achieved: boolean;
  claimed: boolean;
  reward: string;
  hidden?: boolean; // 報酬が隠されているかどうか
};

export type RewardPanelProps = {
  rewards: Reward[];
  onClaim: (id: string) => void;
  onClose: () => void;
};

export default function RewardPanel({ rewards, onClaim, onClose }: RewardPanelProps) {
  // パネルが開かれたときに報酬の状態を確認
  useEffect(() => {
    console.log('RewardPanel opened, current rewards:', rewards);
  }, [rewards]);
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 w-[400px] z-[3000]">
      <div className="max-h-[400px] overflow-y-auto mb-4">
        <ul className="space-y-4">
          {rewards.map(r => (
            <li key={r.id} className="border-b pb-4">
              <div className="font-semibold text-lg">
                {r.title}
              </div>
              <div className="text-gray-600 text-sm mb-1">
                {r.hidden && !r.achieved ? '隠された報酬です。条件を達成すると詳細が明らかになります。' : r.description}
              </div>
              <div className="text-xs mb-2">
                条件: {r.hidden && !r.achieved ? '???' : r.condition}
              </div>
              <div className="mb-2">
                報酬: <span className="font-bold text-yellow-600">
                  {r.hidden && !r.achieved ? '???' : r.reward}
                </span>
              </div>
              {r.achieved ? (
                r.claimed ? (
                  <span className="text-green-600 font-bold">受け取り済み</span>
                ) : (
                  <button
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold shadow"
                    onClick={() => {
                      playCoinSound(); // 報酬受け取り時にコイン音を再生
                      onClaim(r.id);
                    }}
                  >
                    受け取る
                  </button>
                )
              ) : (
                <span className="text-gray-400">未達成</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-center">
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold shadow"
          onClick={() => {
            playPanelSound();
            onClose();
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
