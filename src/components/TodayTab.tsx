import React, { useState } from 'react';
import {
  Droplets,
  Footprints,
  Minus,
  Plus,
  Target,
  Coins,
  LogIn,
  User,
} from 'lucide-react';
import {
  MAX_DAILY_GAME_COINS,
  MAX_DAILY_WALK_COINS,
  STEPS_PER_COIN,
  TabId,
  WALK_HERO_IMG,
} from '../constants/smartHealthData';

interface TodayTabProps {
  userName: string | null;
  userContact: string | null;
  avatarUrl: string | null;
  steps: number;
  stepGoal: number;
  waterGlasses: number;
  coins: number;
  dailyGameCoins: number;
  onChangeWater: (next: number) => void;
  onChangeGoal: (next: number) => void;
  onNavigateTab: (tab: TabId) => void;
  onOpenLogin: () => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  userName,
  userContact,
  avatarUrl,
  steps,
  stepGoal,
  waterGlasses,
  coins,
  dailyGameCoins,
  onChangeWater,
  onChangeGoal,
  onNavigateTab,
  onOpenLogin,
}) => {
  const [heroImgError, setHeroImgError] = useState(false);

  const walkCoinsToday = Math.min(
    MAX_DAILY_WALK_COINS,
    Math.floor(steps / STEPS_PER_COIN)
  );
  const stepProgressPct = Math.min(100, Math.round((steps / stepGoal) * 100));

  return (
    <div className="space-y-4">
      {/* Header with Profile Avatar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (userName ? onNavigateTab('settings') : onOpenLogin())}
          className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/25 flex items-center justify-center shrink-0 group-hover:border-amber-300 transition-colors">
            {avatarUrl && userName ? (
              <img
                src={avatarUrl}
                alt={`${userName} профайл зураг`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-slate-200" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-300">
              Smart Health Mongolia
            </p>
            <h1 className="text-[19px] font-bold text-white tracking-tight truncate">
              {userName ? `Сайн уу, ${userName}` : 'Өнөөдрийн эрүүл мэнд'}
            </h1>
          </div>
        </button>

        {userName ? (
          <button
            type="button"
            onClick={() => onNavigateTab('coins')}
            className="glass-panel rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
          >
            <Coins size={15} className="text-amber-300" />
            <span className="text-sm font-bold tabular-nums">
              {coins.toLocaleString()}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-full px-3.5 py-2 bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <LogIn size={14} />
            Нэвтрэх
          </button>
        )}
      </div>

      {/* Sign-In Callout or Profile Quick Link */}
      {!userName ? (
        <div className="glass-panel rounded-3xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">
              Нэвтэрч зоосоо хадгалаарай
            </h2>
            <p className="text-xs text-slate-200 mt-0.5">
              Тоглоом болон Мандаалай Фитнессийн 40% хөнгөлөлт нэвтэрсний дараа
              нээгдэнэ.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="min-h-[40px] px-3.5 rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-bold shrink-0 cursor-pointer"
          >
            Нэвтрэх
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-200 truncate">
            Профайл: <strong className="text-white">{userName}</strong>
            {userContact ? ` · ${userContact}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="text-amber-300 font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
          >
            Зураг &amp; Засах
          </button>
        </div>
      )}

      {/* Scenic Ulaanbaatar Walking Trail Picture Card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900">
        <div className="h-[146px] w-full bg-gradient-to-br from-slate-800 to-slate-950">
          {!heroImgError && (
            <img
              src={WALK_HERO_IMG}
              alt="Улаанбаатар хотын алхалтын зам ба Богд хан уул"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-full object-cover object-center"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-4">
          <p className="text-xs font-semibold text-amber-300">
            Улаанбаатар · Өдрийн идэвх
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">
            Алхалт, ус болон зорилго нэвтрэхгүйгээр шууд ажиллана.
          </p>
        </div>
      </div>

      {/* Today's Steps & Goal Card */}
      <div className="glass-panel rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sky-400/20 text-sky-200 flex items-center justify-center">
              <Footprints size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Өнөөдрийн алхалт</h2>
              <p className="text-xs text-slate-300">
                Зорилго: {stepGoal.toLocaleString()} алхам
              </p>
            </div>
          </div>
          <span className="text-lg font-extrabold text-white tabular-nums">
            {steps.toLocaleString()}
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-300 transition-all duration-300"
            style={{ width: `${stepProgressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-200">
          <span className="tabular-nums">Биелэлт: {stepProgressPct}%</span>
          <button
            type="button"
            onClick={() => onNavigateTab('walk')}
            className="font-semibold text-amber-300 hover:underline cursor-pointer"
          >
            Алхалт нэмэх →
          </button>
        </div>
      </div>

      {/* Water & Daily Goal Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-3xl p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Droplets size={14} className="text-sky-300" />
              Ус уух
            </span>
            <span className="text-xs font-bold text-slate-200 tabular-nums">
              {waterGlasses}/8 аяга
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Усны хэмжээг хасах"
              onClick={() => onChangeWater(Math.max(0, waterGlasses - 1))}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <Minus size={15} />
            </button>
            <span className="text-lg font-extrabold text-white tabular-nums">
              {waterGlasses * 250}мл
            </span>
            <button
              type="button"
              aria-label="Усны хэмжээг нэмэх"
              onClick={() => onChangeWater(Math.min(16, waterGlasses + 1))}
              className="w-10 h-10 rounded-2xl bg-sky-400/25 hover:bg-sky-400/40 text-white flex items-center justify-center cursor-pointer"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-3.5 flex flex-col justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Target size={14} className="text-amber-300" />
            Өдрийн зорилго
          </div>

          <div className="grid grid-cols-3 gap-1">
            {[8000, 10000, 16000].map((goal) => {
              const active = stepGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => onChangeGoal(goal)}
                  className={`min-h-[38px] rounded-xl text-[11px] font-bold tabular-nums transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-300 text-slate-950'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {goal / 1000}к
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coins Earned Summary */}
      <div className="glass-panel rounded-3xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Өнөөдрийн зоос</h2>
          <span className="text-xs font-semibold text-amber-300 tabular-nums">
            Нийт +{walkCoinsToday + dailyGameCoins} / 10 боломжит
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          Зоос нь <span className="font-semibold text-white">алхалтаас</span> (
          {walkCoinsToday}/{MAX_DAILY_WALK_COINS}) болон{' '}
          <span className="font-semibold text-white">үнэгүй мини тоглоомоос</span> (
          {dailyGameCoins}/{MAX_DAILY_GAME_COINS}) орж ирнэ.
        </p>
      </div>
    </div>
  );
};
