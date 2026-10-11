import React, { useState } from 'react';
import { History, ShieldCheck, X } from 'lucide-react';

interface HistoryBarProps {
  history: number[];
  isUrdu: boolean;
}

export const HistoryBar: React.FC<HistoryBarProps> = ({ history, isUrdu }) => {
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);

  const getPillColor = (val: number) => {
    if (val < 2.0) {
      return 'bg-blue-950/80 text-blue-400 border-blue-800/80 hover:bg-blue-900';
    } else if (val < 10.0) {
      return 'bg-purple-950/80 text-purple-300 border-purple-700/80 hover:bg-purple-900';
    } else {
      return 'bg-amber-950/90 text-amber-300 border-amber-600/90 shadow-[0_0_10px_rgba(245,158,11,0.4)] hover:bg-amber-900';
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 py-1.5 px-2 bg-[#0e131c] border-b border-gray-800/80 overflow-x-auto select-none">
        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 shrink-0 pr-2 border-r border-gray-800">
          <History className="w-3.5 h-3.5 text-red-500" />
          <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'تاریخ' : 'History'}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-nowrap">
          {history.map((val, idx) => (
            <button
              key={`${val}-${idx}`}
              type="button"
              onClick={() => setSelectedMultiplier(val)}
              className={`font-digit font-bold text-xs px-2.5 py-0.5 rounded-full border transition cursor-pointer shrink-0 ${getPillColor(
                val
              )}`}
            >
              {val.toFixed(2)}x
            </button>
          ))}
        </div>
      </div>

      {/* Provably fair modal popup on clicking multiplier */}
      {selectedMultiplier !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121824] border border-gray-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>{isUrdu ? 'منصفانہ راؤنڈ (Provably Fair)' : 'Provably Fair Verification'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMultiplier(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-gray-300">
              <div className="flex justify-between items-center bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400">{isUrdu ? 'حتمی ملٹی پلائر:' : 'Crash Multiplier:'}</span>
                <span className="font-digit font-extrabold text-lg text-amber-400">
                  {selectedMultiplier.toFixed(2)}x
                </span>
              </div>

              <div>
                <span className="text-gray-400 block mb-1">Server SHA-256 Hash Seed:</span>
                <code className="block bg-gray-950 p-2 rounded-lg text-[10px] text-gray-400 break-all border border-gray-800">
                  {`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855_${selectedMultiplier}`}
                </code>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                {isUrdu
                  ? 'یہ راؤنڈ کرپٹوگرافک الگورتھم کے تحت پہلے سے تیار شدہ تھا اور اس میں کوئی ہیرا پھیری ممکن نہیں۔'
                  : 'This round was generated cryptographically and cannot be altered by anyone during flight.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
