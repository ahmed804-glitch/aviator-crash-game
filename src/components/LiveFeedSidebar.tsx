import React, { useState } from 'react';
import { Users, User, Trophy, MessageSquare, Send } from 'lucide-react';
import { TopPilotsLeaderboard, PilotRecord } from './TopPilotsLeaderboard';

interface ActiveBet {
  id: string;
  userId: string;
  userName: string;
  betAmount: number;
  autoCashOut?: number | null;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  payout?: number;
  isBot?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  time: string;
}

interface LiveFeedSidebarProps {
  bets: ActiveBet[];
  currentUserId: string;
  isUrdu: boolean;
  chatMessages: ChatMessage[];
  topPilots: PilotRecord[];
  onSendMessage: (text: string) => void;
}

export const LiveFeedSidebar: React.FC<LiveFeedSidebarProps> = ({
  bets,
  currentUserId,
  isUrdu,
  chatMessages,
  topPilots,
  onSendMessage
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top' | 'chat'>('all');
  const [chatInput, setChatInput] = useState('');

  const myBets = bets.filter((b) => b.userId === currentUserId);
  const totalPot = bets.reduce((sum, b) => sum + b.betAmount, 0);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleQuickChat = (phrase: string) => {
    onSendMessage(phrase);
  };

  return (
    <div className="bg-[#10151f] border border-gray-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Top Tabs */}
      <div className="grid grid-cols-4 border-b border-gray-800 bg-[#0c1017]">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`py-3 px-1 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'all'
              ? 'text-red-400 border-b-2 border-red-500 bg-red-950/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'تمام' : 'All'} ({bets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my')}
          className={`py-3 px-1 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'my'
              ? 'text-red-400 border-b-2 border-red-500 bg-red-950/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'میری' : 'My'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('top')}
          className={`py-3 px-1 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer relative ${
            activeTab === 'top'
              ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-950/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'ٹاپ پائلٹس' : 'Top Pilots'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`py-3 px-1 text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'chat'
              ? 'text-red-400 border-b-2 border-red-500 bg-red-950/20'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'چیٹ' : 'Chat'}</span>
        </button>
      </div>

      {/* Round Subhead (Shown for All and My tabs) */}
      {(activeTab === 'all' || activeTab === 'my') && (
        <div className="px-3.5 py-2 bg-gray-950/70 border-b border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <span>
            {isUrdu ? 'اس راؤنڈ کی شرطیں:' : 'Round Bets:'}{' '}
            <strong className="text-white font-digit">{bets.length}</strong>
          </span>
          <span>
            {isUrdu ? 'کل رقم:' : 'Total Pool:'}{' '}
            <strong className="text-amber-400 font-digit">₨ {totalPot.toLocaleString()}</strong>
          </span>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-[260px]">
        {/* ALL BETS TAB */}
        {activeTab === 'all' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {bets.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                {isUrdu ? 'اس راؤنڈ میں کوئی شرط نہیں' : 'No bets this round yet'}
              </div>
            ) : (
              bets.map((bet) => (
                <div
                  key={bet.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition border ${
                    bet.cashedOut
                      ? 'bg-emerald-950/30 border-emerald-900/60'
                      : 'bg-gray-900/40 border-gray-800/60'
                  } ${bet.userId === currentUserId ? 'ring-1 ring-amber-500/70' : ''}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        bet.userId === currentUserId
                          ? 'bg-amber-500 text-black'
                          : bet.cashedOut
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {bet.userName.slice(0, 1)}
                    </div>
                    <div className="truncate font-semibold text-gray-300">
                      {bet.userName}
                      {bet.userId === currentUserId && (
                        <span className="ml-1 text-[10px] text-amber-400 font-bold">(YOU)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-digit text-gray-300">₨ {bet.betAmount.toLocaleString()}</span>

                    {bet.cashedOut ? (
                      <div className="flex items-center gap-1 bg-emerald-950/90 border border-emerald-700/80 px-2 py-0.5 rounded-lg text-emerald-400 font-digit font-bold text-[11px]">
                        <span>{bet.cashedOutMultiplier?.toFixed(2)}x</span>
                        <span className="text-[10px] font-semibold text-emerald-300">
                          (₨ {bet.payout?.toLocaleString()})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-lg">
                        {isUrdu ? 'پرواز میں' : 'In Flight'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MY BETS TAB */}
        {activeTab === 'my' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {myBets.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                {isUrdu ? 'آپ نے اس راؤنڈ میں کوئی شرط نہیں لگائی' : 'You have placed no bets in this round'}
              </div>
            ) : (
              myBets.map((bet) => (
                <div
                  key={bet.id}
                  className={`p-3 rounded-xl border text-xs ${
                    bet.cashedOut
                      ? 'bg-emerald-950/40 border-emerald-700/80'
                      : 'bg-amber-950/20 border-amber-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-200">
                      {isUrdu ? 'شرط رقم:' : 'Bet:'} ₨ {bet.betAmount.toLocaleString()}
                    </span>
                    {bet.cashedOut ? (
                      <span className="text-emerald-400 font-bold bg-emerald-900/50 px-2 py-0.5 rounded-md text-[11px]">
                        +{bet.cashedOutMultiplier}x
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold">{isUrdu ? 'جاری ہے' : 'Active'}</span>
                    )}
                  </div>
                  {bet.cashedOut && (
                    <div className="text-right font-digit font-bold text-emerald-300 text-sm">
                      +{bet.payout?.toLocaleString()} PKR
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TOP PILOTS LEADERBOARD TAB */}
        {activeTab === 'top' && (
          <TopPilotsLeaderboard
            pilots={topPilots}
            currentUserId={currentUserId}
            isUrdu={isUrdu}
          />
        )}

        {/* LIVE CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full justify-between p-2">
            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
              {chatMessages.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">
                  {isUrdu ? 'ابھی کوئی پیغام نہیں' : 'No chat messages yet'}
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-xl text-xs max-w-[90%] ${
                      msg.userId === currentUserId
                        ? 'ml-auto bg-red-950/50 border border-red-800/70 text-right'
                        : 'bg-gray-900 border border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-0.5 justify-between">
                      <span className="font-bold text-gray-300">{msg.userName}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="text-gray-200 break-words">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Quick Messages */}
            <div className="pt-2 border-t border-gray-800 mt-2">
              <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
                {(isUrdu
                  ? ['واہ 🚀', 'کیش آؤٹ کر لو! 💰', 'اوہ کریش! 💥', 'شاباش! 🔥', '2x پکا ہے 🎯']
                  : ['Fly high! 🚀', 'Cash out! 💰', 'Crashed! 💥', 'LFG! 🔥', 'To the moon! 🌙']
                ).map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => handleQuickChat(phrase)}
                    className="whitespace-nowrap px-2 py-0.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-md text-[10px] text-gray-300 transition cursor-pointer"
                  >
                    {phrase}
                  </button>
                ))}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendChat} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isUrdu ? 'پیغام لکھیں...' : 'Type message...'}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
