import React, { useState } from 'react';
import { Dices, Hand, Lock, Sparkles, ArrowUpDown, CircleDollarSign } from 'lucide-react';
import {
  COIN_EMBLEM_IMG,
  MAX_DAILY_GAME_COINS,
  MAX_DAILY_GAME_PLAYS,
} from '../constants/smartHealthData';

interface CoinsTabProps {
  isSignedIn: boolean;
  coins: number;
  walkCoinsToday: number;
  dailyGameCoins: number;
  gamePlaysUsed: number;
  onPlayResult: (wonCoin: boolean, message: string) => void;
  onGoSignIn: () => void;
}

type MiniGameId = 'flip' | 'hilow' | 'dice' | 'rps';

export const CoinsTab: React.FC<CoinsTabProps> = ({
  isSignedIn,
  coins,
  walkCoinsToday,
  dailyGameCoins,
  gamePlaysUsed,
  onPlayResult,
  onGoSignIn,
}) => {
  const [coinImgError, setCoinImgError] = useState(false);
  const [selectedGame, setSelectedGame] = useState<MiniGameId>('flip');
  const [lastResultMsg, setLastResultMsg] = useState<string | null>(null);
  const [currentNumber, setCurrentNumber] = useState<number>(5);

  const playsLeft = Math.max(0, MAX_DAILY_GAME_PLAYS - gamePlaysUsed);
  const canPlay =
    isSignedIn && playsLeft > 0 && dailyGameCoins < MAX_DAILY_GAME_COINS;

  const finishPlay = (won: boolean, msg: string) => {
    setLastResultMsg(msg);
    onPlayResult(won, msg);
  };

  const handleCoinFlip = (choice: 'Сүлд' | 'Тоо') => {
    if (!canPlay) return;
    const outcome = Math.random() < 0.5 ? 'Сүлд' : 'Тоо';
    const won = choice === outcome;
    finishPlay(
      won,
      won
        ? `${outcome} буулаа! +1 зоос нэмэгдлээ.`
        : `${outcome} буулаа. Зоос хасагдаагүй (0).`
    );
  };

  const handleHiLow = (guess: 'high' | 'low') => {
    if (!canPlay) return;
    const nextNum = Math.floor(Math.random() * 10) + 1;
    const won =
      (guess === 'high' && nextNum >= currentNumber) ||
      (guess === 'low' && nextNum <= currentNumber);
    setCurrentNumber(nextNum === 1 ? 3 : nextNum === 10 ? 8 : nextNum);
    finishPlay(
      won,
      won
        ? `Дараагийн тоо ${nextNum}! Та таалаа (+1 зоос).`
        : `Дараагийн тоо ${nextNum} байлаа. Зоос хасагдаагүй.`
    );
  };

  const handleDice = () => {
    if (!canPlay) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    const won = roll >= 4;
    finishPlay(
      won,
      won
        ? `Шоо ${roll} буулаа! +1 зоос авлаа.`
        : `Шоо ${roll} буулаа (4+ байхад хожно). Зоос хасагдаагүй.`
    );
  };

  const handleRps = (move: 'Чулуу' | 'Даавуу' | 'Хайч') => {
    if (!canPlay) return;
    const moves: Array<'Чулуу' | 'Даавуу' | 'Хайч'> = ['Чулуу', 'Даавуу', 'Хайч'];
    const bot = moves[Math.floor(Math.random() * moves.length)];
    const won =
      (move === 'Чулуу' && bot === 'Хайч') ||
      (move === 'Даавуу' && bot === 'Чулуу') ||
      (move === 'Хайч' && bot === 'Даавуу');
    finishPlay(
      won,
      won
        ? `Апп ${bot} гаргаж та хожлоо! +1 зоос.`
        : `Апп ${bot} гаргалаа. Зоос хасагдаагүй.`
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-300">Миний хэтэвч ба Тоглоом</p>
        <h1 className="text-[22px] font-bold text-white tracking-tight">
          Зоос цуглуулах
        </h1>
      </div>

      {/* Coin Balance Card with Mongolian Gold Coin Picture */}
      <div className="glass-panel rounded-3xl p-4 flex items-center gap-3.5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border border-white/15 shrink-0">
          {!coinImgError ? (
            <img
              src={COIN_EMBLEM_IMG}
              alt="Монгол хээтэй алтан зоос"
              referrerPolicy="no-referrer"
              onError={() => setCoinImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-300">
              <CircleDollarSign size={28} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-300">Нийт үлдэгдэл</p>
          <p className="text-[28px] font-extrabold text-amber-300 leading-tight tabular-nums">
            {isSignedIn ? `${coins.toLocaleString()} зоос` : 'Нэвтэрнэ үү'}
          </p>
          <p className="text-[11px] text-slate-200 mt-0.5 tabular-nums">
            Өнөөдөр: Алхалт +{walkCoinsToday} · Тоглоом +{dailyGameCoins}
          </p>
        </div>
      </div>

      {/* Honest Dual-Source Rule Notice (Open Work #6 Fix) */}
      <div className="glass-panel rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 leading-relaxed">
        Зоос нь <span className="font-bold text-white">алхалт</span> болон{' '}
        <span className="font-bold text-white">үнэгүй мини тоглоомын</span> аль
        алинаас орж ирнэ. Худалдах, шилжүүлэх, бэлэн мөнгө болгох боломжгүй.
      </div>

      {!isSignedIn ? (
        <div className="glass-panel rounded-3xl p-5 text-center space-y-3">
          <div className="mx-auto w-11 h-11 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center">
            <Lock size={20} />
          </div>
          <h2 className="text-base font-bold text-white">
            Тоглоом болон зоос ашиглахад нэвтэрнэ үү
          </h2>
          <p className="text-xs text-slate-200">
            Алхалт, ус болон зорилго нэвтрэхгүйгээр ажилладаг. Зоосоо хадгалж
            тоглохын тулд нэвтэрнэ үү.
          </p>
          <button
            type="button"
            onClick={onGoSignIn}
            className="w-full min-h-[44px] rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
          >
            Тохиргоо руу орж нэвтрэх
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles size={15} className="text-amber-300" />
                Үнэгүй мини тоглоомууд
              </h2>
              <p className="text-[11px] text-slate-300">
                Насны хязгааргүй · Мөрийтэй тоглоом биш · Зоос хасахгүй
              </p>
            </div>
            <span className="text-xs font-bold text-amber-300 tabular-nums shrink-0">
              {playsLeft}/{MAX_DAILY_GAME_PLAYS} эрх
            </span>
          </div>

          {/* Game Picker */}
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'flip', label: 'Зоос', icon: CircleDollarSign },
                { id: 'hilow', label: 'Их/Бага', icon: ArrowUpDown },
                { id: 'dice', label: 'Шоо', icon: Dices },
                { id: 'rps', label: 'Хайч', icon: Hand },
              ] as const
            ).map((g) => {
              const Icon = g.icon;
              const active = selectedGame === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGame(g.id)}
                  className={`min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-300 text-slate-950'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <Icon size={14} />
                  <span>{g.label}</span>
                </button>
              );
            })}
          </div>

          {lastResultMsg && (
            <div className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-amber-200">
              {lastResultMsg}
            </div>
          )}

          {!canPlay ? (
            <div className="rounded-2xl bg-white/10 p-3 text-center text-xs text-slate-200">
              Өнөөдрийн 5 тоглох эрх эсвэл тоглоомын 5 зоосны дээд хязгаар дүүрлээ.
              Маргааш дахин тоглоорой!
            </div>
          ) : (
            <div className="pt-1">
              {selectedGame === 'flip' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-200">
                    Сүлд эсвэл Тоо аль буухыг таагаад +1 зоос аваарай:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCoinFlip('Сүлд')}
                      className="min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold cursor-pointer"
                    >
                      Сүлд
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCoinFlip('Тоо')}
                      className="min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold cursor-pointer"
                    >
                      Тоо
                    </button>
                  </div>
                </div>
              )}

              {selectedGame === 'hilow' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-200">
                    Одоогийн тоо: <span className="font-bold text-amber-300 text-sm tabular-nums">{currentNumber}</span>. Дараагийн тоо (1–10):
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleHiLow('high')}
                      className="min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold cursor-pointer"
                    >
                      Их эсвэл тэнцүү
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHiLow('low')}
                      className="min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 text-white text-sm font-bold cursor-pointer"
                    >
                      Бага эсвэл тэнцүү
                    </button>
                  </div>
                </div>
              )}

              {selectedGame === 'dice' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-200">
                    Шоо хаяад 4, 5, эсвэл 6 буувал +1 зоос авна:
                  </p>
                  <button
                    type="button"
                    onClick={handleDice}
                    className="w-full min-h-[44px] rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 text-sm font-bold cursor-pointer"
                  >
                    Шоо хаях
                  </button>
                </div>
              )}

              {selectedGame === 'rps' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-200">
                    Сонголтоо хийж хожвол +1 зоос авна:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Чулуу', 'Даавуу', 'Хайч'] as const).map((move) => (
                      <button
                        key={move}
                        type="button"
                        onClick={() => handleRps(move)}
                        className="min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                      >
                        {move}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
