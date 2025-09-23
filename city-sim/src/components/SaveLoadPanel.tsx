import React, { useState, useEffect } from 'react';
import { TbX, TbDeviceFloppy, TbFolderOpen, TbDownload, TbUsers, TbCash, TbStar, TbClock } from 'react-icons/tb';
import { useSaveLoad } from '../hooks/useSaveLoad';
import { useGameStore } from '../stores/GameStore';
import { useFacilityStore } from '../stores/FacilityStore';
import { useTerrainStore } from '../stores/TerrainStore';
import { useInfrastructureStore } from '../stores/InfrastructureStore';
import { useAchievementStore } from '../stores/AchievementStore';
import { saveLoadRegistry } from '../stores/SaveLoadRegistry';
import LoadingScreen from './LoadingScreen';

interface SaveSlot {
  id: string;
  cityName: string;
  timestamp: number;
  stats: any;
  hasData: boolean;
}

interface SaveLoadPanelProps {
  onClose: () => void;
}

export const SaveLoadPanel: React.FC<SaveLoadPanelProps> = ({ onClose }) => {
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKind, setLoadingKind] = useState<'idle' | 'load' | 'save'>('idle');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ストアから状態を取得
  const gameStats = useGameStore(state => state.stats);
  const facilities = useFacilityStore(state => state.facilities);
  const terrainMap = useTerrainStore(state => state.terrainMap);
  const infrastructureStatus = useInfrastructureStore(state => state.status);
  const achievements = useAchievementStore(state => state.achievements);
  
  // セーブ・ロードフック
  const { saveGame, loadGame, exportGame } = useSaveLoad();

  // セーブスロットの初期化
  useEffect(() => {
    initializeSaveSlots();
  }, []);

  const initializeSaveSlots = () => {
    const slots: SaveSlot[] = [];
    
    // 6つのスロットを作成
    for (let i = 0; i < 6; i++) {
      const slotId = `slot_${i}`;
      const slotData = localStorage.getItem(`city-sim-save-${slotId}`);
      
      if (slotData) {
        try {
          const parsed = JSON.parse(slotData);
          slots.push({
            id: slotId,
            cityName: parsed.cityName || `都市${i + 1}`,
            timestamp: parsed.timestamp || Date.now(),
            stats: parsed.gameStats,
            hasData: true
          });
        }
        catch {
          // 破損データの場合は空スロットとして扱う
          slots.push({
            id: slotId,
            cityName: `スロット${i + 1}`,
            timestamp: 0,
            stats: null,
            hasData: false
          });
        }
      }
      else {
        slots.push({
          id: slotId,
          cityName: `スロット${i + 1}`,
          timestamp: 0,
          stats: null,
          hasData: false
        });
      }
    }
    
    setSaveSlots(slots);
  };

  const handleSave = async (slotId: string) => {
    setIsLoading(true);
    setLoadingKind('save');
    setMessage(null);
    
    try {
      const result = await saveGame(
        gameStats,
        facilities,
        terrainMap,
        infrastructureStatus,
        achievements,
        {
          isPaused: false,
          gameSpeed: 1,
          soundEnabled: true,
          bgmVolume: 0.2,
          sfxVolume: 0.7
        },
        `都市${slotId.split('_')[1]}`
      );
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        initializeSaveSlots(); // スロット一覧を更新
      }
      else {
        setMessage({ type: 'error', text: result.message });
      }
    }
    catch (error) {
      setMessage({ type: 'error', text: 'セーブに失敗しました' });
    }
    finally {
      setIsLoading(false);
      setLoadingKind('idle');
    }
  };

  const handleLoad = async (_slotId: string) => {
    setIsLoading(true);
    setLoadingKind('load');
    setMessage(null);
    
    try {
      const result = await loadGame();
      
      if (result.success && result.data) {
        // 管理システムを使用して全ストアを復元
        saveLoadRegistry.loadAllStores(result.data);
        
        setMessage({ type: 'success', text: 'ゲームを読み込みました' });
        onClose(); // パネルを閉じる
      } 
      else {
        setMessage({ type: 'error', text: result.message });
      }
    }
    catch (error) {
      setMessage({ type: 'error', text: 'ロードに失敗しました' });
    }
    finally {
      setIsLoading(false);
      setLoadingKind('idle');
    }
  };

  const handleExport = async () => {
    try {
      await exportGame(
        gameStats,
        facilities,
        terrainMap,
        infrastructureStatus,
        achievements,
        {
          isPaused: false,
          gameSpeed: 1,
          soundEnabled: true,
          bgmVolume: 0.2,
          sfxVolume: 0.7
        },
        'My City'
      );
      
      setMessage({ type: 'success', text: 'ゲームをエクスポートしました' });
    }
    catch (error) {
      setMessage({ type: 'error', text: 'エクスポートに失敗しました' });
    }
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'なし';
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatStats = (stats: any) => {
    if (!stats) return null;
    return {
      population: stats.population?.toLocaleString() || '0',
      money: stats.money?.toLocaleString() || '0',
      level: stats.level || '1',
      date: stats.date ? `${stats.date.year}/${stats.date.month}/${stats.date.week}` : '1/1/1'
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-gray-600">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">セーブ・ロード</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <TbX size={24} />
          </button>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-600/20 text-green-400 border border-green-600' :
            message.type === 'error' ? 'bg-red-600/20 text-red-400 border border-red-600' :
            'bg-blue-600/20 text-blue-400 border border-blue-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* クイックアクション */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <TbDownload />
            エクスポート
          </button>
        </div>

        {/* セーブスロット一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saveSlots.map((slot) => (
            <div key={slot.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{slot.cityName}</h3>
                <div className="text-sm text-gray-400">
                  {formatDate(slot.timestamp)}
                </div>
              </div>
              
              {slot.hasData && slot.stats && (
                <div className="mb-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <TbUsers className="text-blue-400" />
                    {formatStats(slot.stats)?.population}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <TbCash className="text-green-400" />
                    ${formatStats(slot.stats)?.money}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <TbStar className="text-yellow-400" />
                    Lv.{formatStats(slot.stats)?.level}
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <TbClock className="text-purple-400" />
                    {formatStats(slot.stats)?.date}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                {slot.hasData ? (
                  <>
                    <button
                      onClick={() => handleLoad(slot.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      <TbFolderOpen />
                      ロード
                    </button>
                    <button
                      onClick={() => handleSave(slot.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      <TbDeviceFloppy />
                      上書き
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleSave(slot.id)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm px-3 py-2 rounded transition-colors"
                  >
                    <TbDeviceFloppy />
                    新規セーブ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ローディング表示 */}
        {isLoading && loadingKind === 'load' && (
          <LoadingScreen
            isVisible={true}
            message={message?.text || 'データを読み込んでいます...'}
            progress={70}
          />
        )}
      </div>
    </div>
  );
};
