import type { Achievement, AchievementData, AchievementLoadResult } from '../types/achievement';

// 実績読み込み
export async function loadAchievementsFromJSON(filePath: string = 'data/achievements.json'): Promise<AchievementLoadResult> {
  try {
    console.log(`実績データを読み込み中: ${filePath}`);
    
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`実績ファイルの読み込みに失敗しました: ${response.status} ${response.statusText}`);
    }
    
    const data: AchievementData = await response.json();
    
    // データの妥当性をチェック
    if (!data.achievements || !Array.isArray(data.achievements)) {
      throw new Error('実績データの形式が正しくありません: achievements配列が見つかりません');
    }
    
    // 各実績の基本的な妥当性をチェック
    const validAchievements = data.achievements.filter(achievement => {
      // 必須フィールドのチェック
      if (!achievement.id || !achievement.name || !achievement.description || 
          !achievement.condition || !achievement.reward) {
        console.warn(`必須フィールドが不足している実績をスキップしました:`, achievement);
        return false;
      }
      
      // 配列フィールドのチェック
      if (!Array.isArray(achievement.conditions) || !Array.isArray(achievement.effects)) {
        console.warn(`conditionsまたはeffectsが配列でない実績をスキップしました:`, achievement);
        return false;
      }
      
      // 条件と効果が空でないかチェック
      if (achievement.conditions.length === 0 || achievement.effects.length === 0) {
        console.warn(`条件または効果が空の実績をスキップしました:`, achievement);
        return false;
      }
      
      // 型のチェック
      if (typeof achievement.achieved !== 'boolean' || typeof achievement.claimed !== 'boolean') {
        console.warn(`achievedまたはclaimedがbooleanでない実績をスキップしました:`, achievement);
        return false;
      }
      
      return true;
    });
    
    console.log(`${validAchievements.length}個の実績を読み込みました`);
    
    return {
      success: true,
      achievements: validAchievements
    };
    
  } catch (error) {
    console.error('実績の読み込みエラー:', error);
    return {
      success: false,
      achievements: [],
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

// バリデーション
export function validateAchievement(achievement: any): achievement is Achievement {
  return (
    typeof achievement.id === 'string' &&
    typeof achievement.name === 'string' &&
    typeof achievement.description === 'string' &&
    typeof achievement.condition === 'string' &&
    typeof achievement.reward === 'string' &&
    typeof achievement.achieved === 'boolean' &&
    typeof achievement.claimed === 'boolean' &&
    Array.isArray(achievement.conditions) &&
    Array.isArray(achievement.effects)
  );
}

// 複数ファイル読み込み
export async function loadMultipleAchievementFiles(filePaths: string[]): Promise<AchievementLoadResult> {
  const allAchievements: Achievement[] = [];
  const errors: string[] = [];
  
  for (const filePath of filePaths) {
    const result = await loadAchievementsFromJSON(filePath);
    
    if (result.success) {
      allAchievements.push(...result.achievements);
    } 
    else {
      errors.push(`${filePath}: ${result.error}`);
    }
  }
  
  return {
    success: errors.length === 0,
    achievements: allAchievements,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}

// フォールバック用デフォルト実績
export function getDefaultAchievements(): Achievement[] {
  return [
    {
      id: 'default_achievement_population',
      name: '基本的な人口増加',
      description: '人口を50人に増やしましょう',
      condition: '人口50人以上',
      reward: '¥2,000',
      hidden: false,
      category: 'population',
      rarity: 'common',
      priority: 1,
      conditions: [
        { type: 'population', op: '>=', value: 50 }
      ],
      effects: [
        { type: 'money', value: 2000 }
      ],
      achieved: false,
      claimed: false
    }
  ];
}

// 実績のカテゴリ別フィルタリング
export function filterAchievementsByCategory(achievements: Achievement[], category: string): Achievement[] {
  return achievements.filter(achievement => achievement.category === category);
}

// 実績のレアリティ別フィルタリング
export function filterAchievementsByRarity(achievements: Achievement[], rarity: string): Achievement[] {
  return achievements.filter(achievement => achievement.rarity === rarity);
}

// 実績の達成状況別フィルタリング
export function filterAchievementsByStatus(achievements: Achievement[], status: 'all' | 'achieved' | 'unachieved' | 'claimed' | 'unclaimed'): Achievement[] {
  switch (status) {
    case 'achieved':
      return achievements.filter(achievement => achievement.achieved);
    case 'unachieved':
      return achievements.filter(achievement => !achievement.achieved);
    case 'claimed':
      return achievements.filter(achievement => achievement.claimed);
    case 'unclaimed':
      return achievements.filter(achievement => achievement.achieved && !achievement.claimed);
    default:
      return achievements;
  }
}

// 実績の優先度順ソート
export function sortAchievementsByPriority(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((b, a) => (b.priority || 0) - (a.priority || 0));
}

// 実績の達成日時順ソート
export function sortAchievementsByAchievedDate(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((a, b) => {
    if (!a.achievedDate && !b.achievedDate) return 0;
    if (!a.achievedDate) return 1;
    if (!b.achievedDate) return -1;
    return b.achievedDate.totalWeeks - a.achievedDate.totalWeeks;
  });
}
