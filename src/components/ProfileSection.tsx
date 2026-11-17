import React, { useRef, useState } from 'react';
import { Camera, Check, MapPin, Save, Trash2, User } from 'lucide-react';

export interface UserProfileData {
  name: string;
  contact: string;
  city: string;
  bio: string;
  heightCm: string;
  weightKg: string;
  avatarUrl: string | null;
}

interface ProfileSectionProps {
  profile: UserProfileData;
  totalSteps: number;
  totalCoins: number;
  onSaveProfile: (updated: UserProfileData) => void;
}

const MONGOLIA_LOCATIONS = [
  'Улаанбаатар · Сүхбаатар',
  'Улаанбаатар · Хан-Уул',
  'Улаанбаатар · Баянзүрх',
  'Улаанбаатар · Чингэлтэй',
  'Дархан-Уул',
  'Орхон · Эрдэнэт',
  'Хөвсгөл',
];

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Зураг уншихад алдаа гарлаа.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Зураг буруу байна.'));
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const maxSize = 256;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  totalSteps,
  totalCoins,
  onSaveProfile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile.name);
  const [contact, setContact] = useState(profile.contact);
  const [city, setCity] = useState(profile.city);
  const [bio, setBio] = useState(profile.bio);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);
  const [savedNotice, setSavedNotice] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Зөвхөн зураг (JPG, PNG, WEBP) оруулна уу.');
      return;
    }
    try {
      setUploadError(null);
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatarUrl(dataUrl);
      onSaveProfile({
        name: name.trim() || profile.name,
        contact: contact.trim() || profile.contact,
        city,
        bio: bio.trim(),
        heightCm: heightCm.trim(),
        weightKg: weightKg.trim(),
        avatarUrl: dataUrl,
      });
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2400);
    } catch {
      setUploadError('Зураг оруулахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    onSaveProfile({
      name: name.trim() || profile.name,
      contact: contact.trim() || profile.contact,
      city,
      bio: bio.trim(),
      heightCm: heightCm.trim(),
      weightKg: weightKg.trim(),
      avatarUrl: null,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveProfile({
      name: name.trim(),
      contact: contact.trim(),
      city,
      bio: bio.trim(),
      heightCm: heightCm.trim(),
      weightKg: weightKg.trim(),
      avatarUrl,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2400);
  };

  return (
    <div className="glass-panel rounded-3xl p-4 space-y-4">
      {/* Profile Photo Upload Header */}
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-slate-800 border-2 border-amber-300/70 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${name || 'Хэрэглэгч'} профайл зураг`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={30} className="text-slate-300" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Профайл зураг оруулах"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-300 hover:bg-amber-200 text-slate-950 flex items-center justify-center shadow-lg cursor-pointer"
          >
            <Camera size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold text-white truncate">
            {name || profile.name}
          </p>
          <p className="text-xs text-slate-300 flex items-center gap-1 truncate mt-0.5">
            <MapPin size={12} className="text-amber-300 shrink-0" />
            {city}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[32px] px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold cursor-pointer"
            >
              Зураг оруулах
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                aria-label="Зураг устгах"
                className="min-h-[32px] px-2.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                Устгах
              </button>
            )}
          </div>
        </div>
      </div>

      {uploadError && (
        <p role="alert" className="text-xs font-semibold text-amber-300">
          {uploadError}
        </p>
      )}

      {/* Quick Profile Summary Numbers */}
      <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-white/10 text-center">
        <div>
          <p className="text-[11px] text-slate-300">Өнөөдрийн алхам</p>
          <p className="text-base font-extrabold text-white tabular-nums">
            {totalSteps.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-slate-300">Цуглуулсан зоос</p>
          <p className="text-base font-extrabold text-amber-300 tabular-nums">
            {totalCoins.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Editable Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-[11px] font-semibold text-slate-300 mb-1"
            >
              Нэр
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            />
          </div>
          <div>
            <label
              htmlFor="profile-contact"
              className="block text-[11px] font-semibold text-slate-300 mb-1"
            >
              Утас / Имэйл
            </label>
            <input
              id="profile-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="profile-city"
            className="block text-[11px] font-semibold text-slate-300 mb-1"
          >
            Хот / Дүүрэг (Монгол)
          </label>
          <select
            id="profile-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full min-h-[40px] px-3 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-amber-300 cursor-pointer"
          >
            {MONGOLIA_LOCATIONS.map((loc) => (
              <option key={loc} value={loc} className="bg-slate-900 text-white">
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label
              htmlFor="profile-height"
              className="block text-[11px] font-semibold text-slate-300 mb-1"
            >
              Өндөр (см)
            </label>
            <input
              id="profile-height"
              type="number"
              placeholder="170"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            />
          </div>
          <div>
            <label
              htmlFor="profile-weight"
              className="block text-[11px] font-semibold text-slate-300 mb-1"
            >
              Жин (кг)
            </label>
            <input
              id="profile-weight"
              type="number"
              placeholder="65"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="profile-bio"
            className="block text-[11px] font-semibold text-slate-300 mb-1"
          >
            Миний зорилго / Тайлбар
          </label>
          <textarea
            id="profile-bio"
            rows={2}
            placeholder="Өдөр бүр 8,000+ алхам алхах зорилготой..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs outline-none resize-none focus-visible:ring-2 focus-visible:ring-amber-300"
          />
        </div>

        <button
          type="submit"
          className="w-full min-h-[44px] rounded-2xl bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {savedNotice ? <Check size={15} /> : <Save size={15} />}
          {savedNotice ? 'Профайл хадгалагдлаа!' : 'Профайл хадгалах'}
        </button>
      </form>
    </div>
  );
};
