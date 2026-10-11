import React, { useEffect, useRef } from 'react';

interface FlightCanvasProps {
  status: 'WAITING' | 'STARTED' | 'CRASHED';
  multiplier: number;
  finalMultiplier?: number;
  countdown: number;
  isUrdu: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const FlightCanvas: React.FC<FlightCanvasProps> = ({
  status,
  multiplier,
  finalMultiplier,
  countdown,
  isUrdu
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const propAngleRef = useRef<number>(0);
  const planePosRef = useRef<{ x: number; y: number; angle: number }>({ x: 60, y: 300, angle: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background grid & radar rings
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;

      // Draw faint grid lines
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw radar curves in background
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.beginPath();
      ctx.arc(0, height, width * 0.4, 0, Math.PI * 0.5, true);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, height, width * 0.7, 0, Math.PI * 0.5, true);
      ctx.stroke();
      ctx.restore();

      const originX = 40;
      const originY = height - 40;

      // Calculate plane position based on status and multiplier
      let targetX = originX;
      let targetY = originY;
      let targetAngle = -12; // degrees

      if (status === 'WAITING') {
        targetX = originX + 25;
        targetY = originY - 10;
        targetAngle = 0;
      } else if (status === 'STARTED') {
        // Curve progress (1.0 to 10.0+ maps smoothly to width and height)
        // Multiplier 1.0 -> 0% of flight, 5.0 -> 75% of flight, 10.0+ -> top-right
        const progress = Math.min(1, Math.log10(multiplier) / 1.1 + (multiplier - 1) * 0.08);
        const maxX = width - 110;
        const minY = 65;

        // Controlled smooth trajectory
        targetX = originX + (maxX - originX) * Math.min(1, progress * 0.95 + 0.1);
        targetY = originY - (originY - minY) * Math.min(0.92, Math.pow(progress, 0.75) * 0.95 + 0.05);

        // Angle tilts upward slightly then levels out around 25-30 deg
        targetAngle = -18 - Math.min(22, (multiplier - 1) * 6);
      } else if (status === 'CRASHED') {
        // Plane zoom away off-screen
        targetX = width + 150;
        targetY = -80;
        targetAngle = -45;
      }

      // Smooth interpolation for plane position
      const pos = planePosRef.current;
      pos.x += (targetX - pos.x) * (status === 'CRASHED' ? 0.08 : 0.15);
      pos.y += (targetY - pos.y) * (status === 'CRASHED' ? 0.08 : 0.15);
      pos.angle += (targetAngle - pos.angle) * 0.15;

      propAngleRef.current += status === 'WAITING' ? 0.15 : 0.45;

      // If flying or started, draw trajectory curve & area fill
      if (status === 'STARTED' || (status === 'CRASHED' && pos.x < width)) {
        // Gradient fill under curve
        const grad = ctx.createLinearGradient(0, pos.y, 0, height);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
        grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.08)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        // Quadratic curve to current plane position
        const cpX = originX + (pos.x - originX) * 0.65;
        const cpY = originY;
        ctx.quadraticCurveTo(cpX, cpY, pos.x, pos.y);
        ctx.lineTo(pos.x, originY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(cpX, cpY, pos.x, pos.y);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();

        // Spawn engine trail particles
        if (status === 'STARTED' && Math.random() < 0.8) {
          const rad = (pos.angle * Math.PI) / 180;
          const tailX = pos.x - Math.cos(rad) * 35;
          const tailY = pos.y - Math.sin(rad) * 35;

          particlesRef.current.push({
            x: tailX,
            y: tailY,
            vx: -Math.cos(rad) * (2 + Math.random() * 2) + (Math.random() - 0.5),
            vy: -Math.sin(rad) * 2 + (Math.random() - 0.5),
            life: 1,
            maxLife: 20 + Math.random() * 15,
            color: Math.random() > 0.4 ? 'rgba(239, 68, 68,' : 'rgba(249, 115, 22,',
            size: 2.5 + Math.random() * 3
          });
        }
      }

      // Update and draw particles
      ctx.save();
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.fillStyle = `${p.color} ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        return p.life < p.maxLife;
      });
      ctx.restore();

      // Draw the Airplane (unless crashed and flew away out of canvas)
      if (pos.x < width + 100 && pos.y > -100) {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate((pos.angle * Math.PI) / 180);

        // Draw sleek red Aviator plane
        drawAviatorJet(ctx, propAngleRef.current, status === 'STARTED');
        ctx.restore();
      }

      // Draw Axes labels (bottom time, left multiplier hints)
      ctx.save();
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.fillText('0.0s', originX, height - 15);
      ctx.fillText('2.0s', originX + (width - 100) * 0.3, height - 15);
      ctx.fillText('5.0s', originX + (width - 100) * 0.6, height - 15);
      ctx.fillText('10.0s', originX + (width - 100) * 0.9, height - 15);
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [status, multiplier]);

  // Helper to draw red Aviator airplane
  const drawAviatorJet = (ctx: CanvasRenderingContext2D, propAngle: number, flying: boolean) => {
    ctx.save();

    // Afterburner glow if flying
    if (flying) {
      ctx.save();
      const thruster = ctx.createRadialGradient(-32, 0, 1, -38, 0, 16);
      thruster.addColorStop(0, 'rgba(255, 230, 150, 0.9)');
      thruster.addColorStop(0.4, 'rgba(249, 115, 22, 0.7)');
      thruster.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = thruster;
      ctx.beginPath();
      ctx.ellipse(-34, 0, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Main fuselage (Red aerodynamic body)
    ctx.fillStyle = '#dc2626'; // Red 600
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    // Nose tip at (+38, 0)
    ctx.moveTo(38, 0);
    // Upper curve to cockpit and tail
    ctx.quadraticCurveTo(15, -7, -25, -5);
    // Tail fin up
    ctx.lineTo(-32, -18);
    ctx.lineTo(-26, -18);
    ctx.lineTo(-20, -5);
    ctx.lineTo(-30, 0);
    // Lower body curve
    ctx.lineTo(-20, 5);
    ctx.lineTo(-26, 12);
    ctx.lineTo(-30, 12);
    ctx.lineTo(-25, 5);
    ctx.quadraticCurveTo(15, 7, 38, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit windshield (Cyan glass glow)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(24, -2);
    ctx.lineTo(16, 2);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fill();

    // Main wing (swept back)
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(5, -2);
    ctx.lineTo(-12, -22);
    ctx.lineTo(-17, -22);
    ctx.lineTo(-6, -2);
    ctx.closePath();
    ctx.fill();

    // Front propeller spinner & blur
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(38, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Spinning propeller blades
    ctx.save();
    ctx.translate(40, 0);
    ctx.rotate(propAngle);
    ctx.fillStyle = flying ? 'rgba(255, 255, 255, 0.45)' : '#ffffff';
    ctx.fillRect(-1.5, -16, 3, 32);
    ctx.restore();

    ctx.restore();
  };

  return (
    <div className="relative w-full h-full min-h-[320px] max-h-[460px] bg-[#0c1017] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl flex items-center justify-center select-none">
      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Center Dynamic Status Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
        {status === 'WAITING' && (
          <div className="flex flex-col items-center bg-gray-950/80 backdrop-blur-md px-6 py-5 rounded-2xl border border-gray-700/60 shadow-2xl text-center max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="w-10 h-10 mb-2 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <span className={`text-gray-300 font-semibold text-xs tracking-wider uppercase mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'اگلا راؤنڈ شروع ہو رہا ہے' : 'WAITING FOR NEXT ROUND'}
            </span>
            <div className="text-3xl font-bold font-digit text-red-500 flex items-center gap-2">
              <span>{countdown}</span>
              <span className="text-lg text-gray-400 font-normal">{isUrdu ? 'سیکنڈ' : 's'}</span>
            </div>
            {/* Progress bar */}
            <div className="w-48 h-2 bg-gray-800 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'STARTED' && (
          <div className="flex flex-col items-center justify-center">
            <div className="font-digit font-extrabold text-5xl md:text-7xl tracking-tight text-white drop-shadow-[0_0_30px_rgba(239,68,68,0.7)] transition-all">
              {multiplier.toFixed(2)}x
            </div>
            <div className="mt-2 text-xs md:text-sm font-semibold text-red-400 bg-red-950/40 border border-red-800/50 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
              {isUrdu ? 'طیارہ پرواز کر رہا ہے...' : 'JET CLIMBING...'}
            </div>
          </div>
        )}

