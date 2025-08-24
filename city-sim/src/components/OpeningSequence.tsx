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
  const [currentPhase, setCurrentPhase] = useState<'blackout' | 'prologue' | 'appointment' | 'logo' | 'transition' | 'complete'>('blackout');
  const [prologueVisible, setPrologueVisible] = useState(false);
  const [prologueText1, setPrologueText1] = useState(false);
  const [prologueText2, setPrologueText2] = useState(false);
  const [prologueText3, setPrologueText3] = useState(false);
  const [appointmentVisible, setAppointmentVisible] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [transitionOpacity, setTransitionOpacity] = useState(0);

  useEffect(() => {
    // フェーズ1: ブラックアウト
    const blackoutTimer = setTimeout(() => {
      setCurrentPhase('prologue');
    }, 3000);

    return () => clearTimeout(blackoutTimer);
  }, []);

  useEffect(() => {
    if (currentPhase === 'prologue') {
      // フェーズ2: プロローグ表示
      setPrologueVisible(true);
      
      // 1段落目を表示
      const text1Timer = setTimeout(() => {
        setPrologueText1(true);
      }, 500);
      
      // 1段落目を消して2段落目を表示
      const text2Timer = setTimeout(() => {
        setPrologueText1(false);
        setPrologueText2(true);
      }, 4500);
      
      // 2段落目を消して3段落目を表示
      const text3Timer = setTimeout(() => {
        setPrologueText2(false);
        setPrologueText3(true);
      }, 8500);
      
      // プロローグ終了
      const prologueTimer = setTimeout(() => {
        setCurrentPhase('appointment');
      }, 12500);

      return () => {
        clearTimeout(text1Timer);
        clearTimeout(text2Timer);
        clearTimeout(text3Timer);
        clearTimeout(prologueTimer);
      };
    }
  }, [currentPhase]);

  useEffect(() => {
    if (currentPhase === 'appointment') {
      // フェーズ3: 任命書表示
      setPrologueVisible(false);
      setAppointmentVisible(true);
      
      const appointmentTimer = setTimeout(() => {
        setCurrentPhase('logo');
      }, 5000);

      return () => clearTimeout(appointmentTimer);
    }
  }, [currentPhase]);

  useEffect(() => {
    if (currentPhase === 'logo') {
      // フェーズ4: タイトルロゴ表示
      setAppointmentVisible(false);
      setLogoVisible(true);
      
      const logoTimer = setTimeout(() => {
        setCurrentPhase('transition');
      }, 4000);

      return () => clearTimeout(logoTimer);
    }
  }, [currentPhase]);

  useEffect(() => {
    if (currentPhase === 'transition') {
      // フェーズ5: ゲーム画面への遷移
      const transitionTimer = setTimeout(() => {
        setTransitionOpacity(1);
      }, 1000);

      const completeTimer = setTimeout(() => {
        setCurrentPhase('complete');
        onComplete();
      }, 4000);

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

      {/* プロローグ */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-2000 ${
          prologueVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-center text-white relative w-full h-full">
          {/* 1段落目 */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
            prologueText1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="text-center">
              <p className="text-2xl leading-relaxed max-w-2xl mx-auto">
                少子化、流行病、空洞化...<br />
                様々な要因によって地方は <br />
                急速に衰退の一途を辿っている
              </p>
            </div>
          </div>
          
          {/* 2段落目 */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
            prologueText2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="text-center">
              <p className="text-2xl leading-relaxed max-w-2xl mx-auto">
                事態を重く見た中央政府は <br />
                起死回生の一手として、<br />
                国土再生庁を設立した
              </p>
            </div>
          </div>
          
          {/* 3段落目 */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
            prologueText3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="text-center">
              <p className="text-2xl leading-relaxed max-w-2xl mx-auto">
                あなたの目的は、<br />
                この新たな計画を成功させること
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 任命書 */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
          appointmentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
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
        className={`absolute inset-0 flex items-center justify-center transition-all duration-2000 ${
          logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          <img 
            src="logo.svg" 
            alt="logo" 
            className="w-[600px] h-[200px] object-contain p-10"
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