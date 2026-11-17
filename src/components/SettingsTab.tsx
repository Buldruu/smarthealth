import React, { useState } from 'react';
import { LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { LoginSection } from './LoginSection';
import { ProfileSection, UserProfileData } from './ProfileSection';

interface SettingsTabProps {
  profile: UserProfileData | null;
  totalSteps: number;
  totalCoins: number;
  onSignIn: (name: string, contact: string) => void;
  onSaveProfile: (updated: UserProfileData) => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profile,
  totalSteps,
  totalCoins,
  onSignIn,
  onSaveProfile,
  onSignOut,
  onDeleteAccount,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-300">Миний бүртгэл ба Профайл</p>
        <h1 className="text-[22px] font-bold text-white tracking-tight">
          Профайл ба Тохиргоо
        </h1>
      </div>

      {/* Profile Section with Photo Upload OR Login Section */}
      {!profile ? (
        <LoginSection onSignIn={onSignIn} />
      ) : (
        <>
          <ProfileSection
            profile={profile}
            totalSteps={totalSteps}
            totalCoins={totalCoins}
            onSaveProfile={onSaveProfile}
          />

          {/* Account Actions (Sign Out / Delete Account) */}
          <div className="glass-panel rounded-3xl p-4 space-y-2.5">
            <button
              type="button"
              onClick={onSignOut}
              className="w-full min-h-[42px] rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              Гарах
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full min-h-[42px] rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                Бүртгэл устгах
              </button>
            ) : (
              <div className="rounded-2xl bg-rose-950/60 border border-rose-400/35 p-3 space-y-2.5">
                <p className="text-xs text-rose-100 font-semibold">
                  Бүртгэл болон цуглуулсан зоос бүрмөсөн устана. Итгэлтэй байна уу?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="min-h-[38px] rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer"
                  >
                    Болих
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(false);
                      onDeleteAccount();
                    }}
                    className="min-h-[38px] rounded-xl bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Тийм, устгах
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Official Rules & Support Info */}
      <div className="glass-panel rounded-3xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-sky-300" />
          Smart Health Mongolia · Дүрэм ба Холбоо
        </h2>
        <p className="text-xs text-slate-200 leading-relaxed">
          • 8,000 алхам = 1 зоос (алхалтаас өдөрт дээд тал нь 5 зоос).
          <br />
          • Үнэгүй тоглоомууд өдөрт 5 эрх, дээд тал нь 5 зоос. Зоос хасахгүй.
          <br />
          • Мандаалай Фитнесс: 500 зоос = 40% хөнгөлөлт (7 хоног хүчинтэй).
          <br />• Насны хязгааргүй · Мөрийтэй тоглоом биш.
        </p>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
          <span>www.smarthealth.mn</span>
          <span>/privacy-mobile.html · /support-mobile.html</span>
        </div>
      </div>
    </div>
  );
};
