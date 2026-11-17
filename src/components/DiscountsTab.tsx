import React, { useState } from 'react';
import { CheckCircle2, Lock, Search, Ticket } from 'lucide-react';
import {
  MANDAALAI_COST,
  MANDAALAI_DISCOUNT_LABEL,
  MANDAALAI_IMG,
  VOUCHER_VALID_DAYS,
  Voucher,
} from '../constants/smartHealthData';

interface DiscountsTabProps {
  isSignedIn: boolean;
  coins: number;
  vouchers: Voucher[];
  onClaimMandaalai: () => void;
  onGoSignIn: () => void;
}

export const DiscountsTab: React.FC<DiscountsTabProps> = ({
  isSignedIn,
  coins,
  vouchers,
  onClaimMandaalai,
  onGoSignIn,
}) => {
  const [partnerImgError, setPartnerImgError] = useState(false);
  const [staffCodeInput, setStaffCodeInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const canClaim = isSignedIn && coins >= MANDAALAI_COST;

  const handleStaffVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = staffCodeInput.trim().toUpperCase();
    if (!cleaned) {
      setVerifyResult('Шалгах ваучерын кодоо оруулна уу.');
      return;
    }
    const found = vouchers.find((v) => v.code.toUpperCase() === cleaned);
    if (found) {
      setVerifyResult(
        `Хүчинтэй код: ${found.partnerName} · ${found.discountLabel} (${found.expiresAt} хүртэл)`
      );
    } else {
      setVerifyResult('Энэ код олдсонгүй эсвэл хүчингүй байна.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-300">Хамтрагч байгууллагууд</p>
          <h1 className="text-[22px] font-bold text-white tracking-tight">
            Хөнгөлөлтийн ваучер
          </h1>
        </div>
        {isSignedIn && (
          <span className="glass-panel rounded-full px-3 py-1 text-xs font-bold text-amber-300 tabular-nums">
            {coins.toLocaleString()} зоос
          </span>
        )}
      </div>

      {/* First Partner: Мандаалай Фитнесс */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="relative h-[138px] w-full bg-slate-900">
          {!partnerImgError && (
            <img
              src={MANDAALAI_IMG}
              alt="Мандаалай Фитнесс төвийн дотоод орчин"
              referrerPolicy="no-referrer"
              onError={() => setPartnerImgError(true)}
              className="w-full h-full object-cover object-center"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-4">
            <p className="text-xs font-bold text-amber-300">Анхны хамтрагч</p>
            <h2 className="text-lg font-extrabold text-white leading-tight">
              Мандаалай Фитнесс
            </h2>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-200">
            <span className="font-bold text-white text-sm">
              {MANDAALAI_DISCOUNT_LABEL}
            </span>
            <span className="tabular-nums font-semibold">
              {MANDAALAI_COST} зоос · {VOUCHER_VALID_DAYS} хоног хүчинтэй
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            Ваучер авмагц утсан дээр код гарч ирэх бөгөөд Мандаалай Фитнессийн
            ажилтанд үзүүлж ашиглана. Нэг хүн хэдэн ч удаа авч болно.
          </p>

          {!isSignedIn ? (
            <button
              type="button"
              onClick={onGoSignIn}
              className="w-full min-h-[44px] rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock size={14} />
              Ваучер авахын тулд нэвтэрнэ үү
            </button>
          ) : (
            <button
              type="button"
              disabled={!canClaim}
              onClick={onClaimMandaalai}
              className="w-full min-h-[46px] rounded-2xl bg-amber-300 hover:bg-amber-200 disabled:bg-white/10 disabled:text-slate-300 text-slate-950 font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {canClaim
                ? `Ваучер авах (${MANDAALAI_COST} зоос)`
                : `Зоос хүрэлцэхгүй (${coins}/${MANDAALAI_COST})`}
            </button>
          )}
        </div>
      </div>

      {/* Active Vouchers on Phone */}
      {isSignedIn && (
        <div className="glass-panel rounded-3xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Ticket size={15} className="text-amber-300" />
            Миний авсан ваучерууд ({vouchers.length})
          </h3>

          {vouchers.length === 0 ? (
            <p className="text-xs text-slate-300">
              Одоогоор ваучер аваагүй байна. 500 зоос цуглуулаад Мандаалай
              Фитнессийн 40% хөнгөлөлтийн код аваарай.
            </p>
          ) : (
            <div className="space-y-2.5">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="rounded-2xl bg-white/10 border border-white/15 p-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-white">
                      {voucher.partnerName} · {voucher.discountLabel}
                    </p>
                    <p className="text-base font-extrabold text-amber-300 tracking-wider tabular-nums mt-0.5">
                      {voucher.code}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5 tabular-nums">
                      Дуусах огноо: {voucher.expiresAt} (7 хоног)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffCodeInput(voucher.code);
                      setVerifyResult(null);
                    }}
                    className="min-h-[36px] px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold cursor-pointer shrink-0"
                  >
                    Шалгах
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner Staff Code Verification Tool (Open Work #4) */}
      <form
        onSubmit={handleStaffVerify}
        className="glass-panel rounded-3xl p-4 space-y-2.5"
      >
        <label
          htmlFor="staff-voucher-code"
          className="text-xs font-bold text-white flex items-center gap-1.5"
        >
          <Search size={14} className="text-sky-300" />
          Ажилтны код шалгах хэсэг
        </label>
        <div className="flex gap-2">
          <input
            id="staff-voucher-code"
            type="text"
            placeholder="Жишээ: MF-123456"
            value={staffCodeInput}
            onChange={(e) => {
              setStaffCodeInput(e.target.value);
              if (verifyResult) setVerifyResult(null);
            }}
            className="flex-1 min-h-[42px] px-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          />
          <button
            type="submit"
            className="min-h-[42px] px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer shrink-0"
          >
            Шалгах
          </button>
        </div>
        {verifyResult && (
          <p className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{verifyResult}</span>
          </p>
        )}
      </form>
    </div>
  );
};
