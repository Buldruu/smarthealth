import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, LogIn, Mail, MapPin, Smartphone, User, X } from 'lucide-react';
import { WALK_HERO_IMG } from '../constants/smartHealthData';

interface LoginSectionProps {
  onSignIn: (name: string, contact: string) => void;
  onContinueGuest?: () => void;
  onClose?: () => void;
  fullScreen?: boolean;
}

export const LoginSection: React.FC<LoginSectionProps> = ({
  onSignIn,
  onContinueGuest,
  onClose,
  fullScreen = false,
}) => {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [heroError, setHeroError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanContact = contact.trim();

    if (!cleanName) {
      setError('Нэрээ оруулна уу.');
      return;
    }

    if (method === 'phone') {
      const digits = cleanContact.replace(/\D/g, '');
      if (digits.length < 8) {
        setError('8 оронтой утасны дугаар оруулна уу (жишээ: 99112233).');
        return;
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact)) {
        setError('Зөв имэйл хаяг оруулна уу.');
        return;
      }
    }

    setError(null);
    onSignIn(cleanName, cleanContact);
  };

  return (
    <div className={fullScreen ? 'space-y-4' : ''}>
      {/* Full-bleed Running App Hero Cover */}
      {fullScreen && (
        <div className="relative -mx-[18px] -mt-[56px] h-[296px] overflow-hidden bg-slate-950">
          {!heroError && (
            <img
              src={WALK_HERO_IMG}
              alt="Улаанбаатарын үдшийн алхалтын зам ба Богд хан уул"
              referrerPolicy="no-referrer"
              onError={() => setHeroError(true)}
              className="w-full h-full object-cover object-center scale-[1.03]"
            />
          )}

          {/* Smooth Scrim Melting Into Dark Slate Canvas */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/25 to-[#0b1220]"
          />

          {/* Subtle Animated Running Route Line Overlay */}
          <svg
            viewBox="0 0 375 110"
            fill="none"
            aria-hidden="true"
            className="absolute top-[52px] left-0 w-full h-[90px] pointer-events-none opacity-85"
          >
            <motion.path
              d="M -10 78 Q 72 26, 148 64 T 302 36 T 390 54"
              stroke="#fde047"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.circle
              cx="302"
              cy="36"
              r="4.5"
              fill="#fde047"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, duration: 0.3 }}
            />
          </svg>

          {/* Top Route Telemetry Line */}
          <div className="absolute top-[56px] left-[18px] right-[18px] flex items-center justify-between text-[11px] font-semibold text-white/90">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-amber-300" />
              Улаанбаатар · 1,350м
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <Activity size={12} />
              Гүйлт ба Алхалт
            </span>
          </div>

          {/* Bottom Athletic Proverb Headline */}
          <div className="absolute bottom-3 left-[18px] right-[18px]">
            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-[0.12em]">
              Smart Health Mongolia
            </p>
            <h1 className="font-athletic text-[28px] font-bold uppercase text-white leading-[1.08] tracking-tight mt-1">
              Мянган бээрийн аян ганц алхмаас эхэлнэ
            </h1>
            <p className="text-xs text-slate-200 mt-1.5">
              Алхам бүр эрүүл бие, эрч хүчний эхлэл.
            </p>
          </div>
        </div>
      )}

      {/* Sleek Running Club Login Card */}
      <div className="glass-panel rounded-3xl p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
              Тамирчны бүртгэл
            </p>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
              <LogIn size={16} className="text-amber-300" />
              Нэвтэрч эхлэх
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Нэвтрэх цонхыг хаах"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Phone vs Email Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/10">
          <button
            type="button"
            onClick={() => {
              setMethod('phone');
              setContact('');
              setError(null);
            }}
            className={`min-h-[38px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              method === 'phone'
                ? 'bg-amber-300 text-slate-950'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            Утасны дугаар
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setContact('');
              setError(null);
            }}
            className={`min-h-[38px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              method === 'email'
                ? 'bg-amber-300 text-slate-950'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <Mail size={14} />
            Имэйл хаяг
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
          <div className="relative">
            <User
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
            />
            <label htmlFor="login-name" className="sr-only">
              Таны нэр
            </label>
            <input
              id="login-name"
              type="text"
              placeholder="Таны нэр (жишээ: Ану)"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full min-h-[44px] pl-10 pr-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            />
          </div>

          <div className="relative">
            {method === 'phone' ? (
              <Smartphone
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            ) : (
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            )}
            <label htmlFor="login-contact" className="sr-only">
              {method === 'phone' ? 'Утасны дугаар' : 'Имэйл хаяг'}
            </label>
            <input
              id="login-contact"
              type={method === 'phone' ? 'tel' : 'email'}
              placeholder={
                method === 'phone' ? '9911 2233' : 'name@example.mn'
              }
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (error) setError(null);
              }}
              className="w-full min-h-[44px] pl-10 pr-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-amber-300 px-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-extrabold text-sm transition-colors cursor-pointer"
          >
            Нэвтэрч орох
          </button>
        </form>

        {/* Quick Demo Entry & Guest Mode */}
        <div className="grid grid-cols-1 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onSignIn('Төрөө', '99118800')}
            className="w-full min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Туршилтын эрхээр хурдан орох (Төрөө)
          </button>

          {onContinueGuest && (
            <button
              type="button"
              onClick={onContinueGuest}
              className="w-full min-h-[36px] rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Нэвтрэхгүйгээр алхалт, ус ашиглах
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
