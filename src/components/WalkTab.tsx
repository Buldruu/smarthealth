import React from 'react';
import { Footprints, Pause, Play, Info } from 'lucide-react';
import { MAX_DAILY_WALK_COINS, STEPS_PER_COIN } from '../constants/smartHealthData';

interface WalkTabProps {
  steps: number;
  isWalking: boolean;
  isSignedIn: boolean;
  onToggleWalk: () => void;
  onAddSteps: (delta: number) => void;
  onGoSignIn: () => void;
}

export const WalkTab: React.FC<WalkTabProps> = ({
  steps,
  isWalking,
  isSignedIn,
  onToggleWalk,
  onAddSteps,
  onGoSignIn,
}) => {
  const earnedWalkCoins = Math.min(
    MAX_DAILY_WALK_COINS,
    Math.floor(steps / STEPS_PER_COIN)
  );
  const stepsIntoCurrentCoin = steps % STEPS_PER_COIN;
  const maxDailyRewardSteps = MAX_DAILY_WALK_COINS * STEPS_PER_COIN;
  const reachedDailyCap = earnedWalkCoins >= MAX_DAILY_WALK_COINS;
  const nextCoinProgressPct = reachedDailyCap
    ? 100
    : Math.round((stepsIntoCurrentCoin / STEPS_PER_COIN) * 100);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-300">Алхалтын бүртгэл</p>
        <h1 className="text-[22px] font-bold text-white tracking-tight">
          Алхаж зоос цуглуул
        </h1>
      </div>

      {/* Main Step Counter Glass Card */}
      <div className="glass-panel rounded-3xl p-5 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-300/20 text-amber-300 flex items-center justify-center">
          <Footprints size={28} />
        </div>

        <div>
          <p className="text-xs text-slate-300">Өнөөдрийн нийт алхам</p>
          <p className="text-[40px] font-extrabold text-white leading-tight tabular-nums">
            {steps.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-amber-300 tabular-nums mt-1">
            Алхалтаас авсан зоос: {earnedWalkCoins} / {MAX_DAILY_WALK_COINS}
          </p>
        </div>

        {/* Progress toward next 8,000-step coin */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span>
              {reachedDailyCap
                ? 'Өдрийн дээд хязгаар (5 зоос) дүүрлээ'
                : 'Дараагийн 1 зоос хүртэл'}
            </span>
            <span className="font-bold tabular-nums">
              {reachedDailyCap
                ? `${maxDailyRewardSteps.toLocaleString()}+`
                : `${stepsIntoCurrentCoin.toLocaleString()} / ${STEPS_PER_COIN.toLocaleString()}`}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-300 transition-all duration-300"
              style={{ width: `${nextCoinProgressPct}%` }}
            />
          </div>
        </div>

        {/* Live Walk Button */}
        <button
          type="button"
          onClick={onToggleWalk}
          className="w-full min-h-[48px] rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isWalking ? <Pause size={18} /> : <Play size={18} />}
          {isWalking ? 'Алхалтыг түр зогсоох' : 'Шууд алхалт эхлүүлэх'}
        </button>

        {/* Quick Step Test Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[1000, 4000, 8000].map((chunk) => (
            <button
              key={chunk}
              type="button"
              onClick={() => onAddSteps(chunk)}
              className="min-h-[42px] rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold tabular-nums transition-colors cursor-pointer"
            >
              +{chunk.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Card */}
      <div className="glass-panel rounded-3xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Info size={16} className="text-sky-300 shrink-0" />
          Алхалтын дүрэм
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          • 8,000 алхам тутамд 1 зоос олгогдоно.
          <br />
          • Алхалтаас өдөрт хамгийн ихдээ 5 зоос (40,000 алхам) авна.
          <br />• Зоосоо хадгалж хөнгөлөлт авахын тулд Тохиргоо хэсгээс нэвтэрнэ үү.
        </p>
        {!isSignedIn && (
          <button
            type="button"
            onClick={onGoSignIn}
            className="mt-1 min-h-[40px] px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Зоос хадгалахын тулд нэвтрэх
          </button>
        )}
      </div>
    </div>
  );
};
