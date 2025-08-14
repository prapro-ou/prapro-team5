// 前月の不足状態を記憶する変数（モジュールスコープ）
let prevShortage = { water: false, electricity: false, park: false };
import { useFacilityStore } from "./FacilityStore";
import { FACILITY_DATA } from "../types/facility";
import { useFeedStore } from "./FeedStore";
import { getResidentialsWithoutPark } from "../utils/parkEffect";
import { useInfrastructureStore } from "./InfrastructureStore";
import type { MonthlyTask } from "./GameStore";

export const citizenFeedTask: MonthlyTask = (get, set) => {
  const stats = get().stats;
  const facilities = useFacilityStore.getState().facilities;
  const feedStore = useFeedStore.getState();
  const now = Date.now();

  // 資源不足（お店がある時だけ表示）
    const hasShop = facilities.some(f => f.type === "commercial");
  if (hasShop && stats.goods <= 5) {
    feedStore.addFeed({
      text: "お店に品物が全然ないよ！工業地帯を増やして生産して！🏭",
      icon: "shop",
      timestamp: now,
      mood: "negative"
    });
  }


  // インフラ不足（水道・電気）
  const { getInfrastructureShortage } = useInfrastructureStore.getState();
  const shortage = getInfrastructureShortage();
  // 公園不足判定
  const residentials = facilities.filter(f => f.type === 'residential');
  const parks = facilities.filter(f => f.type === 'park');
  const outOfRangeResidentials = getResidentialsWithoutPark(residentials, parks);
  const isParkShortage = outOfRangeResidentials.length > 0;
  const parkMessages = [
    "近くに公園がなくて、子どもを遊ばせる場所がないよ！🌳",
    "公園が遠くて遊びに行けない…もっと増やして！🏞️",
    "友達と遊べる公園が欲しいな！👦👧"
  ];
  // 水道不足メッセージ（ランダム）
  const waterMessages = [
    "水道が足りないよ…浄水所を建ててほしい！🚰",
    "水道が止まってて困ってる…早く直して！🚱",
    "水が出ない…生活できないよ！💧"
  ];
  if (shortage.water > 0) {
    const msg = waterMessages[Math.floor(Math.random() * waterMessages.length)];
    feedStore.addFeed({
      text: msg,
      icon: "trouble",
      timestamp: now,
      mood: "negative"
    });
  }
  // 水道改善メッセージ
  if (prevShortage.water && shortage.water === 0) {
    feedStore.addFeed({
      text: "水道が復旧して快適になった！ありがとう！🚰",
      icon: "thanks",
      timestamp: now,
      mood: "positive"
    });
  }
  // 電気不足メッセージ（ランダム）
  const electricityMessages = [
    "電気が足りなくて困ってる…発電所を増やして！💡",
    "停電で家が真っ暗だよ…発電所を増やして！🔌",
    "電気が来ない…テレビも見られない！📺"
  ];
  if (shortage.electricity > 0) {
    const msg = electricityMessages[Math.floor(Math.random() * electricityMessages.length)];
    feedStore.addFeed({
      text: msg,
      icon: "trouble",
      timestamp: now,
      mood: "negative"
    });
  }
  // 電気改善メッセージ
  if (prevShortage.electricity && shortage.electricity === 0) {
    feedStore.addFeed({
      text: "停電が解消されて明るくなった！助かった！💡",
      icon: "thanks",
      timestamp: now,
      mood: "positive"
    });
  }

  // 公園サービス範囲外住宅メッセージ（ランダム）
  if (isParkShortage) {
    const msg = parkMessages[Math.floor(Math.random() * parkMessages.length)];
    feedStore.addFeed({
      text: msg,
      icon: "park",
      timestamp: now,
      mood: "negative"
    });
  }
    // 公園サービス範囲外住宅メッセージ（ランダム）
  // 公園改善メッセージ
  if (prevShortage.park && !isParkShortage) {
    feedStore.addFeed({
      text: "新しい公園ができてみんな大喜び！🌳",
      icon: "thanks",
      timestamp: now,
      mood: "positive"
    });
  }

  // 満足度メッセージ（ランダム）
  const sadMessages = [
    "この街、なんだか退屈だ…何か楽しいことはないのかな？😞",
    "最近つまらない…イベントとかやってほしい！🎉",
    "毎日同じで飽きちゃった…何か変化が欲しい！🌀"
  ];
  const happyMessages = [
    "この街は本当に住みやすい！市長に感謝！😄",
    "新しい施設ができて嬉しい！ありがとう！🎊",
    "友達も増えて毎日が楽しい！😊"
  ];
  if (stats.satisfaction < 30) {
    const msg = sadMessages[Math.floor(Math.random() * sadMessages.length)];
    feedStore.addFeed({
      text: msg,
      icon: "sad",
      timestamp: now,
      mood: "negative"
    });
  } else if (stats.satisfaction > 80) {
    const msg = happyMessages[Math.floor(Math.random() * happyMessages.length)];
    feedStore.addFeed({
      text: msg,
      icon: "happy",
      timestamp: now,
      mood: "positive"
    });
  }
  // 今月の不足状態を記憶
  prevShortage.water = shortage.water > 0;
  prevShortage.electricity = shortage.electricity > 0;
  prevShortage.park = isParkShortage;
}
