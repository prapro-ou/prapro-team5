import type { Mission } from '../types/mission';

// JSONミッションファイルの型定義
interface MissionData {
  missions: Mission[];
}

// ミッション読み込み結果の型定義
interface MissionLoadResult {
  success: boolean;
  missions: Mission[];
  error?: string;
}

// ミッション読み込み
export async function loadMissionsFromJSON(filePath: string = 'data/missions.json'): Promise<MissionLoadResult> {
  try {
    console.log(`ミッションデータを読み込み中: ${filePath}`);
    
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`ミッションファイルの読み込みに失敗しました: ${response.status} ${response.statusText}`);
    }
    
    const data: MissionData = await response.json();
    
    // データの妥当性を簡単にチェック
    if (!data.missions || !Array.isArray(data.missions)) {
      throw new Error('ミッションデータの形式が正しくありません: missions配列が見つかりません');
    }
    
    // 各ミッションの基本的な妥当性をチェック
    const validMissions = data.missions.filter(mission => {
      if (!mission.id || !mission.name || !mission.type) {
        console.warn(`無効なミッションをスキップしました:`, mission);
        return false;
      }
      return true;
    });
    
    console.log(`${validMissions.length}個のミッションを読み込みました`);
    
    return {
      success: true,
      missions: validMissions
    };
    
  }
  catch (error) {
    console.error('ミッションの読み込みエラー:', error);
    return {
      success: false,
      missions: [],
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

// バリデーション
export function validateMission(mission: any): mission is Mission {
  return (
    typeof mission.id === 'string' &&
    typeof mission.name === 'string' &&
    typeof mission.description === 'string' &&
    mission.type === 'mission' &&
    typeof mission.category === 'string' &&
    typeof mission.priority === 'number' &&
    Array.isArray(mission.conditions) &&
    Array.isArray(mission.effects) &&
    typeof mission.status === 'string' &&
    typeof mission.progress === 'number' &&
    typeof mission.autoAccept === 'boolean' &&
    typeof mission.isRepeatable === 'boolean'
  );
}

// 複数読み込み
export async function loadMultipleMissionFiles(filePaths: string[]): Promise<MissionLoadResult> {
  const allMissions: Mission[] = [];
  const errors: string[] = [];
  
  for (const filePath of filePaths) {
    const result = await loadMissionsFromJSON(filePath);
    
    if (result.success) {
      allMissions.push(...result.missions);
    }
    else {
      errors.push(`${filePath}: ${result.error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    missions: allMissions,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}

// フォールバック用デフォミッション
export function getDefaultMissions(): Mission[] {
  return [
    {
      id: 'default_mission_population',
      name: '基本的な人口増加',
      description: '人口を50人に増やしましょう',
      type: 'mission',
      category: 'development',
      priority: 1,
      conditions: [
        { type: 'population', op: '>=', value: 50 }
      ],
      effects: [
        { type: 'money', value: 2000 }
      ],
      status: 'available',
      progress: 0,
      autoAccept: true,
      isRepeatable: false
    }
  ];
}