        {status === 'CRASHED' && (
          <div className="flex flex-col items-center bg-red-950/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-red-600/70 shadow-[0_0_50px_rgba(220,38,38,0.5)] text-center animate-in zoom-in-90 duration-150">
            <span className={`text-red-400 text-xs font-bold tracking-widest uppercase mb-1 ${isUrdu ? 'font-urdu' : ''}`}>
              {isUrdu ? 'طیارہ اڑ گیا!' : 'FLEW AWAY!'}
            </span>
            <div className="font-digit text-4xl md:text-6xl font-black text-red-500">
              {(finalMultiplier || multiplier).toFixed(2)}x
            </div>
          </div>
        )}
      </div>

      {/* Top Left Live Flight Status Indicator */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-gray-800 px-3 py-1.5 rounded-full text-xs text-gray-300">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            status === 'STARTED'
              ? 'bg-green-500 animate-pulse'
              : status === 'WAITING'
              ? 'bg-amber-400'
              : 'bg-red-500'
          }`}
        />
        <span className="font-medium tracking-wide">
          {status === 'STARTED' ? (isUrdu ? 'پرواز جاری' : 'AIRBORNE') : status === 'WAITING' ? (isUrdu ? 'تیاری' : 'COUNTDOWN') : (isUrdu ? 'کریش' : 'CRASHED')}
        </span>
      </div>

      {/* Watermark / Logo in bottom right */}
      <div className="absolute bottom-3 right-4 z-10 pointer-events-none opacity-20 text-right">
        <div className="font-black text-xs tracking-widest text-white">AVIATOR DESI</div>
      </div>
    </div>
  );
};
