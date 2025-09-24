import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
// import { TbLoader2, TbBuilding } from 'react-icons/tb';
import { TbLoader2 } from 'react-icons/tb';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  isVisible?: boolean;
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = '読み込み中...',
  progress = 0,
  isVisible = true,
  onComplete
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // プログレスバーのアニメーション
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
        if (progress >= 100 && onComplete) {
          setTimeout(() => {
            onComplete();
          }, 500);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(0);
      setIsAnimating(false);
    }
  }, [progress, isVisible, onComplete]);

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-gradient-to-b from-slate-900 via-indigo-800 to-amber-200">
      <div className="p-8 w-full max-w-md mx-4">
        {/* ローディングアイコン */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <TbLoader2 
              size={48} 
              className="text-white animate-spin" 
            />
            {/* <div className="absolute inset-0 flex items-center justify-center">
              <TbBuilding size={24} className="text-white" />
            </div> */}
          </div>
        </div>

        {/* メッセージ */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            <span className="inline-block bg-slate-900/20 px-4 py-2 rounded-lg shadow">
              Revitalize
            </span>
          </h2>
          <p className="text-white/90 text-sm">
            {message}
          </p>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full bg-white/90 rounded-full transition-all duration-500 ease-out ${
                isAnimating ? 'animate-pulse' : ''
              }`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LoadingScreen;
