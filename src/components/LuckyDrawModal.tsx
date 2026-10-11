import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Gift, Trophy, Sparkles, Clock, Ticket, CheckCircle2, AlertCircle, Coins, Flame, Play } from 'lucide-react';
import { sound } from '../utils/sound';

export interface LuckyDrawWinner {
  drawId: string;
  winnerName: string;
  winnerUserId: string;
  prizeAmount: number;
  winningTicketId: string;
  timestamp: number;
}

export interface LuckyDrawSummary {
  drawId: string;
  jackpotPool: number;
  ticketPrice: number;
  nextDrawTime: number;
  totalTickets: number;
  userTicketsCount: number;
  userWinChance: number;
  userTickets: Array<{ ticketId: string; timestamp: number }>;
  recentWinners: LuckyDrawWinner[];
}

interface LuckyDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userBalance: number;
  isUrdu: boolean;
  drawData: LuckyDrawSummary;
  onTicketsBought: (newBalance: number, summary: LuckyDrawSummary) => void;
}

export const LuckyDrawModal: React.FC<LuckyDrawModalProps> = ({
  isOpen,
  onClose,
  userId,
  userBalance,
  isUrdu,
  drawData,
  onTicketsBought
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [drawingNow, setDrawingNow] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [celebrationWinner, setCelebrationWinner] = useState<LuckyDrawWinner | null>(null);

  // Live countdown timer state
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      const diff = Math.max(0, drawData.nextDrawTime - Date.now());
      setTimeLeftMs(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [drawData.nextDrawTime]);

  if (!isOpen) return null;

  const totalCost = selectedQuantity * drawData.ticketPrice;
  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleBuyTickets = async () => {
    if (userBalance < totalCost) {
      setMsg({
        type: 'error',
        text: isUrdu ? 'والٹ میں رقم کم ہے! پہلے رقم جمع کریں۔' : 'Insufficient balance! Please deposit first.'
      });
      sound.playTick();
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/luckydraw/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quantity: selectedQuantity })
      });

      const data = await res.json();
      if (data.success) {
        sound.playBetPlaced();
        setMsg({
          type: 'success',
          text: isUrdu
            ? `مبارک ہو! آپ نے ${selectedQuantity} ٹکٹس خرید لیے۔ آپ کا جیتنے کا امکان ${data.userWinChance}% ہو گیا!`
            : `Success! Purchased ${selectedQuantity} tickets. Your win chance is now ${data.userWinChance}%!`
        });
        onTicketsBought(data.newBalance, data);
      } else {
        setMsg({ type: 'error', text: data.message || 'Error purchasing tickets' });
      }
    } catch {
      setMsg({ type: 'error', text: 'سرور کنکشن میں خرابی' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrawNow = async () => {
    setDrawingNow(true);
    setMsg(null);
    try {
      const res = await fetch('/api/luckydraw/draw-now', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.recentWinners?.[0]) {
        const winner = data.recentWinners[0];
        setCelebrationWinner(winner);
        sound.playCashOut();
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDrawingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#101622] border border-amber-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col max-h-[92vh]">
        {/* Golden Grand Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-950 via-[#192233] to-amber-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/40 animate-bounce">
              <Gift className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg sm:text-xl font-black text-amber-300 tracking-wider flex items-center gap-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                  <span>{isUrdu ? 'دیسی لکی ڈرا (ہر 30 منٹ)' : 'DESI LUCKY DRAW'}</span>
                  <Sparkles className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
                </h2>
              </div>
              <p className="text-xs text-amber-200/70 font-medium">
                {isUrdu ? 'ہر 30 منٹ بعد عظیم الشان جیک پاٹ کی قرعہ اندازی!' : '30-Minute Guaranteed Jackpot Pool'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Winner Celebration Banner (if draw just triggered) */}
          {celebrationWinner && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 shadow-2xl animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-widest text-slate-900 mb-1">
                <Trophy className="w-4 h-4 fill-current" />
                <span>{isUrdu ? 'قرعہ اندازی کا نیا چیمپئن!' : 'NEW JACKPOT CHAMPION!'}</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-950">
                {celebrationWinner.winnerName}
              </div>
              <div className="font-digit font-extrabold text-2xl sm:text-3xl mt-0.5 text-black">
                ₨ {celebrationWinner.prizeAmount.toLocaleString()} PKR
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                {isUrdu ? 'جیتنے والا ٹکٹ نمبر:' : 'Winning Ticket:'} {celebrationWinner.winningTicketId}
              </div>
            </div>
          )}

          {/* Golden Jackpot Pool Card */}
          <div className="relative rounded-2xl bg-gradient-to-b from-amber-950/60 to-gray-950 border-2 border-amber-500/60 p-5 text-center shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider mb-2 ${isUrdu ? 'font-urdu' : ''}`}>
              <Coins className="w-3.5 h-3.5" />
              {isUrdu ? 'موجودہ جیک پاٹ انعامی رقم' : 'CURRENT JACKPOT PRIZE POOL'}
            </span>

            {/* Huge Jackpot Amount */}
            <div className="font-digit font-black text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]">
              ₨ {drawData.jackpotPool.toLocaleString()}
            </div>
            <div className="text-xs text-amber-200/80 font-bold mt-1 tracking-widest">
              PAKISTANI RUPEES (PKR)
            </div>

            {/* Live 30-min Countdown Clock */}
            <div className="mt-4 pt-4 border-t border-amber-500/20 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-xs font-semibold">
                  {isUrdu ? 'اگلی قرعہ اندازی میں وقت:' : 'Next Draw In:'}
                </span>
                <span className="font-digit font-extrabold text-lg sm:text-xl text-amber-400 bg-black/60 px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                  {formattedTime}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>{isUrdu ? 'کل ٹکٹس:' : 'Total Tickets:'}</span>
                <strong className="text-white font-digit">{drawData.totalTickets}</strong>
              </div>
            </div>
          </div>

          {/* User's Ticket Holdings Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 text-center">
              <span className="text-gray-400 block mb-1">
                {isUrdu ? 'آپ کے ٹکٹس:' : 'Your Tickets:'}
              </span>
              <span className="font-digit font-extrabold text-base text-amber-400">
                {drawData.userTicketsCount} {isUrdu ? 'ٹکٹ' : 'Tickets'}
              </span>
            </div>

            <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 text-center">
              <span className="text-gray-400 block mb-1">
                {isUrdu ? 'جیتنے کا امکان:' : 'Win Probability:'}
              </span>
              <span className="font-digit font-extrabold text-base text-emerald-400">
                {drawData.userWinChance}%
              </span>
            </div>
          </div>

          {/* Feedback Message */}
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300'
                  : 'bg-red-950/80 border border-red-600/70 text-red-300'
              }`}
            >
              {msg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Ticket Purchase Section */}
          <div className="bg-[#141b27] border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold text-white flex items-center gap-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>{isUrdu ? 'لکی ڈرا ٹکٹ منتخب کریں (صرف ₨ 50 فی ٹکٹ):' : 'Select Lucky Draw Tickets (₨ 50 / ticket):'}</span>
              </span>
              <span className="text-xs font-digit text-gray-400">
                {isUrdu ? 'والٹ:' : 'Wallet:'} ₨ {userBalance.toLocaleString()}
              </span>
            </div>

            {/* Quantity Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 5, 10].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setSelectedQuantity(qty)}
                  className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${
                    selectedQuantity === qty
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-gray-900/80 text-gray-300 border-gray-700/80 hover:bg-gray-800'
                  }`}
                >
                  <div className="text-sm font-bold">{qty} {isUrdu ? 'ٹکٹ' : 'Ticket'}</div>
                  <div className="text-[11px] font-digit opacity-80">₨ {qty * drawData.ticketPrice}</div>
                </button>
              ))}
            </div>

            {/* Buy Tickets CTA Button */}
            <button
              type="button"
              onClick={handleBuyTickets}
              disabled={loading || userBalance < totalCost}
              className={`w-full py-4 rounded-xl font-extrabold text-sm sm:text-base tracking-wider transition active:scale-98 shadow-xl cursor-pointer ${
                userBalance >= totalCost
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-950/60'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="flex flex-col items-center leading-tight">
                <span className={`uppercase flex items-center gap-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                  <Sparkles className="w-4 h-4 fill-current" />
                  {isUrdu ? `${selectedQuantity} لکی ٹکٹ خریدیں` : `BUY ${selectedQuantity} TICKETS NOW`}
                </span>
                <span className="font-digit text-xs font-semibold text-slate-900 mt-0.5">
                  ₨ {totalCost.toLocaleString()} PKR (صرف ₨ {totalCost})
                </span>
              </div>
            </button>
          </div>

          {/* Previous Lucky Draw Champions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-xs font-extrabold text-gray-300 flex items-center gap-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{isUrdu ? 'گزشتہ لکی ڈرا چیمپئنز:' : 'Recent Jackpot Winners:'}</span>
              </h4>

              {/* Instant Draw simulation trigger */}
              <button
                type="button"
                onClick={handleDrawNow}
                disabled={drawingNow}
                title="Simulate draw immediately"
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{drawingNow ? 'قرعہ اندازی جاری...' : isUrdu ? 'ابھی قرعہ اندازی کریں (ٹیسٹ)' : 'Test Draw Now'}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {drawData.recentWinners.map((win) => (
                <div
                  key={`${win.drawId}-${win.timestamp}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-950/60 border border-gray-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-400 font-digit font-bold text-[10px]">
                      {win.drawId}
                    </span>
                    <span className="font-bold text-gray-200">{win.winnerName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({win.winningTicketId})</span>
                  </div>
                  <div className="font-digit font-black text-amber-400">
                    +₨ {win.prizeAmount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
