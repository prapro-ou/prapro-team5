import React, { useRef, useState } from 'react';
import { BGMPlayer } from './SoundSettings';
import { TbX, TbFileText, TbDeviceFloppy, TbFolderOpen, TbDownload, TbUsers, TbCash, TbStar, TbClock } from 'react-icons/tb';
import { useGameStore } from '../stores/GameStore';
import { useUIStore } from '../stores/UIStore';
import { saveLoadRegistry } from '../stores/SaveLoadRegistry';
import LoadingScreen from './LoadingScreen';

interface SettingsPanelProps {
  onClose: () => void;
  onShowCredits: () => void;
  isGameStarted: boolean;
  onReturnToTitle?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onShowCredits, isGameStarted, onReturnToTitle }) => {
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKind, setLoadingKind] = useState<'idle' | 'load' | 'save'>('idle');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const progressTimerRef = useRef<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ゲーム状態を取得
  const gameStats = useGameStore(state => state.stats);
  
  // UI設定を取得
  const { showOpeningSequence, setShowOpeningSequence } = useUIStore();

  // ゲーム中かどうかを判定（スタート画面が閉じられている）
  const isGameInProgress = isGameStarted;

  const handleSave = async (slotId: string) => {
    setIsLoading(true);
    setLoadingKind('save');
    setMessage(null);
    
    try {
      // 全ストアの状態を取得
      const saveData = saveLoadRegistry.saveAllStores();
      
      // セーブデータをローカルストレージに保存
      const slotKey = `city-sim-save-${slotId}`;
      const saveDataWithMeta = {
        ...saveData,
        cityName: `都市${slotId.split('_')[1]}`,
        timestamp: Date.now(),
        gameStats: gameStats
      };
      
      localStorage.setItem(slotKey, JSON.stringify(saveDataWithMeta));
      
      setMessage({ type: 'success', text: `ゲームが保存されました: 都市${slotId.split('_')[1]}` });
    } 
    catch (error) {
      setMessage({ type: 'error', text: 'セーブに失敗しました' });
    } 
    finally {
      setIsLoading(false);
      setLoadingKind('idle');
    }
  };

  const handleLoad = async (slotId: string) => {
    setIsLoading(true);
    setLoadingKind('load');
    setMessage(null);
    setLoadingProgress(10);

    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      setLoadingProgress((p) => (p < 95 ? Math.min(95, p + 3) : p));
    }, 120);
    // 次フレームで描画させてから重い処理を開始
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    
    try {
      const slotKey = `city-sim-save-${slotId}`;
      const saveDataString = localStorage.getItem(slotKey);
      
      if (!saveDataString) {
        setMessage({ type: 'error', text: 'セーブデータが見つかりません' });
        return;
      }

      const saveData = JSON.parse(saveDataString);
      setLoadingProgress(50);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      
      // 全ストアの状態を復元
      saveLoadRegistry.loadAllStores(saveData);
      setLoadingProgress(85);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      
      setMessage({ type: 'success', text: 'ゲームを読み込みました' });
      setLoadingProgress(100);
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      onClose(); // 設定パネルを閉じる
    } 
    catch (error) {
      setMessage({ type: 'error', text: 'ロードに失敗しました' });
    } 
    finally {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setLoadingProgress(100);
      setIsLoading(false);
      setLoadingKind('idle');
    }
  };

  const handleExport = async () => {
    try {
      const saveData = saveLoadRegistry.saveAllStores();
      const dataStr = JSON.stringify(saveData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `city-sim-${gameStats.population > 0 ? 'MyCity' : 'NewGame'}-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
      
      setMessage({ type: 'success', text: 'ゲームをエクスポートしました' });
    }
    catch (error) {
      setMessage({ type: 'error', text: 'エクスポートに失敗しました' });
    }
  };

  const getSaveSlotInfo = (slotId: string) => {
    const slotKey = `city-sim-save-${slotId}`;
    const saveDataString = localStorage.getItem(slotKey);
    
    if (!saveDataString) return null;
    
    try {
      const saveData = JSON.parse(saveDataString);
      return {
        cityName: saveData.cityName || `都市${slotId.split('_')[1]}`,
        timestamp: saveData.timestamp || 0,
        stats: saveData.gameStats
      };
    }
    catch {
      return null;
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
      money: (Number.isFinite(stats.money) ? Math.floor(stats.money) : 0).toLocaleString(),
      level: stats.level || '1',
      date: stats.date ? `${stats.date.year}/${stats.date.month}/${stats.date.week}` : '1/1/1'
    };
  };

  if (isSaveLoadOpen) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-gray-600">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">セーブ・ロード</h2>
            <button 
              onClick={() => setIsSaveLoadOpen(false)} 
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
            {Array.from({ length: 6 }, (_, i) => {
              const slotId = `slot_${i}`;
              const slotInfo = getSaveSlotInfo(slotId);
              const hasData = slotInfo !== null;
              
              return (
                <div key={slotId} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{slotInfo?.cityName || `スロット${i + 1}`}</h3>
                    <div className="text-sm text-gray-400">
                      {formatDate(slotInfo?.timestamp || 0)}
                    </div>
                  </div>
                  
                  {hasData && slotInfo?.stats && (
                    <div className="mb-3 space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <TbUsers className="text-blue-400" />
                        {formatStats(slotInfo.stats)?.population}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <TbCash className="text-green-400" />
                        ${formatStats(slotInfo.stats)?.money}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <TbStar className="text-yellow-400" />
                        Lv.{formatStats(slotInfo.stats)?.level}
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <TbClock className="text-purple-400" />
                        {formatStats(slotInfo.stats)?.date}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {hasData ? (
                      <>
                        <button
                          onClick={() => handleLoad(slotId)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm px-3 py-2 rounded transition-colors"
                        >
                          <TbFolderOpen />
                          ロード
                        </button>
                        <button
                          onClick={() => handleSave(slotId)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm px-3 py-2 rounded transition-colors"
                        >
                          <TbDeviceFloppy />
                          上書き
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSave(slotId)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm px-3 py-2 rounded transition-colors"
                      >
                        <TbDeviceFloppy />
                        新規セーブ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ローディング画面（タイトル/設定からのロード/セーブ中のみ） */}
          {isLoading && loadingKind === 'load' && (
            <LoadingScreen
              isVisible={true}
              message={message?.text || 'データを読み込んでいます...'}
              progress={loadingProgress}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-600">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <TbX size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">設定</h2>
        <div className="space-y-4">
          {/* 既存のBGMプレイヤー */}
          <BGMPlayer />

          {/* オープニングシークエンス設定（タイトル画面でのみ表示） */}
          {!isGameInProgress && (
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">オープニング</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOpeningSequence}
                    onChange={(e) => setShowOpeningSequence(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                新規ゲーム開始時にオープニングを表示するかどうかを設定します
              </p>
            </div>
          )}

          {/* ゲーム中のみセーブ・ロードボタンを表示 */}
          {isGameInProgress && (
            <button 
              onClick={() => setIsSaveLoadOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold p-4 rounded-lg transition-colors"
            >
              <TbDeviceFloppy />
              セーブ・ロード
            </button>
          )}

          {/* クレジット表示ボタン */}
          <button 
            onClick={onShowCredits}
            className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold p-4 rounded-lg transition-colors"
          >
            <TbFileText />
            クレジットを表示
          </button>

          {/* ゲーム中のみタイトルに戻るボタンを表示 */}
          {isGameInProgress && onReturnToTitle && (
            <button 
              onClick={onReturnToTitle}
              className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold p-4 rounded-lg transition-colors"
            >
              タイトルに戻る
            </button>
          )}
        </div>
      </div>
    </div>
  );
};