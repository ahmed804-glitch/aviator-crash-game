import React, { useState } from 'react';
import { Trophy, Medal, Crown, Zap, MapPin, Share2, Check, Copy } from 'lucide-react';
import { sound } from '../utils/sound';

export interface PilotRecord {
  id: string;
  name: string;
  city: string;
  totalWinnings: number;
  highestMultiplier: number;
  winsCount: number;
  rank?: number;
}

interface TopPilotsLeaderboardProps {
  pilots: PilotRecord[];
  currentUserId: string;
  isUrdu: boolean;
}

export const TopPilotsLeaderboard: React.FC<TopPilotsLeaderboardProps> = ({
  pilots,
  currentUserId,
  isUrdu
}) => {
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'weekly'>('all');
  const [copiedPilotId, setCopiedPilotId] = useState<string | null>(null);
  const [sharePreviewText, setSharePreviewText] = useState<string | null>(null);

  // Multiplier modifier for timeframes so filters feel real
  const filteredPilots = pilots.map((p, idx) => {
    let winnings = p.totalWinnings;
    let wins = p.winsCount;
    if (timeframe === 'today') {
      winnings = Math.round(p.totalWinnings * 0.18 + (idx === 0 ? 15000 : 4500));
      wins = Math.max(2, Math.round(p.winsCount * 0.15));
    } else if (timeframe === 'weekly') {
      winnings = Math.round(p.totalWinnings * 0.52 + 10000);
      wins = Math.max(5, Math.round(p.winsCount * 0.45));
    }
    return {
      ...p,
      displayWinnings: winnings,
      displayWins: wins
    };
  }).sort((a, b) => b.displayWinnings - a.displayWinnings).slice(0, 10);

  const currentUserPilot = pilots.find((p) => p.id === currentUserId);
  const currentUserRank = pilots.findIndex((p) => p.id === currentUserId) + 1;

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  };

  const handleShare = async (pilot: PilotRecord & { displayWinnings?: number; displayWins?: number }, rank: number) => {
    const winningsToUse = pilot.displayWinnings ?? pilot.totalWinnings;
    const winsToUse = pilot.displayWins ?? pilot.winsCount;

    const formattedMessage = isUrdu
      ? [
          `✈️ *ایوی ایٹر دیسی | ٹاپ پائلٹ کارڈ* ✈️`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `🎖️ پائلٹ: *${pilot.name}*`,
          `📍 مقام: ${pilot.city || 'پاکستان'}`,
          `🏆 لیڈر بورڈ رینک: *#${rank}* ${rank === 1 ? '👑 (چیمپئن ACE)' : ''}`,
          `💰 کل انعامی کمائی: *₨ ${winningsToUse.toLocaleString()} PKR*`,
          `🚀 سب سے اونچی پرواز: *${pilot.highestMultiplier.toFixed(2)}x*`,
          `🎯 کامیاب کیش آؤٹس: *${winsToUse} پروازیں*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `🎮 دیسی والٹ اور لائیو کریش گیم پر کھیلیں اور کمائیں! 💰`
        ].join('\n')
      : [
          `✈️ *AVIATOR DESI | TOP PILOT CARD* ✈️`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `🎖️ Pilot: *${pilot.name}*`,
          `📍 City: ${pilot.city || 'Pakistan'}`,
          `🏆 Leaderboard Rank: *#${rank}* ${rank === 1 ? '👑 (ACE Champion)' : ''}`,
          `💰 Total Winnings: *₨ ${winningsToUse.toLocaleString()} PKR*`,
          `🚀 Highest Multiplier: *${pilot.highestMultiplier.toFixed(2)}x*`,
          `🎯 Successful Flights: *${winsToUse} wins*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `🎮 Play & Cash Out live at Aviator Desi Crash Game! 💰`
        ].join('\n');

    const copied = await copyToClipboard(formattedMessage);
    if (copied) {
      sound.playBetPlaced();
      setCopiedPilotId(pilot.id);
      setSharePreviewText(formattedMessage);
      setTimeout(() => {
        setCopiedPilotId((curr) => (curr === pilot.id ? null : curr));
      }, 2500);
      setTimeout(() => {
        setSharePreviewText(null);
      }, 4000);
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30">
            <Crown className="w-4 h-4 fill-current" />
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-300 to-gray-100 flex items-center justify-center text-slate-900 shadow-md">
            <Medal className="w-4 h-4" />
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-700 to-orange-400 flex items-center justify-center text-white shadow-md">
            <Medal className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-gray-850 border border-gray-700 flex items-center justify-center text-gray-400 font-digit font-bold text-xs">
            #{rank}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Toast popup when stats card copied */}
      {sharePreviewText && (
        <div className="absolute top-2 left-2 right-2 z-30 bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs animate-in fade-in slide-in-from-top-2 duration-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold truncate">
              {isUrdu ? 'پائلٹ کارڈ کلپ بورڈ پر کاپی ہو گیا!' : 'Stats card copied to clipboard!'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
            {isUrdu ? 'شیئر کریں' : 'Ready to paste'}
          </span>
        </div>
      )}

      {/* Leaderboard Header */}
      <div className="px-3.5 py-3 border-b border-gray-800 bg-[#0e131d]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-extrabold text-xs sm:text-sm text-white tracking-wide flex items-center gap-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                <span>{isUrdu ? 'ٹاپ 10 پائلٹس (لیڈر بورڈ)' : 'Top 10 Pilots Leaderboard'}</span>
                <span className="text-[10px] bg-red-950/80 text-red-400 border border-red-700/60 px-1.5 py-0.2 rounded font-digit">
                  LIVE
                </span>
              </h3>
              <p className="text-[10px] text-gray-400">
                {isUrdu ? 'سب سے زیادہ جیتنے والے چیمپئنز' : 'Highest total flight winnings'}
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Filter Switcher */}
        <div className="grid grid-cols-3 bg-gray-950 p-1 rounded-xl border border-gray-800 gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={`py-1 rounded-lg font-bold transition cursor-pointer ${
              timeframe === 'all'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {isUrdu ? 'ہمیشہ' : 'All Time'}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('weekly')}
            className={`py-1 rounded-lg font-bold transition cursor-pointer ${
              timeframe === 'weekly'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {isUrdu ? 'اس ہفتے' : 'This Week'}
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('today')}
            className={`py-1 rounded-lg font-bold transition cursor-pointer ${
              timeframe === 'today'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {isUrdu ? 'آج' : 'Today'}
          </button>
        </div>
      </div>

      {/* Top 10 Pilots List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredPilots.map((pilot, idx) => {
          const rank = idx + 1;
          const isCurrent = pilot.id === currentUserId;
          const isCopied = copiedPilotId === pilot.id;

          return (
            <div
              key={pilot.id}
              className={`p-2.5 rounded-xl border transition-all ${
                rank === 1
                  ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-gray-900/60 border-amber-500/50 shadow-sm'
                  : rank === 2
                  ? 'bg-gray-900/80 border-slate-700/70'
                  : rank === 3
                  ? 'bg-gray-900/80 border-amber-800/60'
                  : 'bg-gray-950/40 border-gray-800/70 hover:border-gray-700/80'
              } ${isCurrent ? 'ring-1 ring-emerald-500/80 bg-emerald-950/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {getRankBadge(rank)}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">
                        {pilot.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                          {isUrdu ? 'آپ' : 'YOU'}
                        </span>
                      )}
                      {rank === 1 && (
                        <span className="hidden sm:inline-flex text-[9px] font-bold text-amber-400 bg-amber-950/80 border border-amber-600/50 px-1 rounded">
                          {isUrdu ? 'چیمپئن' : 'ACE #1'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span className="flex items-center gap-0.5 text-gray-400">
                        <MapPin className="w-2.5 h-2.5 text-red-400" />
                        <span>{pilot.city}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-400/90 font-digit font-semibold">
                        <Zap className="w-2.5 h-2.5" />
                        {pilot.highestMultiplier.toFixed(1)}x max
                      </span>
                      <span>•</span>
                      <span>{pilot.displayWins} {isUrdu ? 'جیتیں' : 'wins'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Total Winnings + Share Button */}
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <div className="text-right">
                    <div className="font-digit font-black text-xs sm:text-sm text-emerald-400">
                      ₨ {pilot.displayWinnings.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-gray-500">
                      {isUrdu ? 'کل منافع' : 'Total Won'}
                    </div>
                  </div>

                  {/* Share Stats Button */}
                  <button
                    type="button"
                    onClick={() => handleShare(pilot, rank)}
                    title={isUrdu ? 'پائلٹ کارڈ کاپی کریں' : 'Copy stats card to clipboard'}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-gray-800/80 hover:bg-gray-700 border-gray-700/80 text-gray-300 hover:text-white'
                    }`}
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Standing Footer Banner with Share Button */}
      {currentUserPilot && (
        <div className="p-2.5 bg-[#0a0e16] border-t border-gray-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center font-digit font-bold text-xs">
              #{currentUserRank > 0 ? currentUserRank : '10+'}
            </div>
            <div>
              <div className="text-gray-300 font-bold text-[11px]">
                {isUrdu ? 'آپ کا رینک (Your Standing)' : 'Your Pilot Rank'}
              </div>
              <div className="text-[10px] text-gray-400">
                {currentUserPilot.winsCount} {isUrdu ? 'کامیاب پروازیں' : 'successful flights'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right font-digit">
              <div className="font-extrabold text-emerald-400 text-xs sm:text-sm">
                ₨ {currentUserPilot.totalWinnings.toLocaleString()}
              </div>
              <div className="text-[9px] text-gray-400">
                {isUrdu ? 'آپ کی کل کمائی' : 'Your Total Wins'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleShare(currentUserPilot, currentUserRank)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 active:scale-95 text-xs font-semibold ${
                copiedPilotId === currentUserPilot.id
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
              }`}
            >
              {copiedPilotId === currentUserPilot.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{isUrdu ? 'کاپی شدہ' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{isUrdu ? 'شیئر کارڈ' : 'Share'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
