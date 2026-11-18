import React, { useState } from 'react';
import { CheckCircle2, QrCode, ShieldCheck, Store, Ticket, XCircle } from 'lucide-react';
import type { Coupon, InsuranceState, PartnerCategory, PartnerOffer, StepWalletState } from '../types';
import { QrMatrix } from './QrMatrix';

interface RewardsViewProps {
  wallet: StepWalletState;
  offers: PartnerOffer[];
  adminOffers: PartnerOffer[];
  coupons: Coupon[];
  insurance: InsuranceState;
  onRefresh: () => Promise<void>;
  onOpenInsurance: () => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  wallet,
  offers,
  adminOffers,
  coupons,
  insurance,
  onRefresh,
  onOpenInsurance,
}) => {
  const [roleView, setRoleView] = useState<'user' | 'partner' | 'admin'>('user');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const [partnerName, setPartnerName] = useState('');
  const [partnerCategory, setPartnerCategory] = useState<PartnerCategory>('Фитнес клуб');
  const [offerTitle, setOfferTitle] = useState('');
  const [discountLabel, setDiscountLabel] = useState('20% хөнгөлөлт');
  const [requiredCoins, setRequiredCoins] = useState(2);
  const [insuranceFreeEligible, setInsuranceFreeEligible] = useState(true);
  const [branch, setBranch] = useState('');
  const [terms, setTerms] = useState('Нэг удаагийн QR кодоор зөвхөн салбар дээр баталгаажуулж ашиглана.');

  const effectiveFreeCoins = Math.max(0, wallet.availableCoins - wallet.pendingCouponCoins);
  const activePlan = insurance.enrolled
    ? insurance.plans.find((p) => p.id === insurance.activePlanId) || null
    : null;

  const handleIssueCoupon = async (offerId: string) => {
    setFeedback(null);
    const res = await fetch('/api/coupons/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: 'error', text: data.error });
      return;
    }
    const issued = data.coupon as Coupon;
    setSelectedCoupon(issued);
    setVerifyCode(issued.code);
    setFeedback({
      kind: 'success',
      text:
        issued.requiredCoins === 0
          ? `Купон (${issued.code}) даатгалын эрхээр үнэгүй үүслээ. 0 зоос хасагдана.`
          : `Купон (${issued.code}) үүслээ. Түнш баталгаажуулсны дараа ${issued.requiredCoins} зоос хасагдана.`,
    });
    await onRefresh();
  };

  const handleVerifyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch('/api/partner/coupons/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: verifyCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: 'error', text: data.error });
      return;
    }
    setFeedback({
      kind: 'success',
      text:
        data.verifiedCoupon.requiredCoins === 0
          ? `Купон (${data.verifiedCoupon.code}) баталгаажлаа! Даатгалын эрхээр үнэгүй (0 зоос).`
          : `Купон (${data.verifiedCoupon.code}) баталгаажлаа! ${data.verifiedCoupon.requiredCoins} зоос зарцуулагдлаа.`,
    });
    await onRefresh();
  };

  const handleExpireCoupon = async (couponId: string) => {
    await fetch(`/api/coupons/${couponId}/expire`, { method: 'POST' });
    await onRefresh();
  };

  const handleCreatePartnerOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch('/api/partner/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerName,
        partnerCategory,
        title: offerTitle,
        discountLabel,
        requiredCoins,
        insuranceFreeEligible,
        branch,
        terms,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ kind: 'error', text: data.error });
      return;
    }
    setPartnerName('');
    setOfferTitle('');
    setBranch('');
    setFeedback({
      kind: 'success',
      text: 'Шинэ санал илгээгдлээ. Админ баталгаажуулсны дараа нийтлэгдэнэ.',
    });
    await onRefresh();
  };

  const handleAdminDecision = async (offerId: string, decision: 'approved' | 'rejected') => {
    setFeedback(null);
    const res = await fetch(`/api/admin/offers/${offerId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      setFeedback({
        kind: 'success',
        text: decision === 'approved' ? 'Түнш ба санал баталгаажиж нийтлэгдлээ.' : 'Саналаас татгалзлаа.',
      });
      await onRefresh();
    }
  };

  return (
    <div className="space-y-4 p-4 pb-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-amber-700">Түнш баталгаажуулахад зоос хасна</p>
            <h1 className="font-display text-xl font-bold text-slate-900">Урамшуулал ба Купон</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Чөлөөт зоос</p>
            <p className="tabular-nums font-display text-xl font-bold text-amber-600">{effectiveFreeCoins}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: 'user', label: 'Саналууд' },
            { id: 'partner', label: 'Түнш' },
            { id: 'admin', label: 'Админ' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setRoleView(t.id as 'user' | 'partner' | 'admin')}
              className={`min-h-[38px] rounded-lg px-2 text-xs font-semibold ${
                roleView === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
          <span className={activePlan ? 'font-semibold text-blue-800' : 'text-slate-600'}>
            {activePlan
              ? `Даатгал идэвхтэй (${activePlan.planName}) · сонгогдсон хөнгөлөлт 0 зоос`
              : 'Даатгалд орсноор зарим хөнгөлөлтийг зоосгүй үнэгүй авна'}
          </span>
          <button
            type="button"
            onClick={onOpenInsurance}
            className="shrink-0 font-bold text-blue-700 hover:text-blue-800 whitespace-nowrap"
          >
            {activePlan ? 'Багц харах' : 'Даатгал үзэх'}
          </button>
        </div>

        {feedback && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
              feedback.kind === 'success'
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </section>

      {roleView === 'user' && (
        <div className="space-y-4">
          {selectedCoupon && (
            <section className="rounded-2xl border border-blue-200 bg-white p-4 text-center">
              <p className="text-[11px] font-bold uppercase text-blue-700">
                {selectedCoupon.requiredCoins === 0 ? 'Даатгалын үнэгүй QR' : 'Нэг удаагийн QR'} ·{' '}
                {selectedCoupon.status === 'issued'
                  ? 'Идэвхтэй'
                  : selectedCoupon.status === 'redeemed'
                  ? 'Ашиглагдсан'
                  : 'Дууссан'}
              </p>
              <div className="my-3 flex justify-center">
                <QrMatrix value={selectedCoupon.code} size={132} />
              </div>
              <p className="font-mono text-base font-bold text-slate-900">{selectedCoupon.code}</p>
              <p className="mt-1 text-xs font-semibold text-slate-800">
                {selectedCoupon.partnerName} · {selectedCoupon.discountLabel}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Салбар: {selectedCoupon.branch}
              </p>
            </section>
          )}

          {offers.map((offer) => {
            const isFreeWithInsurance = Boolean(
              activePlan && activePlan.freeOfferIds.includes(offer.id)
            );
            const canAfford = isFreeWithInsurance || effectiveFreeCoins >= offer.requiredCoins;
            return (
              <article key={offer.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-32 bg-slate-100">
                  <img
                    src={offer.imageUrl}
                    alt={offer.partnerName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[10px] text-slate-200">{offer.partnerCategory}</p>
                      <h2 className="font-display text-lg font-bold leading-tight">{offer.partnerName}</h2>
                    </div>
                    <span className="tabular-nums text-sm font-extrabold text-amber-300">{offer.discountLabel}</span>
                  </div>
                </div>

                <div className="space-y-2 p-3.5">
                  <h3 className="text-xs font-bold text-slate-900">{offer.title}</h3>
                  {isFreeWithInsurance ? (
                    <p className="text-[11px] text-slate-600">
                      <span className="tabular-nums mr-1.5 text-slate-400 line-through">
                        {offer.requiredCoins} зоос
                      </span>
                      <strong className="text-blue-700">0 зоос · Даатгалаар үнэгүй</strong> · Хүчинтэй:{' '}
                      {offer.validUntil}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-600">
                      <strong className="tabular-nums text-amber-700">{offer.requiredCoins} зоос</strong> · Хүчинтэй:{' '}
                      {offer.validUntil}
                      {offer.insuranceFreeEligible && !insurance.enrolled && (
                        <span className="ml-1.5 font-semibold text-blue-700">
                          · Даатгалаар үнэгүй болно
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">Салбар: {offer.branch}</p>
                  <p className="text-[11px] text-slate-500">{offer.terms}</p>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleIssueCoupon(offer.id)}
                    className="mt-1 flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    {isFreeWithInsurance
                      ? 'Үнэгүй QR купон авах (Даатгал)'
                      : canAfford
                      ? `QR купон авах (${offer.requiredCoins} зоос)`
                      : `${offer.requiredCoins} зоос шаардлагатай`}
                  </button>
                </div>
              </article>
            );
          })}

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-blue-600" />
              <h2 className="font-display text-lg font-bold text-slate-900">Миний купонууд</h2>
            </div>
            {coupons.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Одоогоор үүсгэсэн купон алга.</p>
            ) : (
              <div className="mt-2.5 space-y-2">
                {coupons.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{c.code}</span>
                      <span
                        className={`text-[11px] font-bold ${
                          c.status === 'issued'
                            ? 'text-amber-700'
                            : c.status === 'redeemed'
                            ? 'text-blue-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {c.status === 'issued' ? 'Идэвхтэй' : c.status === 'redeemed' ? 'Ашиглагдсан' : 'Дууссан'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {c.partnerName} ·{' '}
                      {c.requiredCoins === 0 ? 'Даатгалаар үнэгүй (0 зоос)' : `${c.requiredCoins} зоос`}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCoupon(c);
                          setVerifyCode(c.code);
                        }}
                        className="min-h-[34px] flex-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700"
                      >
                        QR харах
                      </button>
                      {c.status === 'issued' && (
                        <button
                          type="button"
                          onClick={() => handleExpireCoupon(c.id)}
                          className="min-h-[34px] rounded-lg border border-rose-200 px-2.5 text-[11px] font-semibold text-rose-700"
                        >
                          Хугацаа дуусгах
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {roleView === 'partner' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-600" />
              <h2 className="font-display text-lg font-bold text-slate-900">Түнш: Купон шалгах</h2>
            </div>
            <form onSubmit={handleVerifyCoupon} className="mt-3 space-y-2.5">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="VTX-XXXX-XXXX"
                className="min-h-[42px] w-full rounded-xl border border-slate-300 px-3 font-mono text-xs uppercase"
              />
              <button
                type="submit"
                className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-xs font-bold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Баталгаажуулах (Зоос тооцох)
              </button>
            </form>
            {coupons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {coupons.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setVerifyCode(c.code)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-800"
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Шинэ санал илгээх</h2>
            <form onSubmit={handleCreatePartnerOffer} className="mt-3 space-y-2.5">
              <input
                type="text"
                required
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Байгууллагын нэр"
                className="min-h-[40px] w-full rounded-xl border border-slate-300 px-3 text-xs"
              />
              <select
                value={partnerCategory}
                onChange={(e) => setPartnerCategory(e.target.value as PartnerCategory)}
                className="min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs"
              >
                <option value="Фитнес клуб">Фитнес клуб</option>
                <option value="Эмийн сан">Эмийн сан</option>
                <option value="Спорт заал">Спорт заал</option>
                <option value="Эрүүл хоол">Эрүүл хоол</option>
              </select>
              <input
                type="text"
                required
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="Саналын гарчиг"
                className="min-h-[40px] w-full rounded-xl border border-slate-300 px-3 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={discountLabel}
                  onChange={(e) => setDiscountLabel(e.target.value)}
                  placeholder="Хөнгөлөлт"
                  className="min-h-[40px] rounded-xl border border-slate-300 px-3 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  value={requiredCoins}
                  onChange={(e) => setRequiredCoins(Number(e.target.value))}
                  className="tabular-nums min-h-[40px] rounded-xl border border-slate-300 px-3 text-xs"
                />
              </div>
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Салбарын хаяг"
                className="min-h-[40px] w-full rounded-xl border border-slate-300 px-3 text-xs"
              />
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={insuranceFreeEligible}
                  onChange={(e) => setInsuranceFreeEligible(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Даатгалтай гишүүдэд зоосгүй үнэгүй олгох боломжтой
              </label>
              <button type="submit" className="min-h-[42px] w-full rounded-xl bg-slate-900 text-xs font-bold text-white">
                Админ баталгаажуулалтад илгээх
              </button>
            </form>
          </section>
        </div>
      )}

      {roleView === 'admin' && (
        <section className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">Админ: Түнш батлах</h2>
          </div>
          {adminOffers.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">{item.partnerName}</span>
                <span
                  className={`text-[11px] font-bold ${
                    item.status === 'approved'
                      ? 'text-blue-700'
                      : item.status === 'pending'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {item.status === 'approved' ? 'Батлагдсан' : item.status === 'pending' ? 'Гэрээ хүлээгдэж буй' : 'Татгалзсан'}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-600">{item.title} · {item.requiredCoins} зоос</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAdminDecision(item.id, 'approved')}
                  className="flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 text-[11px] font-bold text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Батлах
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminDecision(item.id, 'rejected')}
                  className="flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 text-[11px] font-bold text-rose-700"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Татгалзах
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
