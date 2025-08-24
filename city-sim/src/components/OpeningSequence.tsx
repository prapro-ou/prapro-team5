import React, { useState, useEffect } from 'react';

interface OpeningSequenceProps {
  onComplete: () => void;
}

// 数字を全角に変換する関数
const toFullWidth = (num: number): string => {
  const fullWidthDigits = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
  return num.toString().split('').map(char => {
    const digit = parseInt(char);
    return isNaN(digit) ? char : fullWidthDigits[digit];
  }).join('');
};

// 元号を計算する関数
const getJapaneseEra = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (year >= 2019) {
    const reiwaYear = year === 2019 ? (month >= 5 ? 1 : 0) : year - 2018;
    return `令和${toFullWidth(reiwaYear)}年${toFullWidth(month)}月${toFullWidth(day)}日`;
  }
  else if (year >= 1989) {
    const heiseiYear = year === 1989 ? 1 : year - 1988;
    return `平成${toFullWidth(heiseiYear)}年${toFullWidth(month)}月${toFullWidth(day)}日`;
  }
  else if (year >= 1926) {
    const showaYear = year === 1926 ? 1 : year - 1925;
    return `昭和${toFullWidth(showaYear)}年${toFullWidth(month)}月${toFullWidth(day)}日`;
  }
  else {
    return `${toFullWidth(year)}年${toFullWidth(month)}月${toFullWidth(day)}日`;
  }
};

const OpeningSequence: React.FC<OpeningSequenceProps> = ({ onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState<'blackout' | 'appointment' | 'logo' | 'transition' | 'complete'>('blackout');
  const [appointmentVisible, setAppointmentVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [transitionOpacity, setTransitionOpacity] = useState(0);

  useEffect(() => {
    // フェーズ1: ブラックアウト
    const blackoutTimer = setTimeout(() => {
      setCurrentPhase('appointment');
    }, 5000);

    return () => clearTimeout(blackoutTimer);
  }, []);

  useEffect(() => {
    if (currentPhase === 'appointment') {
      // フェーズ2: 任命書表示
      setAppointmentVisible(true);
      
      // デバッグ用: 任命書から次に遷移しないようにコメントアウト
      // const appointmentTimer = setTimeout(() => {
      //   setCurrentPhase('logo');
      // }, 10000);

      // return () => clearTimeout(appointmentTimer);
    }
  }, [currentPhase]);

  useEffect(() => {
    if (currentPhase === 'logo') {
      // フェーズ3: タイトルロゴ表示
      setAppointmentVisible(false);
      setLogoVisible(true);
      
      const logoTimer = setTimeout(() => {
        setCurrentPhase('transition');
      }, 2000);

      return () => clearTimeout(logoTimer);
    }
  }, [currentPhase]);

  useEffect(() => {
    if (currentPhase === 'transition') {
      // フェーズ4: ゲーム画面への遷移
      const transitionTimer = setTimeout(() => {
        setTransitionOpacity(1);
      }, 500);

      const completeTimer = setTimeout(() => {
        setCurrentPhase('complete');
        onComplete();
      }, 2000);

      return () => {
        clearTimeout(transitionTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [currentPhase, onComplete]);

  return (
    <div className="fixed inset-0 z-[3000] pointer-events-none bg-black">
      {/* 背景 - ブラックアウト */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-1000 ${
          currentPhase === 'blackout' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 任命書 */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
          appointmentVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <div className="bg-gradient-to-br from-white to-gray-50 shadow-2xl p-5 max-w-4xl mx-2 border-2 border-gray-200">
          <div className="border-2 border-gray-900 px-12 py-16 bg-white font-serif">
            {/* ヘッダー部分 */}
            <div className="text-center mb-12">
              <div className="inline-block border-b-4 border-gray-800 pb-4 mb-4">
                <h1 className="text-5xl font-bold text-gray-800 font-serif">辞令</h1>
              </div>
            </div>
            
            {/* 本文部分 */}
            <div className="text-gray-900 mb-4 text-left font-serif">
							<p className="mb-3 text-xl leading-relaxed">{getJapaneseEra(new Date())}をもって</p>
              <p className="mb-3 text-xl leading-relaxed">貴殿を　地方開発特任官　に任命する</p>
              <p className="mb-3 text-xl leading-relaxed">国土の再生と地域社会の発展に尽力せよ</p>
            </div>
							<p className="text-xl text-gray-900 mb-2 text-right font-serif">以上</p>
						<div className="text-left font-serif">
              <p className="text-xl text-gray-900">{getJapaneseEra(new Date())}</p>
            </div>
						<div className="text-right mt-5 font-serif">
							<p className="text-xl text-gray-900 mb-2">国土再生庁</p>
						</div>
          </div>
        </div>
      </div>

      {/* タイトルロゴ */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
          logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          <img 
            src="/logo.svg" 
            alt="City Simulator" 
            className="w-80 h-32 object-contain p-4"
          />
        </div>
      </div>

      {/* ゲーム画面への遷移オーバーレイ */}
      <div 
        className={`absolute inset-0 bg-gray-900 transition-opacity duration-2000 ${
          currentPhase === 'transition' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ opacity: transitionOpacity }}
      />
    </div>
  );
};

export default OpeningSequence; 