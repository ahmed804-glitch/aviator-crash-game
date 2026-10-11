import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Navbar } from './components/Navbar';
import { HistoryBar } from './components/HistoryBar';
import { FlightCanvas } from './components/FlightCanvas';
import { BetPanel } from './components/BetPanel';
import { LiveFeedSidebar } from './components/LiveFeedSidebar';
import { PilotRecord } from './components/TopPilotsLeaderboard';
import { WalletModal } from './components/WalletModal';
import { RulesModal } from './components/RulesModal';
import { LuckyDrawModal, LuckyDrawSummary } from './components/LuckyDrawModal';
import { sound } from './utils/sound';

interface UserData {
  id: string;
  name: string;
  balance: number;
  currency: string;
  history: Array<{
    id: string;
    type: 'deposit' | 'withdraw' | 'bet' | 'win';
    amount: number;
    multiplier?: number;
    timestamp: number;
    note?: string;
  }>;
}

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

interface PanelBetState {
  betId: string;
  betAmount: number;
  autoCashOut?: number | null;
  cashedOut: boolean;
  cashedOutMultiplier?: number;
  payout?: number;
}

export default function App() {
  const [userId] = useState<string>('user123');
  const [user, setUser] = useState<UserData>({
    id: 'user123',
    name: 'Desi Pilot (احمد خان)',
    balance: 5000.0,
    currency: 'PKR',
    history: []
  });

  const [gameStatus, setGameStatus] = useState<'WAITING' | 'STARTED' | 'CRASHED'>('WAITING');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [finalMultiplier, setFinalMultiplier] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<number>(5);
  const [roundId, setRoundId] = useState<string>('RD-1042');
  const [history, setHistory] = useState<number[]>([1.45, 2.84, 1.12, 5.67, 1.88, 12.4, 3.14]);
  const [bets, setBets] = useState<ActiveBet[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'c1', userId: 'bot-1', userName: 'Babar_PK', text: 'السلام علیکم سب پائلٹس کو! 🚀', time: '10:00' },
    { id: 'c2', userId: 'bot-2', userName: 'Zain_Lahore', text: 'آج 10x سے اوپر جائے گا ان شاء اللہ!', time: '10:01' }
  ]);
  const [topPilots, setTopPilots] = useState<PilotRecord[]>([
    { id: 'pilot-malik', name: 'Malik_Rwp', city: 'راولپنڈی', totalWinnings: 345600, highestMultiplier: 38.5, winsCount: 142 },
    { id: 'pilot-karachi', name: 'KarachiKing', city: 'کراچی', totalWinnings: 289400, highestMultiplier: 42.1, winsCount: 118 },
    { id: 'pilot-babar', name: 'Babar_PK', city: 'لاہور', totalWinnings: 245150, highestMultiplier: 24.8, winsCount: 96 },
    { id: 'user123', name: 'Desi Pilot (احمد خان)', city: 'لاہور', totalWinnings: 185000, highestMultiplier: 15.6, winsCount: 42 },
    { id: 'pilot-fatima', name: 'Fatima_99', city: 'اسلام آباد', totalWinnings: 156800, highestMultiplier: 19.2, winsCount: 74 },
    { id: 'pilot-zain', name: 'Zain_Lahore', city: 'لاہور', totalWinnings: 142300, highestMultiplier: 14.5, winsCount: 62 },
    { id: 'pilot-sikandar', name: 'Sikandar_777', city: 'ملتان', totalWinnings: 128900, highestMultiplier: 31.0, winsCount: 53 },
    { id: 'pilot-ali', name: 'Ali_Gujrat', city: 'گجرات', totalWinnings: 115400, highestMultiplier: 12.8, winsCount: 49 },
    { id: 'pilot-hamza', name: 'Hamza_Vip', city: 'فیصل آباد', totalWinnings: 98750, highestMultiplier: 16.4, winsCount: 38 },
    { id: 'pilot-noor', name: 'Noor_Peshawar', city: 'پشاور', totalWinnings: 89200, highestMultiplier: 22.0, winsCount: 31 }
  ]);

  // Dual Betting Panels State
  const [panel1Bet, setPanel1Bet] = useState<PanelBetState | null>(null);
  const [panel2Bet, setPanel2Bet] = useState<PanelBetState | null>(null);

  // Modals & UI States
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isLuckyDrawOpen, setIsLuckyDrawOpen] = useState<boolean>(false);
  const [isUrdu, setIsUrdu] = useState<boolean>(true); // Default to Urdu for authentic Desi experience
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [luckyDrawData, setLuckyDrawData] = useState<LuckyDrawSummary>({
    drawId: 'LD-88',
    jackpotPool: 185450,
    ticketPrice: 50,
    nextDrawTime: Date.now() + 24 * 60 * 1000 + 40 * 1000,
    totalTickets: 25,
    userTicketsCount: 0,
    userWinChance: 0,
    userTickets: [],
    recentWinners: [
      { drawId: 'LD-87', winnerName: 'Babar_PK', winnerUserId: 'bot-0', prizeAmount: 165000, winningTicketId: 'TCK-8721', timestamp: Date.now() - 32 * 60 * 1000 },
      { drawId: 'LD-86', winnerName: 'Malik_Rwp', winnerUserId: 'bot-1', prizeAmount: 210000, winningTicketId: 'TCK-8614', timestamp: Date.now() - 62 * 60 * 1000 },
      { drawId: 'LD-85', winnerName: 'Desi Pilot (احمد خان)', winnerUserId: 'user123', prizeAmount: 145000, winningTicketId: 'TCK-8509', timestamp: Date.now() - 95 * 60 * 1000 }
    ]
  });

  const socketRef = useRef<Socket | null>(null);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Fetch initial wallet & leaderboard & luckydraw with graceful retries
  useEffect(() => {
    let isMounted = true;

    const fetchWallet = async (retries = 3) => {
      try {
        const res = await fetch(`/api/wallet/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.user) {
            setUser(data.user);
          }
        } else if (retries > 0) {
          setTimeout(() => fetchWallet(retries - 1), 1500);
        }
      } catch {
        // If transient network or server warmup, retry softly without error logging
        if (retries > 0) {
          setTimeout(() => fetchWallet(retries - 1), 1500);
        }
      }

      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.topPilots) {
            setTopPilots(data.topPilots);
          }
        }
      } catch {
        // Silently handled
      }

      try {
        const res = await fetch(`/api/luckydraw?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setLuckyDrawData(data);
          }
        }
      } catch {
        // Silently handled
      }
    };

    fetchWallet();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Connect Socket.io
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_user_room', { userId });
      socket.emit('get_wallet', { userId });
    });

    socket.on('wallet_sync', (data) => {
      if (data.user) {
        setUser(data.user);
      }
    });

    socket.on('game_init', (data) => {
      setGameStatus(data.status);
      setMultiplier(data.multiplier);
      setCountdown(data.countdown);
      setRoundId(data.roundId);
      if (data.history) setHistory(data.history);
      if (data.bets) setBets(data.bets);
      if (data.topPilots) setTopPilots(data.topPilots);
      if (data.luckyDraw) setLuckyDrawData((prev) => ({ ...prev, ...data.luckyDraw }));
      if (data.wallet) setUser(data.wallet);
    });

    socket.on('leaderboard_update', (data) => {
      if (data.topPilots) setTopPilots(data.topPilots);
    });

    socket.on('luckydraw_update', (data) => {
      setLuckyDrawData((prev) => ({ ...prev, ...data }));
    });

    socket.on('luckydraw_winner', (data) => {
      if (data.winner) {
        const isUser = data.winner.winnerUserId === userId;
        showToast(
          isUrdu
            ? `🎁 لکی ڈرا قرعہ اندازی! مبارک ہو ${data.winner.winnerName} نے ₨ ${data.winner.prizeAmount.toLocaleString()} جیت لیے!`
            : `🎁 Lucky Draw Winner! ${data.winner.winnerName} won ₨ ${data.winner.prizeAmount.toLocaleString()} Jackpot!`
        );
        if (isUser) {
          sound.playCashOut();
          setUser((prev) => ({ ...prev, balance: prev.balance + data.winner.prizeAmount }));
        }
      }
      if (data.jackpotPool) {
        setLuckyDrawData((prev) => ({
          ...prev,
          jackpotPool: data.jackpotPool,
          nextDrawTime: data.nextDrawTime,
          recentWinners: [data.winner, ...(prev.recentWinners || [])].slice(0, 10)
        }));
      }
    });

    socket.on('game_state', (data) => {
      setGameStatus(data.status);
      if (data.multiplier !== undefined) setMultiplier(data.multiplier);
      if (data.roundId) setRoundId(data.roundId);
      if (data.history) setHistory(data.history);
      if (data.bets) setBets(data.bets);

      if (data.status === 'WAITING') {
        sound.stopEngine();
        setCountdown(data.countdown || 5);
        // Clear panel bets from previous finished round
        setPanel1Bet(null);
        setPanel2Bet(null);
      } else if (data.status === 'STARTED') {
        sound.startEngine(1.0);
      } else if (data.status === 'CRASHED') {
        setFinalMultiplier(data.finalMultiplier || multiplier);
        sound.playCrash();
      }
    });

    socket.on('multiplier_update', (data) => {
      setMultiplier(data.multiplier);
      sound.updateEngine(data.multiplier);
    });

    socket.on('countdown_update', (data) => {
      setCountdown(data.countdown);
      sound.playTick();
    });

    socket.on('bets_update', (data) => {
      if (data.bets) setBets(data.bets);
    });

    socket.on('bet_confirmed', (data) => {
      setUser((prev) => ({ ...prev, balance: data.balance }));
      const bet = data.bet;
      if (bet) {
        const betState: PanelBetState = {
          betId: bet.id,
          betAmount: bet.betAmount,
          autoCashOut: bet.autoCashOut,
          cashedOut: false
        };
        if (bet.id.startsWith('panel-1-')) {
          setPanel1Bet(betState);
        } else if (bet.id.startsWith('panel-2-')) {
          setPanel2Bet(betState);
        } else {
          setPanel1Bet(betState);
        }
      }
    });

    socket.on('cash_out_confirmed', (data) => {
      setUser((prev) => ({ ...prev, balance: data.balance }));
      const updateBet = (prevBet: PanelBetState | null) => {
        if (prevBet && prevBet.betId === data.betId) {
          return {
            ...prevBet,
            cashedOut: true,
            cashedOutMultiplier: data.multiplier,
            payout: data.payout
          };
        }
        return prevBet;
      };
      setPanel1Bet(updateBet);
      setPanel2Bet(updateBet);
    });

    socket.on('bet_cancelled', (data) => {
      setUser((prev) => ({ ...prev, balance: data.balance }));
      if (panel1Bet?.betId === data.betId) setPanel1Bet(null);
      if (panel2Bet?.betId === data.betId) setPanel2Bet(null);
      showToast(isUrdu ? 'شرط منسوخ ہو گئی اور رقم واپس آ گئی' : 'Bet cancelled, amount refunded');
    });

    socket.on('new_chat', (data) => {
      setChatMessages((prev) => [...prev.slice(-40), data]);
    });

    socket.on('error_msg', (data) => {
      showToast(data.message);
    });

    return () => {
      socket.disconnect();
      sound.stopEngine();
    };
  }, [userId]);

  // Handlers for Bet Panels
  const handlePlaceBet = (panelId: string, amount: number, autoCashOut: number | null) => {
    if (!socketRef.current) return;
    const betId = `${panelId}-${userId}-${Date.now()}`;
    socketRef.current.emit('place_bet', {
      userId,
      betId,
      betAmount: amount,
      autoCashOut
    });
  };

  const handleCashOut = (panelId: string, betId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('cash_out', {
      userId,
      betId
    });
  };

  const handleCancelBet = (panelId: string, betId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('cancel_bet', {
      userId,
      betId
    });
  };

  const handleSendChat = (text: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_chat', {
      userId,
      userName: user.name,
      message: text
    });
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (!next) sound.stopEngine();
  };

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#090d14] text-gray-100 flex flex-col font-sans selection:bg-red-600 selection:text-white ${
        isUrdu ? 'font-urdu' : ''
      }`}
    >
      {/* Top Navigation */}
      <Navbar
        balance={user.balance}
        roundId={roundId}
        isUrdu={isUrdu}
        soundEnabled={soundEnabled}
        jackpotPool={luckyDrawData.jackpotPool}
        onToggleSound={handleToggleSound}
        onToggleLanguage={() => setIsUrdu(!isUrdu)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenLuckyDraw={() => setIsLuckyDrawOpen(true)}
      />

      {/* Horizontal Multiplier History Bar */}
      <HistoryBar history={history} isUrdu={isUrdu} />

      {/* Main Game Cockpit Area */}
      <main className="flex-1 p-2 sm:p-4 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column (8 cols): Flight Canvas & Dual Bet Panels */}
        <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
          {/* Live Flight Arena */}
          <div className="w-full flex-1 min-h-[300px] sm:min-h-[380px]">
            <FlightCanvas
              status={gameStatus}
              multiplier={multiplier}
              finalMultiplier={finalMultiplier}
              countdown={countdown}
              isUrdu={isUrdu}
            />
          </div>

          {/* Aviator Dual Betting Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <BetPanel
              panelId="panel-1"
              panelIndex={1}
              userId={userId}
              userBalance={user.balance}
              gameStatus={gameStatus}
              currentMultiplier={multiplier}
              isUrdu={isUrdu}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              onCancelBet={handleCancelBet}
              activeBetState={panel1Bet}
            />
            <BetPanel
              panelId="panel-2"
              panelIndex={2}
              userId={userId}
              userBalance={user.balance}
              gameStatus={gameStatus}
              currentMultiplier={multiplier}
              isUrdu={isUrdu}
              onPlaceBet={handlePlaceBet}
              onCashOut={handleCashOut}
              onCancelBet={handleCancelBet}
              activeBetState={panel2Bet}
            />
          </div>
        </div>

        {/* Right Column (4 cols): Live Feed (All Bets, My Bets, Top Wins, Live Chat) */}
        <div className="lg:col-span-4 h-full min-h-[420px] lg:min-h-0 flex flex-col">
          <LiveFeedSidebar
            bets={bets}
            currentUserId={userId}
            isUrdu={isUrdu}
            chatMessages={chatMessages}
            topPilots={topPilots}
            onSendMessage={handleSendChat}
          />
        </div>
      </main>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-600/80 text-white px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desi Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        userId={userId}
        balance={user.balance}
        history={user.history}
        isUrdu={isUrdu}
        onDepositSuccess={(newBalance, newHistory) => {
          setUser((prev) => ({ ...prev, balance: newBalance, history: newHistory }));
        }}
        onWithdrawSuccess={(newBalance, newHistory) => {
          setUser((prev) => ({ ...prev, balance: newBalance, history: newHistory }));
        }}
      />

      {/* How to Play Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        isUrdu={isUrdu}
      />

      {/* Lucky Draw 30-Min Jackpot Modal */}
      <LuckyDrawModal
        isOpen={isLuckyDrawOpen}
        onClose={() => setIsLuckyDrawOpen(false)}
        userId={userId}
        userBalance={user.balance}
        isUrdu={isUrdu}
        drawData={luckyDrawData}
        onTicketsBought={(newBalance, summary) => {
          setUser((prev) => ({ ...prev, balance: newBalance }));
          setLuckyDrawData(summary);
        }}
      />
    </div>
  );
}
