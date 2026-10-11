import React from 'react';
import { Plane, Wallet, Volume2, VolumeX, Globe, HelpCircle, PlusCircle, Gift, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface NavbarProps {
  balance: number;
  roundId: string;
  isUrdu: boolean;
  soundEnabled: boolean;
  jackpotPool: number;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  onOpenWallet: () => void;
  onOpenRules: () => void;
  onOpenLuckyDraw: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  balance,
  roundId,
  isUrdu,
  soundEnabled,
  jackpotPool,
  onToggleSound,
  onToggleLanguage,
  onOpenWallet,
  onOpenRules,
  onOpenLuckyDraw
}) => {
  return (
    <header className="bg-[#0b0e14] border-b border-gray-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Round Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-950/50">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-base tracking-wider text-white">AVIATOR</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/60 text-red-400 border border-red-800/60">
                DESI
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-digit mt-0.5">{roundId}</div>
          </div>
        </div>
      </div>

      {/* Center / Right: Lucky Draw, Desi Wallet & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Lucky Draw 30-min Jackpot Button */}
        <button
          type="button"
          onClick={onOpenLuckyDraw}
          className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-950 via-yellow-950/80 to-amber-950 border border-amber-500/70 hover:border-amber-400 px-2.5 sm:px-3 py-1.5 rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.45)] active:scale-95 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Gift className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="text-left">
            <div className="text-[10px] text-amber-300 font-bold leading-none flex items-center gap-1">
              <span>{isUrdu ? 'لکی ڈرا' : 'Lucky Draw'}</span>
              <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="font-digit font-extrabold text-xs sm:text-sm text-yellow-300 leading-tight">
              ₨ {jackpotPool.toLocaleString()}
            </div>
          </div>
        </button>

        {/* Desi Wallet Button */}
        <button
          type="button"
          onClick={onOpenWallet}
          className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-850 hover:from-gray-850 hover:to-gray-800 border border-gray-700/80 px-3 py-1.5 rounded-xl transition shadow-md active:scale-95 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-[10px] text-gray-400 font-medium leading-none">
              {isUrdu ? 'دیسی والٹ' : 'Desi Wallet'}
            </div>
            <div className="font-digit font-extrabold text-xs sm:text-sm text-emerald-400 leading-tight">
              ₨ {balance.toLocaleString()}
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-lg shadow-sm">
            <PlusCircle className="w-3 h-3" />
            {isUrdu ? 'ڈپازٹ' : 'Deposit'}
          </span>
        </button>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 transition cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
        </button>

        {/* Language Toggle (Urdu / English) */}
        <button
          type="button"
          onClick={onToggleLanguage}
          title="Switch Language"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 text-xs font-bold transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-red-400" />
          <span>{isUrdu ? 'EN' : 'اردو'}</span>
        </button>

        {/* Rules Modal */}
        <button
          type="button"
          onClick={onOpenRules}
          title="Game Rules"
          className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-800 transition cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
