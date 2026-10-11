import React from 'react';
import { X, ShieldCheck, Zap, DollarSign, Rocket, AlertTriangle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUrdu: boolean;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, isUrdu }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121824] border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <Rocket className="w-5 h-5 text-red-500" />
            <span className={isUrdu ? 'font-urdu' : ''}>
              {isUrdu ? 'ایوی ایٹر کھیلنے کے اصول اور رہنمائی' : 'How to Play Aviator Crash'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-gray-300">
          {/* Step 1 */}
          <div className="flex gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
            <div className="w-7 h-7 rounded-lg bg-red-950 text-red-400 font-bold flex items-center justify-center shrink-0 border border-red-800">
              1
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {isUrdu ? 'شرط کی رقم منتخب کریں (Place Your Bet)' : '1. Set Your Bet'}
              </h4>
              <p className="text-gray-400 leading-relaxed">
                {isUrdu
                  ? 'کاؤنٹ ڈاؤن کے دوران اپنی مطلوبہ رقم منتخب کر کے سبز "شرط لگائیں" بٹن دبائیں۔ آپ ایک وقت میں دو الگ پینلز سے شرطیں لگا سکتے ہیں۔'
                  : 'Choose your desired bet amount before the countdown expires and press the green "BET" button. You can place two independent bets at the same time.'}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
            <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-800">
              2
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {isUrdu ? 'پرواز اور بڑھتا ملٹی پلائر (Watch the Climb)' : '2. Plane Takeoff & Multiplier'}
              </h4>
              <p className="text-gray-400 leading-relaxed">
                {isUrdu
                  ? 'طیارہ 1.00x سے اڑان بھرے گا اور ملٹی پلائر تیزی سے اوپر جائے گا۔ 1.50x، 2.00x، 10.00x یا اس سے بھی زیادہ!'
                  : 'The lucky red plane takes off starting at 1.00x. The multiplier curve scales dynamically as the plane flies higher.'}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-800">
              3
            </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {isUrdu ? 'وقت پر کیش آؤٹ کریں (Cash Out to Win)' : '3. Cash Out Before Crash'}
              </h4>
              <p className="text-gray-400 leading-relaxed">
                {isUrdu
                  ? 'طیارہ اڑنے یا غائب ہونے سے پہلے نارنجی "کیش آؤٹ" بٹن دبائیں۔ آپ کو آپ کی شرط ضرب موجودہ ملٹی پلائر کے برابر فوری رقم مل جائے گی!'
                  : 'Click the "CASH OUT" button before the plane flies away! Your payout will be calculated as Bet × Multiplier and credited directly to your Desi Wallet.'}
              </p>
            </div>
          </div>

          {/* Auto Cashout Tip */}
          <div className="flex gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
            <Zap className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {isUrdu ? 'آٹو کیش آؤٹ فیچر (Auto Cashout)' : 'Auto Cashout Strategy'}
              </h4>
              <p className="text-gray-400 leading-relaxed">
                {isUrdu
                  ? 'آپ خودکار کیش آؤٹ فعال کر سکتے ہیں (مثلاً 2.00x)۔ ملٹی پلائر پہنچتے ہی سسٹم بغیر کسی تاخیر کے خود بخود کیش آؤٹ کر دے گا۔'
                  : 'Enable auto cashout at a fixed multiplier target (e.g. 1.80x or 2.50x) to eliminate reaction latency and secure profit consistently.'}
              </p>
            </div>
          </div>

          {/* Desi Wallet Tip */}
          <div className="flex gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
            <DollarSign className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {isUrdu ? 'دیسی والٹ (Desi Wallet)' : 'Desi Wallet Support'}
              </h4>
              <p className="text-gray-400 leading-relaxed">
                {isUrdu
                  ? 'جاز کیش، ایزی پیسہ، نیا پے، اور بینک ٹرانسفر کے ذریعے ڈپازٹ اور فوری کیش نکلوانے کی مکمل سہولت موجود ہے۔'
                  : 'Easily deposit and withdraw simulated PKR funds through JazzCash, EasyPaisa, SadaPay, and Bank accounts.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          {isUrdu ? 'سمجھ آگیا، شروع کریں!' : 'Got It, Let\'s Play!'}
        </button>
      </div>
    </div>
  );
};
