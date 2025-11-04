import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TbDeviceFloppy, TbFolderOpen, TbUsers, TbCash, TbStar, TbClock, TbArrowLeft } from 'react-icons/tb';
import LoadingScreen from './LoadingScreen';
import { GRID_WIDTH, GRID_HEIGHT } from '../constants/gridConstants';

type Props = {
  onStart: () => void;
  onShowSettings: () => void;
  onLoadGame: () => void;
};

// ビル生成関数
const createBuilding = (rows: number, cols: number, width: string, height: string, margin: string, isStart: boolean = false) => {
  return (
    <div className="flex flex-col border-2 border-gray-600/20">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex">
          {[...Array(cols)].map((_, colIndex) => (
            <div
            key={`window-${rowIndex}-${colIndex}`}
            className={`${width} ${height} mx-1 mt-1 ${margin} transition-all duration-300 ${
              isStart
              ? 'bg-gray-700/30'
              : Math.random() > 0.8
                ? 'bg-yellow-300/80 shadow-lg shadow-yellow-200/50 glow-yellow animate-pulse'
                : ''
            }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

interface SaveSlot {
  id: string;
  cityName: string;
  timestamp: number;
  stats: any;
  hasData: boolean;
}

const StartScreen: React.FC<Props> = ({ onStart, onShowSettings, onLoadGame }) => {
  const [logoVisible, setLogoVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [isTransitioning, _setIsTransitioning] = useState(false);
  const [overlayVisible, _setOverlayVisible] = useState(false);
  const [overlayActive, _setOverlayActive] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const loadingStartedAtRef = useRef<number | null>(null);

  // セーブデータの確認
  useEffect(() => {
    checkSaveData();
  }, []);

  const checkSaveData = () => {
    const slots: SaveSlot[] = [];
    let hasAnySave = false;

    // 6つのスロットをチェック
    for (let i = 0; i < 6; i++) {
      const slotId = `slot_${i}`;
      const slotKey = `city-sim-save-${slotId}`;
      const saveDataString = localStorage.getItem(slotKey);
      
      if (saveDataString) {
        try {
          const saveData = JSON.parse(saveDataString);
          slots.push({
            id: slotId,
            cityName: saveData.cityName || `都市${i + 1}`,
            timestamp: saveData.timestamp || Date.now(),
            stats: saveData.gameStats,
            hasData: true
          });
          hasAnySave = true;
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
      } else {
        slots.push({
          id: slotId,
          cityName: `スロット${i + 1}`,
          timestamp: 0,
          stats: null,
          hasData: false
        });
      }
    }

    setHasSaveData(hasAnySave);
    setSaveSlots(slots);
  };

  // アニメーション用
  useEffect(() => {
    // ロゴを0.5秒後に表示
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
    }, 500);

    // ボタンを1.5秒後に表示
    const buttonTimer = setTimeout(() => {
      setButtonsVisible(true);
    }, 1500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  const buildingWindows = useMemo(
    () =>
      Array.from({ length: 12 }).map(() => ({
        rows: 4 + Math.floor(Math.random() * 6),
        cols: 2 + Math.floor(Math.random() * 5), 
      })),
    []
  );

  // 新規ゲーム開始アニメーション
  const handleNewGameClick = () => {
    // 既存のアニメーションを無効化し、直接オープニングシーケンスを開始
    onStart();
  };

  // 続きから開始
  const handleLoadGameClick = () => {
    setIsSaveLoadOpen(true);
  };

  // セーブデータからロード
  const handleLoadFromSlot = async (slotId: string) => {
    setIsLoading(true);
    setLoadingProgress(10);
    loadingStartedAtRef.current = Date.now();
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      setLoadingProgress((p) => (p < 95 ? Math.min(95, p + 3) : p));
    }, 120);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const slotKey = `city-sim-save-${slotId}`;
    const saveDataString = localStorage.getItem(slotKey);
    
    if (saveDataString) {
      try {
        const saveData = JSON.parse(saveDataString);
        // 全ストアの状態を復元
        const { saveLoadRegistry } = await import('../stores/SaveLoadRegistry');
        saveLoadRegistry.loadAllStores(saveData);

        // ロード後に道路接続とインフラ、描画に関連する状態を再計算
        try {
          const { useFacilityStore } = await import('../stores/FacilityStore');
          const { useInfrastructureStore } = await import('../stores/InfrastructureStore');

          useFacilityStore.getState().clearRoadConnectivityCache();
          useFacilityStore.getState().updateRoadConnectivity({ width: GRID_WIDTH, height: GRID_HEIGHT });
          useInfrastructureStore.getState().calculateInfrastructure(useFacilityStore.getState().facilities);
        } catch {}
        // 最小表示時間（200ms）を確保
        const started = loadingStartedAtRef.current ?? Date.now();
        const elapsed = Date.now() - started;
        const remain = Math.max(0, 200 - elapsed);
        if (remain > 0) await new Promise((r) => setTimeout(r, remain));
        setLoadingProgress(100);
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        // ロード完了フラグを設定
        localStorage.setItem('city-sim-loaded', 'true');
        // セーブデータをロードしてゲーム開始
        onLoadGame();
      } catch (error) {
        console.error('セーブデータの読み込みに失敗しました:', error);
      }
    }

    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setIsLoading(false);
    setLoadingProgress(100);
    loadingStartedAtRef.current = null;
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'なし';
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
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

  // セーブデータ選択パネルが開いている場合
  if (isSaveLoadOpen) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative border border-gray-600">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">セーブデータを選択</h2>
            <button 
              onClick={() => setIsSaveLoadOpen(false)} 
              className="text-gray-400 hover:text-white transition-colors"
            >
              <TbArrowLeft size={24} />
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
                    <button
                      onClick={() => handleLoadFromSlot(slot.id)}
                      className="w-full flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      <TbFolderOpen />
                      ロード
                    </button>
                  ) : (
                    <button
                      onClick={handleNewGameClick}
                      className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded transition-colors"
                    >
                      <TbDeviceFloppy />
                      新規ゲーム
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* ローディング（セーブ選択パネル表示中のロード） */}
          {isLoading && (
            <LoadingScreen
              isVisible={true}
              message={'データを読み込んでいます...'}
              progress={loadingProgress}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-gray-900 z-[2000]${(overlayVisible || isTransitioning) ? ' cursor-none' : ''}`}
    >
      {/* スタートアニメーション用オーバーレイ */}
      {overlayVisible && (
        <div
          className="fixed inset-0 z-[3000] pointer-events-none transition-all duration-[2500ms]"
          style={{
            background: 'linear-gradient(to bottom, #fef9c3 0%, #fcd34d 40%, #60a5fa 100%)',
            opacity: overlayActive ? 1 : 0,
            transition: 'opacity 2.5s',
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* 装飾 */}
      <div className="absolute left-0 bottom-0 flex flex-row gap-4 items-end">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            {createBuilding(buildingWindows[i].rows, buildingWindows[i].cols, 'w-6', 'h-4', 'mb-2', overlayVisible)}
          </div>
        ))}
      </div>

      {/* ロゴ */}
      <div className="bg-white shadow-lg items-center rounded-lg overflow-hidden">
        <div 
          className={`transition-all duration-5000 ease-out ${
            logoVisible 
              ? 'transform translate-y-0' 
              : 'transform translate-y-full'
          }`}
        >
          <img src="logo.svg" alt="Titile Logo" className="w-full h-36 object-contain p-4" />
        </div>
      </div>

      {/* ボタン */}
      <div 
        className={`flex flex-col items-center space-y-4 mt-12 transition-all duration-3000 ease-out ${
          buttonsVisible 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform translate-y-full opacity-0'
        }`}
      >
        {/* 新規ゲームボタン */}
        <button
          onClick={handleNewGameClick}
          disabled={isTransitioning}
          className="border-2 border-white/20 bg-gray-500/75 hover:bg-gray-700/75 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48 backdrop-blur-sm mix-blend-screen shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          初めから
        </button>

        {/* 続きからボタン */}
        <button
          onClick={handleLoadGameClick}
          disabled={isTransitioning || !hasSaveData}
          className={`border-2 border-white/20 px-8 py-2 rounded-lg text-2xl shadow-lg w-48 backdrop-blur-sm mix-blend-screen shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed ${
            hasSaveData 
              ? 'bg-gray-500/75 hover:bg-gray-700/75 text-white' 
              : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
          }`}
        >
          続きから
        </button>

        {/* 設定ボタン */}
        <button
          onClick={onShowSettings}
          disabled={isTransitioning}
          className="border-2 border-white/20 bg-gray-500/75 hover:bg-gray-700/75 text-white px-8 py-2 rounded-lg text-2xl shadow-lg w-48 backdrop-blur-sm mix-blend-screen shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          設定
        </button>
      </div>

      {/* タイトルからロード中のローディング */}
      {isLoading && (
        <LoadingScreen
          isVisible={true}
          message={'データを読み込んでいます...'}
          progress={loadingProgress}
        />
      )}

    </div>
  );
};

export default StartScreen;
