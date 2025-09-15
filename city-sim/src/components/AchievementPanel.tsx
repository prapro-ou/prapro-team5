import { useEffect, useState } from 'react';
import { playPanelSound, playCoinSound } from './SoundSettings';
import type { Achievement } from '../types/achievement';
import { 
  RARITY_COLORS, 
  RARITY_BG_COLORS, 
  CATEGORY_NAMES, 
  RARITY_NAMES 
} from '../types/achievement';
import { 
  sortAchievementsByPriority 
} from '../utils/achievementLoader';

interface AchievementPanelProps {
  achievements: Achievement[];
  onClaim: (id: string) => void;
  onClose: () => void;
}

export default function AchievementPanel({ achievements, onClaim, onClose }: AchievementPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // パネルが開かれたときに実績の状態を確認
  useEffect(() => {
    console.log('AchievementPanel opened, current achievements:', achievements);
  }, [achievements]);
  
  // カテゴリ一覧を取得
  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category).filter(Boolean)))];
  
  // フィルタリングされた実績を取得
  const filteredAchievements = achievements.filter(achievement => {
    // カテゴリフィルタ
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    
    // ステータスフィルタ
    if (selectedStatus !== 'all') {
      switch (selectedStatus) {
        case 'achieved':
          return achievement.achieved;
        case 'unachieved':
          return !achievement.achieved;
        case 'claimed':
          return achievement.claimed;
        case 'unclaimed':
          return achievement.achieved && !achievement.claimed;
        default:
          return true;
      }
    }
    
    return true;
  });
  
  // 優先度順にソート
  const sortedAchievements = sortAchievementsByPriority(filteredAchievements);
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-6 w-[600px] h-[85vh] z-[3000] flex flex-col">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">実績</h2>
        <button
          onClick={() => {
            playPanelSound();
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>
      
      {/* フィルター */}
      <div className="flex gap-4 mb-4">
        {/* カテゴリフィルター */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">すべてのカテゴリ</option>
          {categories.slice(1).map(category => (
            <option key={category} value={category}>
              {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category}
            </option>
          ))}
        </select>
        
        {/* ステータスフィルター */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">すべてのステータス</option>
          <option value="unachieved">未達成</option>
          <option value="achieved">達成済み</option>
          <option value="unclaimed">受け取り可能</option>
          <option value="claimed">受け取り済み</option>
        </select>
      </div>
      
      {/* 実績リスト */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedAchievements.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            該当する実績がありません
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAchievements.map(achievement => (
              <div
                key={achievement.id}
                className={`border rounded-lg p-4 ${
                  achievement.achieved 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* 実績ヘッダー */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {achievement.hidden && !achievement.achieved ? '？？？' : achievement.name}
                      </h3>
                      {achievement.rarity && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          RARITY_BG_COLORS[achievement.rarity]
                        } ${RARITY_COLORS[achievement.rarity]}`}>
                          {RARITY_NAMES[achievement.rarity]}
                        </span>
                      )}
                    </div>
                    
                    {/* カテゴリ表示 */}
                    {achievement.category && (
                      <span className="text-xs text-gray-500">
                        {CATEGORY_NAMES[achievement.category]}
                      </span>
                    )}
                  </div>
                  
                  {/* ステータス表示 */}
                  <div className="text-right">
                    {achievement.achieved ? (
                      achievement.claimed ? (
                        <span className="text-green-600 font-bold text-sm">受け取り済み</span>
                      ) : (
                        <span className="text-yellow-600 font-bold text-sm">受け取り可能</span>
                      )
                    ) : (
                      <span className="text-gray-400 text-sm">未達成</span>
                    )}
                  </div>
                </div>
                
                {/* 説明文 */}
                <div className="text-gray-600 text-sm mb-2">
                  {achievement.hidden && !achievement.achieved 
                    ? '隠された実績です。条件を達成すると詳細が明らかになります。'
                    : achievement.description
                  }
                </div>
                
                {/* 条件と報酬 */}
                <div className="text-xs text-gray-500 mb-3">
                  <div>条件: {achievement.hidden && !achievement.achieved ? '？？？' : achievement.condition}</div>
                  <div>
                    報酬: <span className="font-bold text-yellow-600">
                      {achievement.hidden && !achievement.achieved ? '？？？' : achievement.reward}
                    </span>
                  </div>
                </div>
                
                {/* アクションボタン */}
                {achievement.achieved && !achievement.claimed && (
                  <button
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold shadow transition-colors"
                    onClick={() => {
                      playCoinSound();
                      onClaim(achievement.id);
                    }}
                  >
                    受け取る
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 統計情報 */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 flex-shrink-0">
        <div className="flex justify-between">
          <span>総実績数: {achievements.length}</span>
          <span>達成済み: {achievements.filter(a => a.achieved).length}</span>
          <span>受け取り可能: {achievements.filter(a => a.achieved && !a.claimed).length}</span>
        </div>
      </div>
    </div>
  );
}
