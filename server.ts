import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User {
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

// عارضی یوزر ڈیٹا بیس (دیسی والٹ)
const users: Record<string, User> = {
  'user123': {
    id: 'user123',
    name: 'Desi Pilot (احمد خان)',
    balance: 5000.0,
    currency: 'PKR',
    history: [
      { id: 'tx-1', type: 'deposit', amount: 5000, timestamp: Date.now() - 3600000, note: 'JazzCash ابتدائی رقم' }
    ]
  }
};

export interface PilotRecord {
  id: string;
  name: string;
  city: string;
  totalWinnings: number;
  highestMultiplier: number;
  winsCount: number;
}

// ---------------------------
// LUCKY DRAW (30-MIN JACKPOT)
// ---------------------------
interface LuckyDrawTicket {
  ticketId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

interface LuckyDrawWinner {
  drawId: string;
  winnerName: string;
  winnerUserId: string;
  prizeAmount: number;
  winningTicketId: string;
  timestamp: number;
}

let luckyDrawCount = 88;
let jackpotPool = 185450;
const TICKET_PRICE = 50;
const DRAW_INTERVAL_MS = 30 * 60 * 1000; // 30 mins
let nextDrawTime = Date.now() + 24 * 60 * 1000 + 40 * 1000; // ~24m 40s remaining

function generateInitialLuckyDrawTickets(): LuckyDrawTicket[] {
  const sampleBots = ['Babar_PK', 'Malik_Rwp', 'KarachiKing', 'Fatima_99', 'Ali_Gujrat', 'Zain_Lahore'];
  const tickets: LuckyDrawTicket[] = [];
  sampleBots.forEach((name, idx) => {
    const count = Math.floor(Math.random() * 3) + 1;
    for (let c = 0; c < count; c++) {
      tickets.push({
        ticketId: `TCK-${1000 + idx * 10 + c}`,
        userId: `bot-${idx}`,
        userName: name,
        timestamp: Date.now() - Math.floor(Math.random() * 600000)
      });
    }
  });
  return tickets;
}

let luckyDrawTickets: LuckyDrawTicket[] = generateInitialLuckyDrawTickets();

let recentLuckyDrawWinners: LuckyDrawWinner[] = [
  {
    drawId: 'LD-87',
    winnerName: 'Babar_PK',
    winnerUserId: 'bot-0',
    prizeAmount: 165000,
    winningTicketId: 'TCK-8721',
    timestamp: Date.now() - 32 * 60 * 1000
  },
  {
    drawId: 'LD-86',
    winnerName: 'Malik_Rwp',
    winnerUserId: 'bot-1',
    prizeAmount: 210000,
    winningTicketId: 'TCK-8614',
    timestamp: Date.now() - 62 * 60 * 1000
  },
  {
    drawId: 'LD-85',
    winnerName: 'Desi Pilot (احمد خان)',
    winnerUserId: 'user123',
    prizeAmount: 145000,
    winningTicketId: 'TCK-8509',
    timestamp: Date.now() - 95 * 60 * 1000
  }
];

function getLuckyDrawSummary(userId?: string) {
  const userTickets = userId ? luckyDrawTickets.filter(t => t.userId === userId) : [];
  const totalTickets = luckyDrawTickets.length;
  const userWinChance = totalTickets > 0 && userTickets.length > 0 
    ? parseFloat(((userTickets.length / totalTickets) * 100).toFixed(1)) 
    : 0;

  return {
    drawId: `LD-${luckyDrawCount}`,
    jackpotPool,
    ticketPrice: TICKET_PRICE,
    nextDrawTime,
    totalTickets,
    userTicketsCount: userTickets.length,
    userWinChance,
    userTickets,
    recentWinners: recentLuckyDrawWinners
  };
}

const pilots: Record<string, PilotRecord> = {
  'pilot-malik': { id: 'pilot-malik', name: 'Malik_Rwp', city: 'راولپنڈی', totalWinnings: 345600, highestMultiplier: 38.5, winsCount: 142 },
  'pilot-karachi': { id: 'pilot-karachi', name: 'KarachiKing', city: 'کراچی', totalWinnings: 289400, highestMultiplier: 42.1, winsCount: 118 },
  'pilot-babar': { id: 'pilot-babar', name: 'Babar_PK', city: 'لاہور', totalWinnings: 245150, highestMultiplier: 24.8, winsCount: 96 },
  'user123': { id: 'user123', name: 'Desi Pilot (احمد خان)', city: 'لاہور', totalWinnings: 185000, highestMultiplier: 15.6, winsCount: 42 },
  'pilot-fatima': { id: 'pilot-fatima', name: 'Fatima_99', city: 'اسلام آباد', totalWinnings: 156800, highestMultiplier: 19.2, winsCount: 74 },
  'pilot-zain': { id: 'pilot-zain', name: 'Zain_Lahore', city: 'لاہور', totalWinnings: 142300, highestMultiplier: 14.5, winsCount: 62 },
  'pilot-sikandar': { id: 'pilot-sikandar', name: 'Sikandar_777', city: 'ملتان', totalWinnings: 128900, highestMultiplier: 31.0, winsCount: 53 },
  'pilot-ali': { id: 'pilot-ali', name: 'Ali_Gujrat', city: 'گجرات', totalWinnings: 115400, highestMultiplier: 12.8, winsCount: 49 },
  'pilot-hamza': { id: 'pilot-hamza', name: 'Hamza_Vip', city: 'فیصل آباد', totalWinnings: 98750, highestMultiplier: 16.4, winsCount: 38 },
  'pilot-noor': { id: 'pilot-noor', name: 'Noor_Peshawar', city: 'پشاور', totalWinnings: 89200, highestMultiplier: 22.0, winsCount: 31 },
  'pilot-bilal': { id: 'pilot-bilal', name: 'Bilal_Eagle', city: 'سیالکوٹ', totalWinnings: 76500, highestMultiplier: 11.2, winsCount: 29 },
  'pilot-shahbaz': { id: 'pilot-shahbaz', name: 'Shahbaz_007', city: 'کوئٹہ', totalWinnings: 64100, highestMultiplier: 9.8, winsCount: 24 }
};

function getTopPilots() {
  return Object.values(pilots)
    .sort((a, b) => b.totalWinnings - a.totalWinnings)
    .slice(0, 10)
    .map((p, idx) => ({
      ...p,
      rank: idx + 1
    }));
}

function recordWin(userId: string, userName: string, payout: number, mult: number) {
  let record = pilots[userId];
  if (!record) {
    record = {
      id: userId,
      name: userName,
      city: 'پاکستان',
      totalWinnings: 0,
      highestMultiplier: mult,
      winsCount: 0
    };
    pilots[userId] = record;
  }
  record.totalWinnings = parseFloat((record.totalWinnings + payout).toFixed(2));
  record.highestMultiplier = Math.max(record.highestMultiplier, mult);
  record.winsCount += 1;
}

const BOT_NAMES = [
  'Babar_PK', 'Zain_Lahore', 'Malik_Rwp', 'KarachiKing', 'Ali_Gujrat',
  'Fatima_99', 'Hamza_Vip', 'Shahbaz_007', 'Usman_Fsd', 'Raza_Multan',
  'Bilal_Eagle', 'Tariq_Jet', 'Sikandar_777', 'Noor_Peshawar', 'Rana_Sahab'
];

let roundCount = 1042;
let roundId = `RD-${roundCount}`;
let multiplier = 1.0;
let isGameRunning = false;
let gameStatus: 'WAITING' | 'STARTED' | 'CRASHED' = 'WAITING';
let crashPoint = 2.45;
let countdownTimer = 5;
let roundHistory: number[] = [1.45, 2.84, 1.12, 5.67, 1.88, 12.4, 1.05, 3.14, 2.05, 8.92, 1.33, 4.21];
let currentBets: ActiveBet[] = [];
let gameInterval: NodeJS.Timeout | null = null;
let countdownInterval: NodeJS.Timeout | null = null;

function generateBots(): ActiveBet[] {
  const count = Math.floor(Math.random() * 8) + 6;
  const bots: ActiveBet[] = [];
  const shuffledNames = [...BOT_NAMES].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < count; i++) {
    const amounts = [50, 100, 200, 300, 500, 1000, 1500, 2500, 5000];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const willAutoCashout = Math.random() > 0.35;
    const autoMultiplier = willAutoCashout ? parseFloat((1.2 + Math.random() * 4.5).toFixed(2)) : undefined;

    bots.push({
      id: `bot-${i}-${Date.now()}`,
      userId: `bot-${i}`,
      userName: shuffledNames[i] || `Player_${i + 1}`,
      betAmount: amount,
      autoCashOut: autoMultiplier,
      cashedOut: false,
      isBot: true
    });
  }
  return bots;
}

function calculateCrashPoint(): number {
  // Realistic Aviator multiplier curve
  const r = Math.random();
  if (r < 0.05) {
    // 5% instant crash
    return parseFloat((1.01 + Math.random() * 0.08).toFixed(2));
  } else if (r < 0.55) {
    // 50% crash between 1.10 and 2.20
    return parseFloat((1.1 + Math.random() * 1.1).toFixed(2));
  } else if (r < 0.85) {
    // 30% crash between 2.20 and 5.50
    return parseFloat((2.2 + Math.random() * 3.3).toFixed(2));
  } else if (r < 0.96) {
    // 11% high flight between 5.50 and 20.00
    return parseFloat((5.5 + Math.random() * 14.5).toFixed(2));
  } else {
    // 4% moonshot 20x to 100x+
    return parseFloat((20.0 + Math.random() * 80.0).toFixed(2));
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' }
  });

  // 1. والٹ API - یوزر کی معلومات اور بیلنس
  app.get('/api/wallet/:userId', (req, res) => {
    const userId = req.params.userId;
    let user = users[userId];
    if (!user) {
      // Auto create new guest or desi user
      user = {
        id: userId,
        name: `دیسی پلئیر (${userId.slice(-4)})`,
        balance: 2000.0,
        currency: 'PKR',
        history: [
          { id: `tx-${Date.now()}`, type: 'deposit', amount: 2000, timestamp: Date.now(), note: 'ویلکم بونس (Welcome Bonus)' }
        ]
      };
      users[userId] = user;
    }
    res.json({ success: true, user });
  });

  // 2. والٹ API - ڈپازٹ / رقم شامل کریں
  app.post('/api/wallet/deposit', (req, res) => {
    const { userId, amount, method, senderNumber } = req.body;
    const parsedAmount = parseFloat(amount);
    
    if (!userId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'غلط رقم درج کی گئی ہے (Invalid deposit amount)' });
    }

    if (!users[userId]) {
      users[userId] = {
        id: userId,
        name: `دیسی پلئیر (${userId.slice(-4)})`,
        balance: 0,
        currency: 'PKR',
        history: []
      };
    }

    const user = users[userId];
    user.balance = parseFloat((user.balance + parsedAmount).toFixed(2));
    user.history.unshift({
      id: `dep-${Date.now()}`,
      type: 'deposit',
      amount: parsedAmount,
      timestamp: Date.now(),
      note: `${method || 'JazzCash / EasyPaisa'} ڈپازٹ (${senderNumber || 'Direct'})`
    });

    res.json({ 
      success: true, 
      newBalance: user.balance, 
      message: `₨ ${parsedAmount.toLocaleString()} کامیابی سے جمع ہو گئے!`,
      user 
    });
  });

  // 3. والٹ API - رقم نکلوانا / Withdraw
  app.post('/api/wallet/withdraw', (req, res) => {
    const { userId, amount, method, accountTitle, accountNumber } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!userId || !users[userId]) {
      return res.status(404).json({ success: false, message: 'یوزر نہیں ملا' });
    }

    const user = users[userId];
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'درست رقم درج کریں' });
    }

    if (user.balance < parsedAmount) {
      return res.status(400).json({ success: false, message: 'والٹ میں رقم کم ہے (Insufficient Balance)' });
    }

    user.balance = parseFloat((user.balance - parsedAmount).toFixed(2));
    user.history.unshift({
      id: `wdr-${Date.now()}`,
      type: 'withdraw',
      amount: parsedAmount,
      timestamp: Date.now(),
      note: `${method || 'EasyPaisa'} رقم منتقلی: ${accountTitle} (${accountNumber})`
    });

    res.json({
      success: true,
      newBalance: user.balance,
      message: `₨ ${parsedAmount.toLocaleString()} کی واپسی منظور ہو گئی!`,
      user
    });
  });

  // 4. ٹاپ پائلٹس لیڈر بورڈ API (Top 10 Pilots by Total Winnings)
  app.get('/api/leaderboard', (req, res) => {
    res.json({
      success: true,
      topPilots: getTopPilots()
    });
  });

  // 5. لکی ڈرا (Lucky Draw 30-Minute Jackpot Pool) API
  function executeLuckyDraw() {
    if (luckyDrawTickets.length === 0) {
      luckyDrawTickets = generateInitialLuckyDrawTickets();
    }

    const winningIndex = Math.floor(Math.random() * luckyDrawTickets.length);
    const winningTicket = luckyDrawTickets[winningIndex];
    const prizeAmount = jackpotPool;

    const winnerRecord: LuckyDrawWinner = {
      drawId: `LD-${luckyDrawCount}`,
      winnerName: winningTicket.userName,
      winnerUserId: winningTicket.userId,
      prizeAmount,
      winningTicketId: winningTicket.ticketId,
      timestamp: Date.now()
    };

    recentLuckyDrawWinners.unshift(winnerRecord);
    if (recentLuckyDrawWinners.length > 10) recentLuckyDrawWinners.pop();

    // If winner is registered user, credit their balance!
    if (users[winningTicket.userId]) {
      const user = users[winningTicket.userId];
      user.balance = parseFloat((user.balance + prizeAmount).toFixed(2));
      user.history.unshift({
        id: `jackpot-${Date.now()}`,
        type: 'win',
        amount: prizeAmount,
        timestamp: Date.now(),
        note: `🎁 لکی ڈرا جیک پاٹ جیت (${winnerRecord.drawId})!`
      });
    }

    // Record win to leaderboard
    recordWin(winningTicket.userId, winningTicket.userName, prizeAmount, 50.0);

    // Advance to next 30-min draw
    luckyDrawCount += 1;
    jackpotPool = 150000 + Math.floor(Math.random() * 25000);
    nextDrawTime = Date.now() + DRAW_INTERVAL_MS;
    luckyDrawTickets = generateInitialLuckyDrawTickets();

    // Broadcast winner and updated pool
    io.emit('luckydraw_winner', {
      winner: winnerRecord,
      nextDrawTime,
      jackpotPool,
      topPilots: getTopPilots()
    });
    io.emit('luckydraw_update', getLuckyDrawSummary());
    io.emit('leaderboard_update', { topPilots: getTopPilots() });
  }

  // Get current Lucky Draw status
  app.get('/api/luckydraw', (req, res) => {
    const userId = req.query.userId as string;
    res.json({
      success: true,
      ...getLuckyDrawSummary(userId)
    });
  });

  // Buy tickets from balance
  app.post('/api/luckydraw/buy', (req, res) => {
    const { userId, quantity } = req.body;
    const qty = Math.max(1, Math.min(50, parseInt(quantity) || 1));
    const totalCost = qty * TICKET_PRICE;

    if (!userId || !users[userId]) {
      return res.status(404).json({ success: false, message: 'یوزر نہیں ملا' });
    }

    const user = users[userId];
    if (user.balance < totalCost) {
      return res.status(400).json({
        success: false,
        message: 'والٹ میں رقم کم ہے! برائے مہربانی پہلے رقم جمع (Deposit) کریں۔'
      });
    }

    // Deduct ticket cost from user wallet
    user.balance = parseFloat((user.balance - totalCost).toFixed(2));
    user.history.unshift({
      id: `ticket-${Date.now()}`,
      type: 'bet',
      amount: totalCost,
      timestamp: Date.now(),
      note: `لکی ڈرا ٹکٹ خریداری (${qty} ٹکٹس)`
    });

    // 85% of ticket purchases go into the jackpot pool!
    jackpotPool = parseFloat((jackpotPool + totalCost * 0.85).toFixed(2));

    // Generate tickets
    for (let i = 0; i < qty; i++) {
      luckyDrawTickets.push({
        ticketId: `TCK-${Math.floor(100000 + Math.random() * 900000)}`,
        userId,
        userName: user.name,
        timestamp: Date.now()
      });
    }

    const summary = getLuckyDrawSummary(userId);
    io.emit('luckydraw_update', summary);

    res.json({
      success: true,
      message: `${qty} لکی ڈرا ٹکٹ کامیابی سے خرید لیے گئے! گڈ لک 🎁`,
      newBalance: user.balance,
      user,
      ...summary
    });
  });

  // Trigger draw now (for testing / manual preview)
  app.post('/api/luckydraw/draw-now', (req, res) => {
    executeLuckyDraw();
    res.json({
      success: true,
      message: 'لکی ڈرا مکمل ہو گیا!',
      ...getLuckyDrawSummary()
    });
  });

  // Check 30-min timer periodically
  setInterval(() => {
    if (Date.now() >= nextDrawTime) {
      executeLuckyDraw();
    }
  }, 5000);

  // Game Loop Logic
  function startCountdown() {
    gameStatus = 'WAITING';
    isGameRunning = false;
    multiplier = 1.0;
    countdownTimer = 5;
    roundCount++;
    roundId = `RD-${roundCount}`;
    
    // Clear previous round bets, populate next round bots
    currentBets = generateBots();

    io.emit('game_state', {
      status: 'WAITING',
      countdown: countdownTimer,
      multiplier: 1.0,
      roundId,
      history: roundHistory,
      bets: currentBets
    });

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      countdownTimer -= 1;
      if (countdownTimer <= 0) {
        clearInterval(countdownInterval!);
        countdownInterval = null;
        startFlying();
      } else {
        io.emit('countdown_update', { countdown: countdownTimer });
      }
    }, 1000);
  }

  function startFlying() {
    gameStatus = 'STARTED';
    isGameRunning = true;
    multiplier = 1.0;
    crashPoint = calculateCrashPoint();

    io.emit('game_state', {
      status: 'STARTED',
      multiplier: 1.0,
      roundId,
      bets: currentBets
    });

    let startTime = Date.now();
    const tickRate = 75; // ms per tick

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      // Exponential curve: multiplier grows faster over time
      const nextMultiplier = parseFloat((1.0 + Math.pow(elapsedSec * 0.95, 1.35)).toFixed(2));
      multiplier = nextMultiplier;

      // Handle Bot auto cashouts or random cashouts
      let betsUpdated = false;
      currentBets.forEach(bet => {
        if (!bet.cashedOut) {
          // Check explicit auto cash out
          if (bet.autoCashOut && multiplier >= bet.autoCashOut) {
            bet.cashedOut = true;
            bet.cashedOutMultiplier = bet.autoCashOut;
            bet.payout = parseFloat((bet.betAmount * bet.autoCashOut).toFixed(2));
            betsUpdated = true;
            if (!bet.isBot && users[bet.userId]) {
              users[bet.userId].balance = parseFloat((users[bet.userId].balance + bet.payout).toFixed(2));
              users[bet.userId].history.unshift({
                id: `win-${Date.now()}`,
                type: 'win',
                amount: bet.payout,
                multiplier: bet.autoCashOut,
                timestamp: Date.now(),
                note: `آٹو کیش آؤٹ ${bet.autoCashOut}x جیت!`
              });
              recordWin(bet.userId, users[bet.userId].name, bet.payout, bet.autoCashOut);
              io.to(bet.userId).emit('cash_out_confirmed', {
                betId: bet.id,
                payout: bet.payout,
                multiplier: bet.autoCashOut,
                balance: users[bet.userId].balance
              });
            } else if (bet.isBot) {
              recordWin(bet.userId, bet.userName, bet.payout, bet.autoCashOut || multiplier);
            }
          } else if (bet.isBot && !bet.autoCashOut && multiplier > 1.3) {
            // Chance to cash out dynamically
            if (Math.random() < 0.08) {
              bet.cashedOut = true;
              bet.cashedOutMultiplier = multiplier;
              bet.payout = parseFloat((bet.betAmount * multiplier).toFixed(2));
              betsUpdated = true;
              recordWin(bet.userId, bet.userName, bet.payout, multiplier);
            }
          }
        }
      });

      if (betsUpdated) {
        io.emit('bets_update', { bets: currentBets });
        io.emit('leaderboard_update', { topPilots: getTopPilots() });
      }

      if (multiplier >= crashPoint) {
        // Plane crashes / flies away!
        clearInterval(gameInterval!);
        gameInterval = null;
        isGameRunning = false;
        gameStatus = 'CRASHED';

        // Add to history
        roundHistory.unshift(crashPoint);
        if (roundHistory.length > 25) roundHistory.pop();

        io.emit('game_state', {
          status: 'CRASHED',
          finalMultiplier: crashPoint,
          roundId,
          history: roundHistory,
          bets: currentBets
        });

        // 4 seconds cooldown before next round starts
        setTimeout(startCountdown, 4000);
      } else {
        io.emit('multiplier_update', { multiplier });
      }
    }, tickRate);
  }

  // Socket Connection Handling
  io.on('connection', (socket) => {
    // Send initial snapshot
    socket.emit('game_init', {
      status: gameStatus,
      multiplier,
      countdown: countdownTimer,
      roundId,
      history: roundHistory,
      bets: currentBets,
      topPilots: getTopPilots(),
      luckyDraw: getLuckyDrawSummary(),
      wallet: users['user123']
    });

    // User joins room with their userId so we can target them
    socket.on('join_user_room', ({ userId }) => {
      socket.join(userId);
      let user = users[userId];
      if (!user) {
        user = {
          id: userId,
          name: `دیسی پلئیر (${userId.slice(-4)})`,
          balance: 5000.0,
          currency: 'PKR',
          history: [
            { id: `tx-${Date.now()}`, type: 'deposit', amount: 5000, timestamp: Date.now(), note: 'ویلکم بونس (Welcome Bonus)' }
          ]
        };
        users[userId] = user;
      }
      socket.emit('wallet_sync', { user });
    });

    // Explicit wallet request over socket
    socket.on('get_wallet', ({ userId }) => {
      if (users[userId]) {
        socket.emit('wallet_sync', { user: users[userId] });
      }
    });

    // User places a bet
    socket.on('place_bet', ({ userId, betId, betAmount, autoCashOut }) => {
      const parsedAmount = parseFloat(betAmount);
      if (!users[userId]) {
        return socket.emit('error_msg', { message: 'یوزر موجود نہیں ہے!' });
      }
      
      const user = users[userId];
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return socket.emit('error_msg', { message: 'درست رقم درج کریں!' });
      }

      if (user.balance < parsedAmount) {
        return socket.emit('error_msg', { message: 'بیلنس کم ہے! برائے مہربانی پہلے رقم جمع (Deposit) کریں۔' });
      }

      // In real Aviator, bet can be placed in WAITING phase or scheduled
      if (gameStatus !== 'WAITING') {
        return socket.emit('error_msg', { message: 'اگلے راؤنڈ کے لیے انتظار کریں (Wait for next countdown)' });
      }

      // Check if this betId already exists
      const existing = currentBets.find(b => b.id === betId);
      if (existing) {
        return socket.emit('error_msg', { message: 'یہ شرط پہلے سے لگ چکی ہے!' });
      }

      // Deduct balance
      user.balance = parseFloat((user.balance - parsedAmount).toFixed(2));
      user.history.unshift({
        id: `bet-${Date.now()}`,
        type: 'bet',
        amount: parsedAmount,
        timestamp: Date.now(),
        note: `راؤنڈ ${roundId} شرط`
      });

      const newBet: ActiveBet = {
        id: betId || `bet-${userId}-${Date.now()}`,
        userId,
        userName: user.name,
        betAmount: parsedAmount,
        autoCashOut: autoCashOut ? parseFloat(autoCashOut) : null,
        cashedOut: false,
        isBot: false
      };

      currentBets.push(newBet);

      // Confirm to sender
      socket.emit('bet_confirmed', {
        betId: newBet.id,
        balance: user.balance,
        bet: newBet
      });

      // Broadcast updated bet table to everyone
      io.emit('bets_update', { bets: currentBets });
    });

    // User manually cashes out
    socket.on('cash_out', ({ userId, betId }) => {
      if (gameStatus !== 'STARTED' || !isGameRunning) {
        return socket.emit('error_msg', { message: 'گیم ابھی جاری نہیں ہے!' });
      }

      const bet = currentBets.find(b => b.id === betId && b.userId === userId);
      if (!bet) {
        return socket.emit('error_msg', { message: 'شرط نہیں ملی!' });
      }

      if (bet.cashedOut) {
        return socket.emit('error_msg', { message: 'پہلے ہی کیش آؤٹ ہو چکا ہے!' });
      }

      const cashMultiplier = multiplier;
      const payout = parseFloat((bet.betAmount * cashMultiplier).toFixed(2));

      bet.cashedOut = true;
      bet.cashedOutMultiplier = cashMultiplier;
      bet.payout = payout;

      if (users[userId]) {
        users[userId].balance = parseFloat((users[userId].balance + payout).toFixed(2));
        users[userId].history.unshift({
          id: `win-${Date.now()}`,
          type: 'win',
          amount: payout,
          multiplier: cashMultiplier,
          timestamp: Date.now(),
          note: `کیش آؤٹ ${cashMultiplier}x جیت!`
        });

        socket.emit('cash_out_confirmed', {
          betId: bet.id,
          payout,
          multiplier: cashMultiplier,
          balance: users[userId].balance
        });

        recordWin(userId, users[userId].name, payout, cashMultiplier);
        io.emit('leaderboard_update', { topPilots: getTopPilots() });
      }

      io.emit('bets_update', { bets: currentBets });
    });

    // Cancel bet during WAITING
    socket.on('cancel_bet', ({ userId, betId }) => {
      if (gameStatus !== 'WAITING') {
        return socket.emit('error_msg', { message: 'راؤنڈ شروع ہو چکا ہے، اب منسوخ نہیں ہو سکتا!' });
      }

      const betIndex = currentBets.findIndex(b => b.id === betId && b.userId === userId);
      if (betIndex === -1) {
        return socket.emit('error_msg', { message: 'شرط نہیں ملی!' });
      }

      const [removedBet] = currentBets.splice(betIndex, 1);
      if (users[userId] && removedBet) {
        users[userId].balance = parseFloat((users[userId].balance + removedBet.betAmount).toFixed(2));
        socket.emit('bet_cancelled', {
          betId,
          refundedAmount: removedBet.betAmount,
          balance: users[userId].balance
        });
      }

      io.emit('bets_update', { bets: currentBets });
    });

    // Live Chat message
    socket.on('send_chat', ({ userId, userName, message }) => {
      if (!message || !message.trim()) return;
      const chatItem = {
        id: `chat-${Date.now()}`,
        userId,
        userName: userName || 'پلئیر',
        text: message.trim().slice(0, 150),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.emit('new_chat', chatItem);
    });
  });

  // Start the perpetual Aviator engine
  startCountdown();

  // Connect Vite middleware in dev or static files in production
  const PORT = Number(process.env.PORT) || 3000;
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Desi Aviator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
