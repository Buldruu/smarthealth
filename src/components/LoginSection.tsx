import React, { useState } from 'react';
import { LogIn, Mail, Smartphone, User, X } from 'lucide-react';
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
      {/* Welcome Banner Photo when shown as the first screen */}
      {fullScreen && (
        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900">
          <div className="h-[168px] w-full bg-gradient-to-br from-slate-800 to-slate-950">
            {!heroError && (
              <img
                src={WALK_HERO_IMG}
                alt="Улаанбаатарын алхалтын зам ба Богд хан уул"
                referrerPolicy="no-referrer"
                onError={() => setHeroError(true)}
                className="w-full h-full object-cover object-center"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent flex flex-col justify-end p-4">
            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              Smart Health Mongolia
            </p>
            <h1 className="text-[22px] font-extrabold text-white leading-tight mt-0.5">
              Алхаад зоос цуглуул, хөнгөлөлт ав
            </h1>
            <p className="text-xs text-slate-200 mt-1">
              8,000 алхам = 1 зоос · Мандаалай Фитнесс 40% хөнгөлөлт
            </p>
          </div>
        </div>
      )}

      {/* Login Glass Card */}
      <div className="glass-panel rounded-3xl p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
              Smart Health Бүртгэл
            </p>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
              <LogIn size={16} className="text-amber-300" />
              Нэвтрэх
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

        <p className="text-xs text-slate-200 leading-relaxed">
          Зоос, үнэгүй тоглоом болон хөнгөлөлт авахын тулд эхлээд нэвтэрнэ үү.
        </p>

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
            className="w-full min-h-[46px] rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
          >
            Нэвтэрч орох
          </button>
        </form>

        {/* Quick Demo Entry & Guest Mode */}
        <div className="grid grid-cols-1 gap-2 pt-1">
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
              className="w-full min-h-[38px] rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Нэвтрэхгүйгээр алхалт, ус ашиглах
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
