import { useState, useRef, useEffect } from 'react';
import { TbMusic, TbMusicOff } from "react-icons/tb";
import bgmSrc from '../assets/bgm.mp3';

export function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  // ↓ 音量を管理するための状態を追加 (0.0 から 1.0 の間)
  const [volume, setVolume] = useState(0.2); // 初期音量を20%に設定
  const audioRef = useRef<HTMLAudioElement>(null);

  // volumeの状態が変わるたびに，実際の音声の音量を変更する
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // 最初の再生時に，設定した音量を適用する
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
  
  // スライダーが動かされたときに音量を更新する関数
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  return (
    // ↓ コントロール類をまとめるためのdivを追加
    <div className="fixed bottom-4 right-4 z-[900] flex items-center gap-4">
      {/* 音量調整スライダー */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
      />

      {/* BGMのON/OFFを切り替えるボタン */}
      <button
        onClick={togglePlay}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-4 rounded-lg shadow-lg transition-colors"
      >
        {isPlaying ? <TbMusic /> : <TbMusicOff />}
      </button>
      
      {/* audio要素は画面には表示されない */}
      <audio ref={audioRef} src={bgmSrc} loop />
    </div>
  );
}