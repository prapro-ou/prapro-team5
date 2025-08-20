import { TbTrophy, TbStar, TbCash, TbChartBar} from 'react-icons/tb';
import { useGameStore } from '../stores/GameStore';
import { useTimeControlStore } from '../stores/TimeControlStore';

interface YearlyEvaluationResultProps {
  onClose: () => void;
}

export function YearlyEvaluationResult({ onClose }: YearlyEvaluationResultProps) {
  const stats = useGameStore(state => state.stats);
  const { resume } = useTimeControlStore();

  // 年末評価が完了した場合のみ表示
  if (!stats.yearlyEvaluation) {
    return null;
  }

  const evaluation = stats.yearlyEvaluation;

  // 評価グレードに応じた色とメッセージ
  const getGradeInfo = (grade: string) => {
    switch (grade) {
      case 'S':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-gradient-to-r from-yellow-600 to-orange-600',
          message: '素晴らしい都市運営でした！中央政府はあなたを高く評価しています。',
        };
      case 'A':
        return {
          color: 'text-green-400',
          bgColor: 'bg-gradient-to-r from-green-600 to-blue-600',
          message: '優秀な都市運営でした。中央政府はあなたの活躍に期待しています。',
        };
      case 'B':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
          message: '良好な都市運営でした。中央政府はあなたの活躍に注目しています。',
        };
      case 'C':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-gradient-to-r from-orange-600 to-red-600',
          message: 'まずまずの都市運営でした。中央政府はより一層の努力を求めています。',
        };
      case 'D':
        return {
          color: 'text-red-400',
          bgColor: 'bg-gradient-to-r from-red-600 to-pink-600',
          message: '改善の余地がありました。中央政府は計画の見直しを要求しています。',
        };
      case 'E':
        return {
          color: 'text-red-500',
          bgColor: 'bg-gradient-to-r from-red-700 to-purple-700',
          message: '都市運営に課題がありました。中央政府はあなたを問題視しています。',
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gradient-to-r from-gray-600 to-gray-700',
          message: '評価が完了しました。',
        };
    }
  };

  const gradeInfo = getGradeInfo(evaluation.grade);

  const handleContinue = () => {
    resume(); // 時間を再開
    onClose(); // 画面を閉じる
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[4000] flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="bg-gray-800 rounded-t-xl p-8 text-center border-b border-gray-700">
					<h1 className="text-3xl font-bold text-gray-200">
						{evaluation.year}年度 年末評価結果
					</h1>
          <div className="text-5xl font-bold mb-4" style={{ color: gradeInfo.color }}>
            {evaluation.grade}
          </div>
          <div className="text-xl text-gray-300 font-medium">
            総合スコア: {evaluation.totalScore}点
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="p-8 space-y-6">
          {/* 評価コメント */}
          <div className="text-center">
            <p className="text-lg text-gray-300 leading-relaxed">
              {gradeInfo.message}
            </p>
          </div>

          {/* 補助金情報 */}
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-600">
            <div className="flex items-center justify-center gap-3 mb-3">
              <TbCash size={28} className="text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-200">補助金</h2>
            </div>
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {evaluation.subsidy.toLocaleString()}
            </div>
            <p className="text-gray-400">
              この補助金は都市のさらなる発展に活用できます
            </p>
          </div>

          {/* 詳細評価項目 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4 text-gray-200 flex items-center gap-2">
                <TbChartBar className="text-blue-400" />
                評価詳細
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">発展度合い</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-400">{evaluation.developmentScore}/40点</div>
                    <div className="text-sm text-gray-400">
                      {evaluation.developmentScore >= 30 ? '優秀' : 
                       evaluation.developmentScore >= 20 ? '良好' : 
                       evaluation.developmentScore >= 10 ? '普通' : '要改善'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">支持率</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">{evaluation.approvalRating}/30点</div>
                    <div className="text-sm text-gray-400">
                      {evaluation.approvalRating >= 25 ? '非常に高い' : 
                       evaluation.approvalRating >= 20 ? '高い' : 
                       evaluation.approvalRating >= 15 ? '普通' : '低い'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">満足度スコア</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-purple-400">{evaluation.satisfactionScore}/20点</div>
                    <div className="text-sm text-gray-400">
                      {evaluation.satisfactionScore >= 16 ? '非常に満足' : 
                       evaluation.satisfactionScore >= 12 ? '満足' : 
                       evaluation.satisfactionScore >= 8 ? '普通' : '不満'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">ミッション達成</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-400">{evaluation.missionCompletion}/10点</div>
                    <div className="text-sm text-gray-400">
                      {evaluation.missionCompletion >= 8 ? '完璧' : 
                       evaluation.missionCompletion >= 6 ? '優秀' : 
                       evaluation.missionCompletion >= 4 ? '良好' : '要努力'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4 text-gray-200 flex items-center gap-2">
                <TbStar className="text-yellow-400" />
                年度サマリー
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">評価年度</span>
                  <span className="text-lg font-bold text-blue-400">{evaluation.year}年</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">総合評価</span>
                  <span className={`text-xl font-bold ${gradeInfo.color}`}>{evaluation.grade}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">総合スコア</span>
                  <span className="text-xl font-bold text-green-400">{evaluation.totalScore}点</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">補助金</span>
                  <span className="text-lg font-bold text-yellow-400">¥{evaluation.subsidy.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 次の年度へのメッセージ */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 text-center">
            <h3 className="text-lg font-bold mb-3 text-gray-200">次の年度に向けて</h3>
            <p className="text-gray-300 leading-relaxed">
              {evaluation.grade === 'S' || evaluation.grade === 'A' 
                ? '素晴らしい成果です！この調子で都市の発展を続けましょう。'
                : evaluation.grade === 'B' || evaluation.grade === 'C'
                ? '良好な結果です。さらなる改善を目指して頑張りましょう。'
                : '改善の余地があります。市民の声に耳を傾け、都市の課題解決に取り組みましょう。'
              }
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-800 rounded-b-xl p-6 border-t border-gray-700">
          <div className="text-center">
            <button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-lg text-lg font-semibold shadow-lg transition-colors duration-200"
            >
              ゲームを続行
            </button>
            <p className="text-gray-400 text-sm mt-3">
              ボタンをクリックすると、ゲーム時間が再開され、次の年度に進みます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 