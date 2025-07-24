import { useState, useRef, useEffect } from 'react';
// 設置音グローバル関数をexport
export let playBuildSound = () => {};
// TbBellOffアイコンを追加
import { TbMusic, TbMusicOff, TbVolume, TbBell, TbBellOff } from "react-icons/tb";
import bgmSrc from '../assets/bgm.mp3';
import clickSfxSrc from '../assets/click.mp3';
import buildSfxSrc from '../assets/build.mp3';

/**
 * BGMと効果音の再生・音量調整を行うコンポーネント．
 */
export function BGMPlayer() {
  // --- State Declarations ---
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.2);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [sfxVolume, setSfxVolume] = useState(0.7);
  // SEがミュートされているかを管理する状態を追加（初期値trueでミュート）
  const [isSfxMuted, setIsSfxMuted] = useState(true);

  // --- Effects ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = bgmVolume;
    }
  }, [bgmVolume]);

  // --- Functions ---
  /**
   * クリック効果音を再生する．ミュート状態を考慮する．
   */
  const playClickSound = () => {
    // ミュートが有効な場合は何もしない
    if (isSfxMuted) return;
    
    const sfx = new Audio(clickSfxSrc);
    sfx.volume = sfxVolume;
    sfx.play().catch(e => console.error("SEの再生に失敗しました", e));
  };

  /**
   * BGMの再生・停止を切り替える．
   */
  const toggleBgmPlay = () => {
    playClickSound(); // BGMボタンクリック時にもSEを再生
    if (!audioRef.current) return;

    if (isBgmPlaying) {
      audioRef.current.pause();
      setIsBgmPlaying(false);
    } else {
      audioRef.current.volume = bgmVolume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsBgmPlaying(true))
                   .catch(error => {
                      console.error("BGM再生に失敗", error);
                      setIsBgmPlaying(false);
                   });
      }
    }
  };
  
  /**
   * SEのミュート状態を切り替える．
   */
  const toggleSfxMute = () => {
    const nextMuteState = !isSfxMuted;
    setIsSfxMuted(nextMuteState);

    // ミュートを解除したときに、確認用のテスト音を鳴らす
    if (!nextMuteState) {
      const sfx = new Audio(clickSfxSrc);
      sfx.volume = sfxVolume;
      sfx.play().catch(e => console.error("SEの再生に失敗しました", e));
    }
  };

  /**
   * BGM音量スライダーの変更をハンドルする．
   */
  const handleBgmVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBgmVolume(Number(e.target.value));
  };

  /**
   * SE音量スライダーの変更をハンドルする．
   */
  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSfxVolume(Number(e.target.value));
  };

  // 設置音再生関数を最新の状態でグローバルに代入
  useEffect(() => {
    playBuildSound = () => {
      if (isSfxMuted) return;
      const sfx = new Audio(buildSfxSrc);
      sfx.volume = sfxVolume;
      sfx.play().catch(() => {});
    };
  }, [isSfxMuted, sfxVolume]);

  // --- Render ---
  return (
    <div className="bg-gray-700/50 p-4 rounded-lg space-y-4">
      {/* BGM設定 */}
      <div className="flex items-center justify-between">
        <label htmlFor="bgm-volume-slider" className="text-white font-semibold">BGM 音量</label>
        <div className="flex items-center gap-3">
          <TbVolume className="text-white" />
          <input
            id="bgm-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bgmVolume}
            onChange={handleBgmVolumeChange}
            className="w-32 h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer"
          />
          <button
            onClick={toggleBgmPlay}
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
          >
            {isBgmPlaying ? <TbMusic /> : <TbMusicOff />}
          </button>
        </div>
      </div>

      {/* SE設定 */}
      <div className="flex items-center justify-between">
        <label htmlFor="sfx-volume-slider" className="text-white font-semibold">SE 音量</label>
        <div className="flex items-center gap-3">
          <TbBell className="text-white" />
          <input
            id="sfx-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sfxVolume}
            onChange={handleSfxVolumeChange}
            className="w-32 h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer"
          />
          {/* SEミュート切り替えボタン */}
          <button
            onClick={toggleSfxMute}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          >
            {isSfxMuted ? <TbBellOff /> : <TbBell />}
          </button>
        </div>
      </div>

      <audio ref={audioRef} src={bgmSrc} loop />
    </div>
  );
}