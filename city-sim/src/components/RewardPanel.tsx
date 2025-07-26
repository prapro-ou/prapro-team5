import React, { useState, useEffect } from 'react';

export type Reward = {
  id: string;
  title: string;
  description: string;
  condition: string;
  achieved: boolean;
  claimed: boolean;
  reward: string;
};

export type RewardPanelProps = {
  rewards: Reward[];
  onClaim: (id: string) => void;
};

export default function RewardPanel({ rewards, onClaim }: RewardPanelProps) {
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl p-8 w-[400px] z-[3000]">
      <h2 className="text-2xl font-bold mb-6 text-center">達成報酬</h2>
      <ul className="space-y-4">
        {rewards.map(r => (
          <li key={r.id} className="border-b pb-4">
            <div className="font-semibold text-lg">{r.title}</div>
            <div className="text-gray-600 text-sm mb-1">{r.description}</div>
            <div className="text-xs mb-2">条件: {r.condition}</div>
            <div className="mb-2">報酬: <span className="font-bold text-yellow-600">{r.reward}</span></div>
            {r.achieved ? (
              r.claimed ? (
                <span className="text-green-600 font-bold">受け取り済み</span>
              ) : (
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded font-bold shadow"
                  onClick={() => onClaim(r.id)}
                >
                  受け取る
                </button>
              )
            ) : (
              <span className="text-gray-400">未達成</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
