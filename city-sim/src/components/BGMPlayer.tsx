import { useState, useRef } from 'react';
import { TbMusic, TbMusicOff } from "react-icons/tb";
// ↓ この行を新しく追加
import bgmSrc from '../assets/bgm.mp3';

export function BGMPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
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

  return (
    <div>
      {/* ↓ srcの指定方法を書き換える */}
      <audio ref={audioRef} src={bgmSrc} loop />

      <button
        onClick={togglePlay}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-4 rounded-lg shadow-lg transition-colors z-[900]"
      >
        {isPlaying ? <TbMusic /> : <TbMusicOff />}
      </button>
    </div>
  );
}