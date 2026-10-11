import React, { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, Wallet, ShieldCheck, CheckCircle2, History, CreditCard } from 'lucide-react';
import { sound } from '../utils/sound';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  amount: number;
  multiplier?: number;
  timestamp: number;
  note?: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
  history: Transaction[];
  isUrdu: boolean;
  onDepositSuccess: (newBalance: number, newHistory: Transaction[]) => void;
  onWithdrawSuccess: (newBalance: number, newHistory: Transaction[]) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  userId,
  balance,
  history,
  isUrdu,
  onDepositSuccess,
  onWithdrawSuccess
}) => {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [depositMethod, setDepositMethod] = useState<string>('JazzCash');
  const [senderNumber, setSenderNumber] = useState<string>('03001234567');

  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);
  const [withdrawMethod, setWithdrawMethod] = useState<string>('EasyPaisa');
  const [accountTitle, setAccountTitle] = useState<string>('احمد خان (Ahmed Khan)');
  const [accountNumber, setAccountNumber] = useState<string>('03451234567');

  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    if (!depositAmount || depositAmount < 50) {
      setMsg({ type: 'error', text: isUrdu ? 'کم از کم 50 روپے جمع کروائیں' : 'Minimum deposit is ₨ 50' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: depositAmount,
          method: depositMethod,
          senderNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        sound.playCashOut();
        setMsg({
          type: 'success',
          text: isUrdu
            ? `₨ ${depositAmount.toLocaleString()} دیسی والٹ میں کامیابی سے جمع ہو گئے!`
            : `₨ ${depositAmount.toLocaleString()} deposited successfully to Desi Wallet!`
        });
        onDepositSuccess(data.newBalance, data.user?.history || []);
      } else {
        setMsg({ type: 'error', text: data.message || 'Error processing deposit' });
      }
    } catch {
      setMsg({ type: 'error', text: 'سرور کنکشن میں خرابی (Network error)' });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount < 100) {
      setMsg({ type: 'error', text: isUrdu ? 'کم از کم 100 روپے نکلوا سکتے ہیں' : 'Minimum withdrawal is ₨ 100' });
      return;
    }
    if (withdrawAmount > balance) {
      setMsg({ type: 'error', text: isUrdu ? 'والٹ میں رقم کم ہے!' : 'Insufficient wallet balance!' });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: withdrawAmount,
          method: withdrawMethod,
          accountTitle,
          accountNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        sound.playTick();
        setMsg({
          type: 'success',
          text: isUrdu
            ? `₨ ${withdrawAmount.toLocaleString()} کی رقم آپ کے ${withdrawMethod} اکاؤنٹ میں منتقل ہو رہی ہے!`
            : `₨ ${withdrawAmount.toLocaleString()} withdrawal sent to your ${withdrawMethod} account!`
        });
        onWithdrawSuccess(data.newBalance, data.user?.history || []);
      } else {
        setMsg({ type: 'error', text: data.message || 'Error processing withdrawal' });
      }
    } catch {
      setMsg({ type: 'error', text: 'سرور کنکشن میں خرابی' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111722] border border-gray-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0d131c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-gray-950 font-bold shadow-md">
              <Wallet className="w-5 h-5 text-gray-950" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold text-white flex items-center gap-2 ${isUrdu ? 'font-urdu' : ''}`}>
                {isUrdu ? 'دیسی والٹ (Desi Wallet)' : 'Desi Wallet'}
              </h2>
              <p className="text-xs text-gray-400 font-digit">
                {isUrdu ? 'موجودہ بیلنس:' : 'Balance:'}{' '}
                <span className="text-amber-400 font-bold text-sm">₨ {balance.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-gray-800 bg-gray-950/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => { setTab('deposit'); setMsg(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'deposit'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'ڈپازٹ' : 'Deposit'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('withdraw'); setMsg(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'withdraw'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'نکلوائیں' : 'Withdraw'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('history'); setMsg(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'history'
                ? 'bg-gray-800 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'ہسٹری' : 'History'}</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-4">
          {msg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                msg.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300'
                  : 'bg-red-950/80 border border-red-600/70 text-red-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* TAB 1: DEPOSIT */}
          {tab === 'deposit' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold text-gray-300 mb-2 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'ڈپازٹ کا طریقہ منتخب کریں:' : 'Select Deposit Method:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['JazzCash', 'EasyPaisa', 'SadaPay', 'NayaPay', 'Raast', 'Bank Pay'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setDepositMethod(method)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        depositMethod === method
                          ? 'border-emerald-500 bg-emerald-950/50 text-emerald-400 shadow-sm'
                          : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold text-gray-300 mb-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'رقم درج کریں (روپے):' : 'Deposit Amount (PKR):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-digit font-bold">
                    ₨
                  </span>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white font-digit font-bold text-base focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                {/* Fast Chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[500, 1000, 2500, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className="flex-1 py-1 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-300 transition cursor-pointer"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold text-gray-300 mb-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'بھیجنے والے کا اکاؤنٹ / فون نمبر:' : 'Sender Mobile / Account Number:'}
                </label>
                <input
                  type="text"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="03XXXXXXXXX"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-xs font-digit focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-gray-950/70 border border-gray-800 rounded-xl text-xs text-gray-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {isUrdu
                    ? 'فوری دیسی والٹ ڈپازٹ: کلک کرنے پر رقم فوری طور پر تصدیق ہو کر آپ کے والٹ میں آ جائے گی!'
                    : 'Instant automated Desi Wallet deposit: Funds credit instantly to your game balance.'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleDeposit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm tracking-wider shadow-lg shadow-emerald-950/60 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'پروسیسنگ...' : isUrdu ? `₨ ${depositAmount.toLocaleString()} ڈپازٹ کریں` : `Deposit ₨ ${depositAmount.toLocaleString()}`}
              </button>
            </div>
          )}

          {/* TAB 2: WITHDRAW */}
          {tab === 'withdraw' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold text-gray-300 mb-2 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'رقم وصول کرنے کا طریقہ:' : 'Select Payout Method:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['EasyPaisa', 'JazzCash', 'SadaPay', 'Raast', 'Meezan Bank', 'HBL Bank'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setWithdrawMethod(method)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        withdrawMethod === method
                          ? 'border-red-500 bg-red-950/50 text-red-400 shadow-sm'
                          : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-semibold text-gray-300 ${isUrdu ? 'font-urdu' : ''}`}>
                    {isUrdu ? 'رقم درج کریں (روپے):' : 'Withdraw Amount (PKR):'}
                  </label>
                  <span className="text-xs text-gray-400">
                    {isUrdu ? 'زیادہ سے زیادہ:' : 'Available:'} ₨ {balance.toLocaleString()}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-digit font-bold">
                    ₨
                  </span>
                  <input
                    type="number"
                    min="100"
                    max={balance}
                    step="50"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white font-digit font-bold text-base focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(Math.floor(balance * 0.25))}
                    className="flex-1 py-1 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-300 transition cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(Math.floor(balance * 0.5))}
                    className="flex-1 py-1 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-300 transition cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(Math.floor(balance))}
                    className="flex-1 py-1 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-300 transition cursor-pointer"
                  >
                    100%
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold text-gray-300 mb-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'اکاؤنٹ کا نام (Account Title):' : 'Account Title Name:'}
                </label>
                <input
                  type="text"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold text-gray-300 mb-1.5 ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'اکاؤنٹ نمبر / موبائل نمبر:' : 'Account / IBAN / Phone:'}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white text-xs font-digit focus:border-red-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={loading || balance < withdrawAmount}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm tracking-wider shadow-lg shadow-red-950/60 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'پروسیسنگ...' : isUrdu ? `₨ ${withdrawAmount.toLocaleString()} رقم نکلوائیں` : `Withdraw ₨ ${withdrawAmount.toLocaleString()}`}
              </button>
            </div>
          )}

          {/* TAB 3: TRANSACTION HISTORY */}
          {tab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  {isUrdu ? 'ابھی کوئی لین دین موجود نہیں' : 'No transactions yet'}
                </div>
              ) : (
                history.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                          tx.type === 'win'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : tx.type === 'deposit'
                            ? 'bg-green-950 text-green-400 border border-green-700'
                            : tx.type === 'withdraw'
                            ? 'bg-amber-950 text-amber-400 border border-amber-700'
                            : 'bg-red-950 text-red-400 border border-red-700'
                        }`}
                      >
                        {tx.type === 'win' || tx.type === 'deposit' ? '+' : '-'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-200">
                          {tx.note || tx.type.toUpperCase()}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-digit font-bold text-sm ${
                        tx.type === 'win' || tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'win' || tx.type === 'deposit' ? '+' : '-'}₨ {tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
