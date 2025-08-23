import { FACILITY_DATA } from '../types/facility';
import type { FacilityType } from '../types/facility';

/**
 * 施設アンロック管理ユーティリティ
 */
export class FacilityUnlockManager {
  /**
   * 初期アンロック施設の一覧を取得
   */
  static getInitialUnlockedFacilities(): Set<FacilityType> {
    return new Set(
      Object.entries(FACILITY_DATA)
        .filter(([_, data]) => data.initiallyUnlocked)
        .map(([type, _]) => type as FacilityType)
    );
  }

  /**
   * 指定ミッションでアンロックされる施設の一覧を取得
   */
  static getUnlockableByMission(missionId: string): FacilityType[] {
    return Object.entries(FACILITY_DATA)
      .filter(([_, data]) => 
        data.unlockCondition === 'mission' && 
        data.unlockRequirements?.missionId === missionId
      )
      .map(([type, _]) => type as FacilityType);
  }

  /**
   * 指定実績でアンロックされる施設の一覧を取得
   */
  static getUnlockableByAchievement(achievementId: string): FacilityType[] {
    return Object.entries(FACILITY_DATA)
      .filter(([_, data]) => 
        data.unlockCondition === 'achievement' && 
        data.unlockRequirements?.achievementId === achievementId
      )
      .map(([type, _]) => type as FacilityType);
  }

  /**
   * 施設のアンロック条件を取得
   */
  static getUnlockCondition(facilityType: FacilityType) {
    const facilityData = FACILITY_DATA[facilityType];
    if (!facilityData) return null;
    
    return {
      condition: facilityData.unlockCondition,
      requirements: facilityData.unlockRequirements,
      initiallyUnlocked: facilityData.initiallyUnlocked
    };
  }

  /**
   * アンロック設定の妥当性を検証
   */
  static validateUnlockConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    Object.entries(FACILITY_DATA).forEach(([type, data]) => {
      // ミッション条件の場合はmissionIdが必要
      if (data.unlockCondition === 'mission' && !data.unlockRequirements?.missionId) {
        errors.push(`施設「${type}」: ミッション条件にはmissionIdが必要です`);
      }
      
      // 実績条件の場合はachievementIdが必要
      if (data.unlockCondition === 'achievement' && !data.unlockRequirements?.achievementId) {
        errors.push(`施設「${type}」: 実績条件にはachievementIdが必要です`);
      }
      
      // 初期アンロックとミッション条件の矛盾チェック
      if (data.initiallyUnlocked && data.unlockCondition !== 'initial') {
        errors.push(`施設「${type}」: initiallyUnlockedがtrueの場合、unlockConditionは'initial'である必要があります`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 