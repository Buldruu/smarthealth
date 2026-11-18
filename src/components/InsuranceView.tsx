import React, { useState } from 'react';
import { ArrowRight, Check, Gift, QrCode, Shield, ShieldCheck } from 'lucide-react';
import type { Coupon, InsuranceState, PartnerOffer } from '../types';
import { QrMatrix } from './QrMatrix';

interface InsuranceViewProps {
  insurance: InsuranceState;
  offers: PartnerOffer[];
  onRefresh: () => Promise<void>;
  onOpenRewards: () => void;
}

export const InsuranceView: React.FC<InsuranceViewProps> = ({
  insurance,
  offers,
  onRefresh,
  onOpenRewards,
}) => {
  const [policyInput, setPolicyInput] = useState('');
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const [claimingOfferId, setClaimingOfferId] = useState<string | null>(null);
  const [issuedCoupon, setIssuedCoupon] = useState<Coupon | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const activePlan = insurance.enrolled
    ? insurance.plans.find((p) => p.id === insurance.activePlanId) || null
    : null;

  const freeOffersForActive = activePlan
    ? offers.filter((o) => activePlan.freeOfferIds.includes(o.id))
    : [];

  const handleEnroll = async (planId: string) => {
    setFeedback(null);
    setSubmittingPlanId(planId);
    try {
      const res = await fetch('/api/insurance/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, policyInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: 'error', text: data.error || 'Бүртгүүлэхэд алдаа гарлаа.' });
        return;
      }
      setPolicyInput('');
      setFeedback({
        kind: 'success',
        text: 'Таны даатгалын эрх идэвхжлээ! Багтсан хөнгөлөлтүүдийг зоосгүйгээр үнэгүй авах боломжтой.',
      });
      await onRefresh();
    } finally {
      setSubmittingPlanId(null);
    }
  };

  const handleCancel = async () => {
    setFeedback(null);
    const res = await fetch('/api/insurance/cancel', { method: 'POST' });
    if (res.ok) {
      setIssuedCoupon(null);
      setFeedback({ kind: 'success', text: 'Даатгалын холболтыг цуцаллаа.' });
      await onRefresh();
    }
  };

  const handleClaimFreeCoupon = async (offerId: string) => {
    setFeedback(null);
    setClaimingOfferId(offerId);
    try {
      const res = await fetch('/api/coupons/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ kind: 'error', text: data.error || 'Үнэгүй купон үүсгэж чадсангүй.' });
        return;
      }
      setIssuedCoupon(data.coupon as Coupon);
      setFeedback({
        kind: 'success',
        text: `Даатгалын эрхээр үнэгүй QR купон (${data.coupon.code}) үүслээ. 0 зоос хасагдлаа.`,
      });
      await onRefresh();
    } finally {
      setClaimingOfferId(null);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-6">
      {/* Insurance Status Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-blue-700">
              Эрүүл мэндийн даатгал · 0 зоос хөнгөлөлт
            </p>
            <h1 className="font-display text-xl font-bold text-slate-900">Даатгал</h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Даатгалд хамрагдсанаар сонгогдсон түншүүдийн хөнгөлөлтийг зоос зарцуулахгүйгээр үнэгүй авна.
            </p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              insurance.enrolled ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {insurance.enrolled ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </div>
        </div>

        {insurance.enrolled && activePlan ? (
          <div className="mt-3.5 space-y-2.5 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-blue-800">{activePlan.providerName}</p>
                <p className="text-sm font-bold text-slate-900">{activePlan.planName}</p>
              </div>
              <span className="text-[11px] font-bold text-blue-800 whitespace-nowrap">
                Идэвхтэй
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-700">
              <span className="font-mono font-semibold tabular-nums">
                Гэрээ: {insurance.policyNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Эхэлсэн: {insurance.enrolledAt}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenRewards}
                className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 whitespace-nowrap"
              >
                Урамшуулал руу очих
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-[40px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Цуцлах
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 space-y-2 rounded-xl bg-slate-50 p-3">
            <label className="block text-[11px] font-semibold text-slate-700">
              Гэрээний дугаар (хэрэв танд бэлэн полис байгаа бол — заавал биш)
            </label>
            <input
              type="text"
              value={policyInput}
              onChange={(e) => setPolicyInput(e.target.value)}
              placeholder="Жишээ: ARD-2026-8412"
              className="min-h-[40px] w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs uppercase focus:border-blue-600 focus:outline-none"
            />
          </div>
        )}

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

      {/* Issued Free QR Coupon Preview */}
      {issuedCoupon && (
        <section className="rounded-2xl border border-blue-200 bg-white p-4 text-center">
          <p className="text-[11px] font-bold text-blue-700">
            Даатгалын үнэгүй QR купон · 0 зоос
          </p>
          <div className="my-3 flex justify-center">
            <QrMatrix value={issuedCoupon.code} size={132} />
          </div>
          <p className="font-mono text-base font-bold text-slate-900">{issuedCoupon.code}</p>
          <p className="mt-1 text-xs font-semibold text-slate-800">
            {issuedCoupon.partnerName} · {issuedCoupon.discountLabel}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Салбар: {issuedCoupon.branch}</p>
        </section>
      )}

      {/* Available Free Discounts for Active Insurance */}
      {insurance.enrolled && freeOffersForActive.length > 0 && (
        <section className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-blue-600" />
              <h2 className="font-display text-lg font-bold text-slate-900">
                Даатгалаар үнэгүй хөнгөлөлтүүд
              </h2>
            </div>
            <span className="tabular-nums text-[11px] font-bold text-blue-700">
              {freeOffersForActive.length} санал
            </span>
          </div>

          <div className="space-y-2.5">
            {freeOffersForActive.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500">
                      {offer.partnerCategory} · {offer.discountLabel}
                    </p>
                    <p className="text-xs font-bold text-slate-900">{offer.partnerName}</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">{offer.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-nums text-[11px] text-slate-400 line-through">
                      {offer.requiredCoins} зоос
                    </p>
                    <p className="text-xs font-extrabold text-blue-700 whitespace-nowrap">
                      0 зоос · Үнэгүй
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={claimingOfferId === offer.id}
                  onClick={() => handleClaimFreeCoupon(offer.id)}
                  className="mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  {claimingOfferId === offer.id ? 'Үүсгэж байна...' : 'Үнэгүй QR купон авах'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Insurance Plans List */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Даатгалын багцууд</h2>
          <p className="text-[11px] text-slate-600">
            Багц бүр түншийн тодорхой хөнгөлөлтүүдийг зоос шаардахгүй үнэгүй болгоно
          </p>
        </div>

        <div className="space-y-3">
          {insurance.plans.map((plan) => {
            const isActive = insurance.enrolled && insurance.activePlanId === plan.id;
            const includedOffers = offers.filter((o) => plan.freeOfferIds.includes(o.id));
            const coinOnlyOffers = offers.filter((o) => !plan.freeOfferIds.includes(o.id));

            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-blue-700">{plan.providerName}</p>
                    <h3 className="text-sm font-bold text-slate-900">{plan.planName}</h3>
                  </div>
                  <span className="tabular-nums shrink-0 text-xs font-extrabold text-slate-900">
                    {plan.monthlyFeeLabel}
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  {plan.coverageSummary}
                </p>

                <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2">
                  <p className="text-[11px] font-semibold text-slate-800">
                    Үнэгүй (0 зоос) авах хөнгөлөлтүүд:
                  </p>
                  {includedOffers.map((o) => (
                    <p key={o.id} className="flex items-center gap-1.5 text-[11px] text-blue-800">
                      <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <span>
                        {o.partnerName} — {o.discountLabel}
                      </span>
                    </p>
                  ))}
                  {coinOnlyOffers.length > 0 && (
                    <p className="pt-0.5 text-[10px] text-slate-500">
                      Бусад {coinOnlyOffers.length} санал хэвээр зоосоор олгогдоно.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isActive || submittingPlanId === plan.id}
                  onClick={() => handleEnroll(plan.id)}
                  className={`mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-colors ${
                    isActive
                      ? 'border border-blue-200 bg-blue-100 text-blue-900'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isActive
                    ? 'Идэвхтэй даатгал'
                    : submittingPlanId === plan.id
                    ? 'Бүртгэж байна...'
                    : insurance.enrolled
                    ? 'Энэ багц руу шилжих'
                    : 'Даатгалд бүртгүүлэх'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
