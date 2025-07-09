import { useState, useRef, useEffect } from 'react';
import { TbMusic, TbMusicOff } from "react-icons/tb";
import bgmSrc from '../assets/bgm.mp3';
// ↓ この行を新しく追加
import clickSfxSrc from '../assets/click.mp3';

export function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 効果音を再生するための関数
  const playClickSound = () => {
    const sfx = new Audio(clickSfxSrc);
    sfx.volume = 0.7; // 効果音の音量を70%に設定
    sfx.play();
  };

  const togglePlay = () => {
    // ↓ 関数が始まった瞬間に効果音を再生する
    playClickSound();

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = volume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error("BGMの再生に失敗しました．", error);
          setIsPlaying(false);
        });
      }
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  return (
    <div className="fixed bottom-4 right-4 z-[900] flex items-center gap-4">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />
      <button
        onClick={togglePlay}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-4 rounded-lg shadow-lg transition-colors"
      >
        {isPlaying ? <TbMusic /> : <TbMusicOff />}
      </button>
      <audio ref={audioRef} src={bgmSrc} loop />
    </div>
  );
}