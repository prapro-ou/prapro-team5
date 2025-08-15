import React from "react";
import { useFeedStore, type Feed } from "../stores/FeedStore";
import "./CitizenFeed.css";

const CitizenFeed: React.FC = () => {
  // const iconMap: Record<string, string> = {
  //     angry: "😠",
  //     sad: "😞",
  //     happy: "😄",
  //     trouble: "😟",
  //     thanks: "🙏",
  //     shop: "🏬",
  //     work: "💼",
  //     park: "🌳",
  //     factory: "🏭",
  // };

interface IconMap {
    [key: string]: string;
}

interface FeedStoreState {
    feeds: Feed[];
}

const iconMap: IconMap = {
  angry: "😠",
  sad: "😞",
  happy: "😄",
  neutral: "😐",
  trouble: "😟",
  thanks: "🙏",
  shop: "🏬",
  work: "💼",
  park: "🌳",
  factory: "🏭",
};

const feeds: Feed[] = useFeedStore((state: FeedStoreState) => state.feeds);

  return (
    <div className="citizen-feed">
      {feeds.slice(0, 5).map((feed: Feed, idx: number) => (
        <div key={idx} className="feed-item">
          <span className="feed-icon">{iconMap[feed.icon] || "💬"}</span>
          <span className={`feed-text ${feed.mood === "positive" ? "feed-text-positive" : "feed-text-negative"}`}>{feed.text}</span>
        </div>
      ))}
    </div>
  );
};

export default CitizenFeed;
