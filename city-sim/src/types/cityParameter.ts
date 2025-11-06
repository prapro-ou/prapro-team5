// 都市パラメータの種類
export type CityParameterType =
  | 'entertainment'       // 娯楽
  | 'security'            // 治安
  | 'sanitation'          // 衛生
  | 'transit'             // 交通利便性
  | 'environment'         // 環境
  | 'education'           // 教育
  | 'disaster_prevention' // 防災
  | 'tourism';            // 観光

// 都市パラメータ値（0-100）
export interface CityParameters {
  entertainment: number;
  security: number;
  sanitation: number;
  transit: number;
  environment: number;
  education: number;
  disaster_prevention: number;
  tourism: number;
}


