import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Minus, Plus, Zap, CheckCircle2, Bot, Sliders, Play, Square, RotateCcw } from 'lucide-react';
import { sound } from '../utils/sound';

interface BetPanelProps {
  panelId: string; // e.g. 'panel-1' or 'panel-2'
  panelIndex: number;
  userId: string;
  userBalance: number;
  gameStatus: 'WAITING' | 'STARTED' | 'CRASHED';
  currentMultiplier: number;
  isUrdu: boolean;
  onPlaceBet: (panelId: string, amount: number, autoCashOut: number | null) => void;
  onCashOut: (panelId: string, betId: string) => void;
  onCancelBet: (panelId: string, betId: string) => void;
  activeBetState?: {
    betId: string;
    betAmount: number;
    autoCashOut?: number | null;
    cashedOut: boolean;
    cashedOutMultiplier?: number;
    payout?: number;
  } | null;
}

export const BetPanel: React.FC<BetPanelProps> = ({
  panelId,
  panelIndex,
  userId,
  userBalance,
  gameStatus,
  currentMultiplier,
  isUrdu,
  onPlaceBet,
  onCashOut,
  onCancelBet,
  activeBetState
}) => {
  // Mode: Manual vs Auto Bet
  const [tabMode, setTabMode] = useState<'manual' | 'auto'>('manual');

  // Base Bet & Auto Cashout Config
  const [betAmount, setBetAmount] = useState<number>(100);
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState<boolean>(false);
  const [autoCashOutValue, setAutoCashOutValue] = useState<number>(2.0);

  // Auto-Bet System State
  const [autoBetEnabled, setAutoBetEnabled] = useState<boolean>(false);
  const [roundsLimit, setRoundsLimit] = useState<number>(0); // 0 = unlimited
  const [roundsCompleted, setRoundsCompleted] = useState<number>(0);
  const [autoBetError, setAutoBetError] = useState<string | null>(null);

  const prevRoundRef = useRef<string>(gameStatus);

  // Trigger confetti and sound on victory
  useEffect(() => {
    if (activeBetState?.cashedOut && activeBetState.payout) {
      sound.playCashOut();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch {}
    }
  }, [activeBetState?.cashedOut]);

  // Autonomous subsequent rounds betting loop
  useEffect(() => {
    // When game enters WAITING countdown phase
    if (gameStatus === 'WAITING' && autoBetEnabled && !activeBetState) {
      // Check if rounds limit reached
      if (roundsLimit > 0 && roundsCompleted >= roundsLimit) {
        setAutoBetEnabled(false);
        setAutoBetError(isUrdu ? 'راؤنڈز کی حد مکمل ہو گئی!' : 'Auto-bet rounds limit completed!');
        return;
      }

      // Check balance
      if (userBalance < betAmount) {
        setAutoBetEnabled(false);
        setAutoBetError(isUrdu ? 'بیلنس کم ہونے کی وجہ سے آٹو بیٹ روک دی گئی!' : 'Auto-bet stopped: Insufficient balance!');
        sound.playTick();
        return;
      }

      // Automatically place bet for this upcoming round with brief realistic countdown delay
      const timer = setTimeout(() => {
        sound.playBetPlaced();
        onPlaceBet(panelId, betAmount, autoCashOutEnabled ? autoCashOutValue : null);
        setRoundsCompleted((prev) => prev + 1);
        setAutoBetError(null);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [gameStatus, autoBetEnabled, activeBetState, userBalance, betAmount, autoCashOutEnabled, autoCashOutValue, roundsLimit, roundsCompleted, panelId, onPlaceBet, isUrdu]);

  const handleAdjustAmount = (delta: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(50000, Math.round(prev + delta))));
  };

  const handleMultiplyAmount = (factor: number) => {
    setBetAmount((prev) => Math.max(10, Math.min(50000, Math.round(prev * factor))));
  };

  const handleToggleAutoBet = () => {
    if (autoBetEnabled) {
      // Stop Auto-Bet
      setAutoBetEnabled(false);
      sound.playTick();
    } else {
      // Start Auto-Bet
      if (betAmount > userBalance) {
        setAutoBetError(isUrdu ? 'بیلنس کم ہے!' : 'Insufficient balance!');
        sound.playTick();
        return;
      }
      setAutoBetEnabled(true);
      setAutoBetError(null);
      sound.playBetPlaced();

      // If already in WAITING, trigger immediately
      if (gameStatus === 'WAITING' && !activeBetState) {
        onPlaceBet(panelId, betAmount, autoCashOutEnabled ? autoCashOutValue : null);
        setRoundsCompleted(1);
      }
    }
  };

  const handleManualActionClick = () => {
    if (gameStatus === 'WAITING') {
      if (activeBetState) {
        // Cancel bet
        onCancelBet(panelId, activeBetState.betId);
      } else {
        // Place bet
        if (betAmount > userBalance) {
          sound.playTick();
          return;
        }
        sound.playBetPlaced();
        onPlaceBet(panelId, betAmount, autoCashOutEnabled ? autoCashOutValue : null);
      }
    } else if (gameStatus === 'STARTED') {
      if (activeBetState && !activeBetState.cashedOut) {
        // Manual Cash Out
        onCashOut(panelId, activeBetState.betId);
      }
    }
  };

  const currentLiveCashout = activeBetState ? (activeBetState.betAmount * currentMultiplier).toFixed(2) : '0';

  return (
    <div className={`bg-[#121824] border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
      autoBetEnabled ? 'border-amber-500/60 ring-1 ring-amber-500/40 shadow-amber-950/20' : 'border-gray-800/80 hover:border-gray-700/80'
    }`}>
      {/* Header: Mode Tabs (Bet vs Auto) & Auto Cashout Switch */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setTabMode('manual')}
              className={`px-3 py-1 rounded-lg font-extrabold transition cursor-pointer text-xs ${
                tabMode === 'manual'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isUrdu ? 'دستی بیٹ' : 'Bet'}
            </button>
            <button
              type="button"
              onClick={() => setTabMode('auto')}
              className={`px-3 py-1 rounded-lg font-extrabold transition cursor-pointer text-xs flex items-center gap-1.5 ${
                tabMode === 'auto'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'آٹو بیٹ' : 'Auto'}</span>
              {autoBetEnabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>

          {/* Auto Cashout Controls */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={autoCashOutEnabled}
                onChange={(e) => setAutoCashOutEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
              />
              <span className={autoCashOutEnabled ? 'text-amber-400 font-bold' : 'text-gray-400'}>
                {isUrdu ? 'آٹو کیش آؤٹ' : 'Auto Cashout'}
              </span>
            </label>
            {autoCashOutEnabled && (
              <div className="flex items-center bg-gray-900 border border-amber-500/50 rounded-lg px-2 py-0.5 shadow-sm">
                <input
                  type="number"
                  step="0.1"
                  min="1.05"
                  max="100"
                  value={autoCashOutValue}
                  onChange={(e) => setAutoCashOutValue(Math.max(1.05, parseFloat(e.target.value) || 1.1))}
                  className="w-14 bg-transparent text-amber-400 font-digit font-bold text-right outline-none text-xs"
                />
                <span className="text-amber-400 text-xs ml-0.5">x</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount Input with Step Buttons */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1.5">
            <span>{tabMode === 'auto' ? (isUrdu ? 'بنیادی شرط رقم (ہر راؤنڈ):' : 'Base Bet Amount (Per Round):') : (isUrdu ? 'شرط کی رقم:' : 'Bet Amount:')}</span>
            <span className="font-digit text-gray-300">
              {isUrdu ? 'بیلنس:' : 'Balance:'} ₨ {userBalance.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7 sm:col-span-8 flex items-center bg-gray-900/90 border border-gray-700 rounded-xl px-2 py-1.5">
              <button
                type="button"
                onClick={() => handleAdjustAmount(-50)}
                disabled={!!activeBetState}
                className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 active:scale-95 disabled:opacity-40 transition cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-gray-400 text-xs mr-1">₨</span>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  step="10"
                  value={betAmount}
                  disabled={!!activeBetState}
                  onChange={(e) => setBetAmount(Math.max(10, parseFloat(e.target.value) || 10))}
                  className="w-20 bg-transparent text-center font-digit font-bold text-base text-white outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAdjustAmount(50)}
                disabled={!!activeBetState}
                className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 active:scale-95 disabled:opacity-40 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Multipliers (1/2 and 2x) */}
            <div className="col-span-5 sm:col-span-4 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleMultiplyAmount(0.5)}
                disabled={!!activeBetState}
                className="flex-1 py-2 bg-gray-800/80 hover:bg-gray-700 disabled:opacity-40 rounded-xl text-xs font-semibold text-gray-300 transition active:scale-95 cursor-pointer"
              >
                ½
              </button>
              <button
                type="button"
                onClick={() => handleMultiplyAmount(2)}
                disabled={!!activeBetState}
                className="flex-1 py-2 bg-gray-800/80 hover:bg-gray-700 disabled:opacity-40 rounded-xl text-xs font-semibold text-gray-300 transition active:scale-95 cursor-pointer"
              >
                2×
              </button>
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[50, 100, 500, 1000].map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={!!activeBetState}
                onClick={() => setBetAmount(chip)}
                className={`py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  betAmount === chip
                    ? 'bg-red-950/80 text-red-400 border border-red-700/80'
                    : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                } disabled:opacity-40`}
              >
                ₨ {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Auto-Bet Configuration Options (Only shown in Auto tab) */}
        {tabMode === 'auto' && (
          <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-2.5 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-300 font-semibold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-amber-400" />
                <span>{isUrdu ? 'راؤنڈز کی حد:' : 'Rounds Limit:'}</span>
              </span>
              <div className="flex items-center gap-1">
                {[10, 25, 50, 0].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRoundsLimit(r); setRoundsCompleted(0); }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      roundsLimit === r
                        ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                        : 'bg-gray-900 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {r === 0 ? '∞' : `${r}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Bet Live Status Bar */}
            {autoBetEnabled && (
              <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-600/60 text-amber-300 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{isUrdu ? 'آٹو بیٹ فعال ہے' : 'Auto-Bet Active'}</span>
                </span>
                <span className="font-digit text-xs">
                  {isUrdu ? 'راؤنڈ:' : 'Round:'} {roundsCompleted} / {roundsLimit === 0 ? '∞' : roundsLimit}
                </span>
              </div>
            )}

            {autoBetError && (
              <div className="text-[10px] text-red-400 font-medium">
                {autoBetError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Dynamic Action Buttons */}
      <div className="mt-4 space-y-2">
        {/* If in AUTO TAB: Render the Auto-Bet System Control */}
        {tabMode === 'auto' && (
          <div>
            {!autoBetEnabled ? (
              <button
                type="button"
                onClick={handleToggleAutoBet}
                disabled={userBalance < betAmount}
                className={`w-full py-4 rounded-xl font-extrabold text-base tracking-wider transition transform active:scale-98 shadow-lg cursor-pointer ${
                  userBalance >= betAmount
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-gray-950 shadow-amber-950/50'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className={`flex items-center gap-1.5 text-base sm:text-lg uppercase ${isUrdu ? 'font-urdu' : ''}`}>
                    <Play className="w-4 h-4 fill-current" />
                    {isUrdu ? 'آٹو بیٹ شروع کریں' : 'START AUTO BET'}
                  </span>
                  <span className="font-digit text-xs font-semibold text-gray-900 mt-0.5">
                    ₨ {betAmount.toLocaleString()} / {isUrdu ? 'راؤنڈ' : 'round'}
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleAutoBet}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-base tracking-wider shadow-lg shadow-red-950/60 active:scale-98 transition cursor-pointer"
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className={`flex items-center gap-1.5 text-base uppercase ${isUrdu ? 'font-urdu' : ''}`}>
                    <Square className="w-4 h-4 fill-current" />
                    {isUrdu ? 'آٹو بیٹ روکیں' : 'STOP AUTO BET'}
                  </span>
                  <span className="font-digit text-xs text-red-200 mt-0.5">
                    {isUrdu ? 'چل رہا ہے' : 'Running'} ({roundsCompleted} / {roundsLimit === 0 ? '∞' : roundsLimit})
                  </span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* If in MANUAL TAB or if round is flying and user has active bet: Provide Cashout button */}
        {tabMode === 'manual' && (
          <div>
            {/* State 1: Round WAITING and no bet placed */}
            {gameStatus === 'WAITING' && !activeBetState && (
              <button
                type="button"
                onClick={handleManualActionClick}
                disabled={userBalance < betAmount}
                className={`w-full py-4 rounded-xl font-extrabold text-base tracking-wider transition-all duration-150 transform active:scale-98 shadow-lg cursor-pointer ${
                  userBalance >= betAmount
                    ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white shadow-emerald-950/50 hover:shadow-emerald-600/30'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className={`text-lg uppercase ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'شرط لگائیں' : 'BET'}
                  </span>
                  <span className="font-digit text-xs font-semibold text-emerald-100">
                    ₨ {betAmount.toLocaleString()}
                  </span>
                </div>
              </button>
            )}

            {/* State 2: Round WAITING and bet placed (can CANCEL) */}
            {gameStatus === 'WAITING' && activeBetState && (
              <button
                type="button"
                onClick={handleManualActionClick}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-base tracking-wider shadow-lg shadow-red-950/50 active:scale-98 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className={`text-base uppercase ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'منسوخ کریں (واپسی)' : 'CANCEL BET'}
                  </span>
                  <span className="font-digit text-xs text-red-200">
                    ₨ {activeBetState.betAmount.toLocaleString()}
                  </span>
                </div>
              </button>
            )}

            {/* State 3: Round STARTED or CRASHED without bet placed */}
            {!activeBetState && (gameStatus === 'STARTED' || gameStatus === 'CRASHED') && (
              <div className="w-full py-4 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-500 text-center flex flex-col items-center justify-center">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'اگلے راؤنڈ کے لیے تیار رہیں' : 'WAIT FOR NEXT ROUND'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Universal In-Flight Active Bet & Cashout Display (Shows in both Manual and Auto modes if a bet is live) */}
        {activeBetState && (
          <div className="pt-1">
            {/* If flight is running and not cashed out yet: MANUAL CASH OUT BUTTON */}
            {gameStatus === 'STARTED' && !activeBetState.cashedOut && (
              <button
                type="button"
                onClick={() => onCashOut(panelId, activeBetState.betId)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-gray-950 font-black text-lg tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all animate-pulse cursor-pointer"
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className={`flex items-center gap-1.5 uppercase ${isUrdu ? 'font-urdu' : ''}`}>
                    <Zap className="w-5 h-5 fill-current" />
                    {isUrdu ? 'کیش آؤٹ کریں' : 'CASH OUT'}
                  </span>
                  <span className="font-digit text-base font-extrabold text-gray-900 mt-0.5">
                    ₨ {currentLiveCashout} <span className="text-xs font-semibold">({currentMultiplier.toFixed(2)}x)</span>
                  </span>
                </div>
              </button>
            )}

            {/* If cashed out successfully */}
            {activeBetState.cashedOut && (
              <div className="w-full py-3.5 px-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-400 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isUrdu ? 'کامیاب کیش آؤٹ!' : 'CASHED OUT!'}</span>
                </div>
                <div className="font-digit text-lg font-black text-emerald-300">
                  +₨ {activeBetState.payout?.toLocaleString()} <span className="text-xs font-normal">({activeBetState.cashedOutMultiplier}x)</span>
                </div>
              </div>
            )}

            {/* If crashed before cashing out */}
            {gameStatus === 'CRASHED' && !activeBetState.cashedOut && (
              <div className="w-full py-3.5 px-4 rounded-xl bg-red-950/60 border border-red-700/60 text-red-400 text-center flex flex-col items-center justify-center">
                <span className={`text-xs font-bold uppercase ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'طیارہ اڑ گیا! (رقم ضائع)' : 'FLEW AWAY (Lost)'}
                </span>
                <span className="font-digit text-sm font-semibold text-red-300">
                  -₨ {activeBetState.betAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
