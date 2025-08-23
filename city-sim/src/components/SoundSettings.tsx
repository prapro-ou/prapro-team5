import { useRef, useEffect, useState } from 'react';
import { useSoundStore } from '../stores/SoundStore';
// 効果音グローバル関数をexport
export let playBuildSound = () => {};
export let playLevelUpSound = () => {};
export let playPanelSound = () => {};
export let playPressEnterSound = () => {};
export let playCoinSound = () => {};
export let playSelectSound = () => {};
export let playSelect1Sound = () => {};
export let playBgm2Sound = () => {};
export let stopBgm2Sound = () => {};
export let playDeleatSound = () => {}; // 施設削除用SE
// TbBellOffアイコンを追加
import { TbMusic, TbMusicOff, TbVolume, TbVolumeOff, TbBell, TbBellOff } from "react-icons/tb";
import bgmSrc from '../assets/bgm.mp3';
import bgm3Src from '../assets/bgm3.mp3';
import clickSfxSrc from '../assets/click.mp3';
import buildSfxSrc from '../assets/build.mp3';
import levelupSfxSrc from '../assets/levelup.mp3';
import coinSfxSrc from '../assets/coin.mp3';
import selectSfxSrc from '../assets/select.mp3';
import select1SfxSrc from '../assets/select1.mp3';
import pressEnterSfxSrc from '../assets/press_enter.mp3';
import bgm2Src from '../assets/bgm2.mp3';
import deleatSfxSrc from '../assets/deleat.mp3';

let bgm2Audio: HTMLAudioElement | null = null;

/**
 * BGMと効果音の再生・音量調整を行うコンポーネント．
 */
export function BGMPlayer() {
  const { bgmType, setBgmType } = useSoundStore();
  // グローバルストアから音量・ミュート状態を取得
  const {
    bgmVolume, setBgmVolume,
    sfxVolume, setSfxVolume,
    snsVolume, setSNSVolume,
    isBgmMuted,
    isSfxMuted, setSfxMuted,
    isSNSMuted, setSNSMuted
  } = useSoundStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isBgmPlaying, setIsBgmPlaying,
  } = useSoundStore();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = bgmType === 'bgm' ? bgmSrc : bgm3Src;
      audioRef.current.volume = bgmVolume;
      audioRef.current.muted = isBgmMuted;
      if (isBgmPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [bgmType, bgmVolume, isBgmMuted, isBgmPlaying]);

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
      audioRef.current.muted = isBgmMuted;
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
    setSfxMuted(nextMuteState);

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

    playLevelUpSound = () => {
      if (isSfxMuted) return;
      const sfx = new Audio(levelupSfxSrc);
      sfx.volume = sfxVolume;
      sfx.play().catch(() => {});
    };

    playPanelSound = () => {
      if (isSfxMuted) return;
      const sfx = new Audio(clickSfxSrc);
      sfx.volume = sfxVolume * 0.7; // パネル音は少し控えめ
      sfx.play().catch(() => {});
    };

    playCoinSound = () => {
      if (isSfxMuted) return;
      const sfx = new Audio(coinSfxSrc);
      sfx.volume = sfxVolume;
      sfx.play().catch(() => {});
    };

    playSelectSound = () => {
      if (isSfxMuted) return;
      const sfx = new Audio(selectSfxSrc);
      sfx.volume = sfxVolume;
      sfx.play().catch(() => {});
    };

    playSelect1Sound = () => {
      if (isSfxMuted) return;
      const sfx = new Audio(select1SfxSrc);
      sfx.volume = sfxVolume;
      sfx.play().catch(() => {});
    };
    playPressEnterSound = () => {
      if (isSNSMuted) return;
      const sfx = new Audio(pressEnterSfxSrc);
      sfx.volume = snsVolume;
      sfx.play().catch(() => {});
    };
    playBgm2Sound = () => {
      if (isBgmMuted) return;
      if (bgm2Audio) {
        bgm2Audio.pause();
        bgm2Audio.currentTime = 0;
      }
      bgm2Audio = new Audio(bgm2Src);
      bgm2Audio.volume = bgmVolume;
      bgm2Audio.loop = true;
      bgm2Audio.play().catch(() => {});
    };
    stopBgm2Sound = () => {
      if (bgm2Audio) {
        bgm2Audio.pause();
        bgm2Audio.currentTime = 0;
        bgm2Audio = null;
      }
    };
    playDeleatSound = () => {
      if (isSfxMuted) return;
      const sfx = new Audio(deleatSfxSrc);
      sfx.volume = sfxVolume;
      sfx.play().catch(() => {});
    };
  }, [isSfxMuted, sfxVolume, isSNSMuted, snsVolume]);

  // --- Render ---
  return (
    <div className="bg-gray-700/50 p-4 rounded-lg">
      {/* 音量バー3段縦並び */}
      <div className="flex flex-col gap-6">
        {/* BGM設定 */}
        <div className="flex flex-row items-center gap-4">
          <label htmlFor="bgm-volume-slider" className="text-white font-semibold w-24">BGM 音量</label>
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
          <div className="flex flex-col items-center gap-1">
            <select
              value={bgmType}
              onChange={e => setBgmType(e.target.value as 'bgm' | 'bgm3')}
              className="bg-gray-600 text-white rounded px-2 py-1"
              style={{ minWidth: '72px' }}
            >
              <option value="bgm">BGM1</option>
              <option value="bgm3">BGM2</option>
            </select>
            <button
              onClick={toggleBgmPlay}
              className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors mt-1"
            >
              {isBgmPlaying ? <TbMusic /> : <TbMusicOff />}
            </button>
          </div>
        </div>
        {/* SE設定 */}
        <div className="flex flex-row items-center gap-4">
          <label htmlFor="sfx-volume-slider" className="text-white font-semibold w-24">SE 音量</label>
          <TbVolume className="text-white" />
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
          <button
            onClick={toggleSfxMute}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          >
            {isSfxMuted ? <TbVolumeOff /> : <TbVolume />}
          </button>
        </div>
        {/* SNS通知音 */}
        <div className="flex flex-row items-center gap-4">
          <label className="text-white font-semibold w-24">SNS通知音</label>
          <TbBell className="text-white" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={snsVolume}
            onChange={e => setSNSVolume(Number(e.target.value))}
            className="w-32 h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer"
          />
          <button
            onClick={() => setSNSMuted(!isSNSMuted)}
            className={`bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg transition-colors`}
          >
            {isSNSMuted ? <TbBellOff /> : <TbBell />}
          </button>
        </div>
      </div>
      <audio ref={audioRef} src={bgmSrc} loop />
    </div>
  );
}