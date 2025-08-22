// 前月の不足状態を記憶する変数（モジュールスコープ）
let prevShortage = { water: false, electricity: false, park: false, police: false, hospital: false };
import { useFacilityStore } from "./FacilityStore";
import { useFeedStore } from "./FeedStore";
import { getResidentialsWithoutPark } from "../utils/parkEffect";
import { useInfrastructureStore } from "./InfrastructureStore";
import type { MonthlyTask } from "./GameStore";

export const citizenFeedTask: MonthlyTask = (get) => {
  // 前回病院不足だったか記憶する（モジュールスコープで保持）
  if (typeof prevShortage.hospital === 'undefined') prevShortage.hospital = false;
  // 前回警察署不足だったか記憶する（モジュールスコープで保持）
  if (typeof prevShortage.police === 'undefined') prevShortage.police = false;
  const facilities = useFacilityStore.getState().facilities;
  const stats = get().stats;
  const feedStore = useFeedStore.getState();
  const now = Date.now();
  let feedAdded = false;

  // 警察署不足メッセージ（罵倒系含むランダム）
  // 病院不足メッセージ（罵倒系含むランダム）
  const hospitalMessages = [
    "近くに病院がなくて不安です…体調悪いのにどうすればいいんだ！🏥",
    "この街、医療体制ひどすぎ！病院くらい建てろよ！😡",
    "病院がないとかありえない…市長何してんの？👎",
    "病院が遠すぎて意味ない！もっと増やせ！",
    "病院がないから毎日不安…責任取れ！",
    "この街、病人は放置かよ…病院は？",
    "病院がないとか、住民のこと考えてないだろ！",
    "市長、病院建てる気ある？やる気出せ！"
  ];
  const policeMessages = [
    "近くに警察署がなくて不安です…誰か助けて！🚨",
    "この街、治安悪すぎ！警察署くらい建てろよ！😡",
    "警察署がないとかありえない…市長何してんの？👎",
    "泥棒に入られそうで毎日怖い！早く警察署作って！",
    "警察署が遠すぎて意味ない！もっと増やせ！",
    "治安対策ゼロ？市長サボりすぎだろ！",
    "警察署がないから夜も眠れない…責任取れ！",
    "この街、犯罪者の天国かよ…警察署は？",
    "警察署がないとか、住民のこと考えてないだろ！",
    "市長、警察署建てる気ある？やる気出せ！"
  ];
  // 警察署不足判定
  // 病院不足判定
  const hospitalFacilities = facilities.filter(f => f.type === 'hospital');
  const hospitalRadiusResidentials: { house: any, isCovered: boolean }[] = [];
  facilities.filter(f => f.type === 'residential').forEach(house => {
    const { position } = house;
    const isCovered = hospitalFacilities.some(hospital => {
      const radius = hospital.effectRadius ?? 0;
      const dx = hospital.position.x - position.x;
      const dy = hospital.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    hospitalRadiusResidentials.push({ house, isCovered });
  });
  const outOfRangeHospitalResidentials = hospitalRadiusResidentials.filter(r => !r.isCovered);
  if (outOfRangeHospitalResidentials.length > 0) {
    // 病院が近くにない住宅があれば文句メッセージ（ランダム）
    outOfRangeHospitalResidentials.forEach(() => {
      const msg = hospitalMessages[Math.floor(Math.random() * hospitalMessages.length)];
      feedStore.addFeed({
        text: msg,
        icon: '🏥',
        timestamp: now,
        mood: 'negative'
      });
    });
    feedAdded = true;
    prevShortage.hospital = true;
  } else {
    // 前回病院不足だったが、今月は解消された場合
    if (prevShortage.hospital) {
      const hospitalThanksMessages = [
        "新しく病院ができて安心して暮らせるようになった！🏥",
        "医療体制が良くなってみんな安心！ありがとう！",
        "病院ができてみんな喜んでる！市長グッジョブ！",
        "これで体調悪くても安心！病院最高！",
        "病院ができて街の雰囲気が明るくなった！",
        "やっと病院ができた！これで安心！",
        "病院ができて子どもたちも安心して遊べる！",
        "病院ができて住民の不安が減った！",
        "病院ありがとう！これで安心して暮らせる！",
        "市長、病院設置ありがとう！みんな感謝してる！"
      ];
      const msg = hospitalThanksMessages[Math.floor(Math.random() * hospitalThanksMessages.length)];
      feedStore.addFeed({
        text: msg,
        icon: '🏥',
        timestamp: now,
        mood: 'positive'
      });
      feedAdded = true;
    }
    prevShortage.hospital = false;
  }
  const policeFacilities = facilities.filter(f => f.type === 'police');
  const policeRadiusResidentials: { house: any, isCovered: boolean }[] = [];
  facilities.filter(f => f.type === 'residential').forEach(house => {
    const { position } = house;
    const isCovered = policeFacilities.some(police => {
      const radius = police.effectRadius ?? 0;
      const dx = police.position.x - position.x;
      const dy = police.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
    policeRadiusResidentials.push({ house, isCovered });
  });
  const outOfRangePoliceResidentials = policeRadiusResidentials.filter(r => !r.isCovered);
  if (outOfRangePoliceResidentials.length > 0) {
    // 警察署が近くにない住宅があれば文句メッセージ（ランダム）
    outOfRangePoliceResidentials.forEach(() => {
      const msg = policeMessages[Math.floor(Math.random() * policeMessages.length)];
      feedStore.addFeed({
        text: msg,
        icon: '🚨',
        timestamp: now,
        mood: 'negative'
      });
    });
    feedAdded = true;
    prevShortage.police = true;
  } else {
    // 前回警察署不足だったが、今月は解消された場合
    if (prevShortage.police) {
      const policeThanksMessages = [
        "新しく警察署ができて安心して暮らせるようになった！👮‍♂️",
        "治安が良くなって夜もぐっすり眠れる！ありがとう！",
        "警察署ができてみんな喜んでる！市長グッジョブ！",
        "これで泥棒も怖くない！警察署最高！",
        "警察署ができて街の雰囲気が明るくなった！",
        "やっと警察署ができた！これで安心！",
        "警察署ができて子どもたちも安心して遊べる！",
        "警察署ありがとう！これで安心して暮らせる！",
        "市長、警察署設置ありがとう！みんな感謝してる！"
      ];
      const msg = policeThanksMessages[Math.floor(Math.random() * policeThanksMessages.length)];
      feedStore.addFeed({
        text: msg,
        icon: '👮‍♂️',
        timestamp: now,
        mood: 'positive'
      });
      feedAdded = true;
    }
    prevShortage.police = false;
  }

  // 資源不足（お店がある時だけ表示）
    const hasShop = facilities.some(f => f.type === "commercial");
  if (hasShop && stats.goods <= 5) {
    feedStore.addFeed({
      text: "お店に品物が全然ないよ！工業地帯を増やして生産して！🏭",
      icon: "shop",
      timestamp: now,
      mood: "negative"
    });
    feedAdded = true;
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
    feedAdded = true;
  }
  // 水道改善メッセージ
  if (prevShortage.water && shortage.water === 0) {
    feedStore.addFeed({
      text: "水道が復旧して快適になった！ありがとう！🚰",
      icon: "thanks",
      timestamp: now,
      mood: "positive"
    });
    feedAdded = true;
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
    feedAdded = true;
  }
  // 電気改善メッセージ
  if (prevShortage.electricity && shortage.electricity === 0) {
    feedStore.addFeed({
      text: "停電が解消されて明るくなった！助かった！💡",
      icon: "thanks",
      timestamp: now,
      mood: "positive"
    });
    feedAdded = true;
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
    feedAdded = true;
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
    feedAdded = true;
  }

  // 満足度メッセージ（ランダム）
  const sadMessages = [
    "この街、なんだか退屈だ…何か楽しいことはないのかな？😞",
    "最近つまらない…イベントとかやってほしい！🎉",
    "毎日同じで飽きちゃった…何か変化が欲しい！"
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
    feedAdded = true;
  } else if (stats.satisfaction > 80) {
    const msg = happyMessages[Math.floor(Math.random() * happyMessages.length)];
    feedStore.addFeed({
      text: msg,
      icon: "happy",
      timestamp: now,
      mood: "positive"
    });
    feedAdded = true;
  }
  // 住人がいる＆今月何もメッセージが出ていない場合は日常メッセージ（ポジティブ）
  const dailyMessages = [
    "今日はいい天気だね！☀️",
    "みんなでご飯を食べて幸せ！🍚",
    // どうでもいい系
    "靴下が片方なくなった…どこいったんだろう🧦",
    "今日の天気、まあまあだったな…☁️",
    "冷蔵庫にプリンがあった！ラッキー🍮",
    "隣の家の犬がまた吠えてる…🐶",
    "スマホの充電が切れそう…🔋",
    "なんとなく散歩したくなる日だな🚶",
    "お昼ごはん何食べようかな…🤔",
    "テレビで面白い番組やってた！📺",
    "今日は特に何もなかった…それもいいかも",
    "自転車のタイヤがちょっと空気抜けてるかも🚲",
    "カップ麺の賞味期限が切れてた…食べても大丈夫かな🍜",
    "エアコンのリモコンが見つからない…どこいった？",
    "靴ひもがほどけてた。気づかず歩いてたよ👟",
    "郵便受けにチラシがいっぱい…読む気しないな📬",
    "冷蔵庫の中に謎のタッパーが…何入ってたっけ？",
    "今日の占いは最下位だった…まあ気にしない！🔮",
    "コーヒー飲みすぎて眠れないかも☕",
    "洗濯物干しっぱなしだった…雨降らないで！☔",
    "スマホの画面が割れた…ショック😢",
    "新しい靴下買おうかな…"
  ];
  if (stats.population > 0 && !feedAdded) {
    const idx = Math.floor(Math.random() * dailyMessages.length);
    const msg = dailyMessages[idx];
    // どうでもいい系はneutral、それ以外はhappy
    const neutralIdxs = [
      2,3,4,5,6,7,8,9,10,11,
      12,13,14,15,16,17,18,19,20,21
    ]; // dailyMessages配列のどうでもいい系インデックス（全追加分含む）
    feedStore.addFeed({
      text: msg,
      icon: neutralIdxs.includes(idx) ? "neutral" : "happy",
      timestamp: now,
      mood: "positive"
    });
  }
  // 今月の不足状態を記憶
  prevShortage.water = shortage.water > 0;
  prevShortage.electricity = shortage.electricity > 0;
  prevShortage.park = isParkShortage;
}
