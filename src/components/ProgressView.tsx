import React, { useState } from 'react';
import { Camera, CheckCircle2, Shield, Trash2, Upload, User } from 'lucide-react';
import type {
  ConsentSettings,
  EveningCheckIn,
  ProgressPhoto,
  StepWalletState,
  UserProfile,
} from '../types';

interface ProgressViewProps {
  profile: UserProfile;
  wallet: StepWalletState;
  checkIns: EveningCheckIn[];
  photos: ProgressPhoto[];
  consent: ConsentSettings;
  onAddPhoto: (photo: ProgressPhoto) => void;
  onDeletePhoto: (id: string) => void;
  onUpdateConsent: (patch: Partial<ConsentSettings>) => Promise<void>;
  onDeleteAllData: () => Promise<void>;
}

function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Зураг боловсруулж чадсангүй.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Зураг уншихад алдаа гарлаа.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Файл уншиж чадсангүй.'));
    reader.readAsDataURL(file);
  });
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  profile,
  wallet,
  checkIns,
  photos,
  consent,
  onAddPhoto,
  onDeletePhoto,
  onUpdateConsent,
  onDeleteAllData,
}) => {
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setUploading(true);
    try {
      const dataUrl = await resizeImageFile(file);
      onAddPhoto({
        id: `ph-${Date.now()}`,
        dataUrl,
        caption: caption.trim() || 'Ахицын зураг',
        uploadedAt: new Date().toLocaleDateString('mn-MN'),
      });
      setCaption('');
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Зураг хадгалахад алдаа гарлаа.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 p-4 pb-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">{profile.name} — Миний ахиц</h1>
            <p className="tabular-nums text-xs text-slate-500">
              {profile.age} нас · {profile.heightCm} см · {profile.weightKg} кг
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-[10px] text-slate-500">Нийт алхам</p>
            <p className="tabular-nums text-sm font-bold text-slate-900">
              {wallet.totalVerifiedSteps.toLocaleString('en-US')}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-[10px] text-slate-500">Олсон зоос</p>
            <p className="tabular-nums text-sm font-bold text-blue-700">{wallet.coinsEarned}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <p className="text-[10px] text-slate-500">Дүгнэлт</p>
            <p className="tabular-nums text-sm font-bold text-slate-900">{checkIns.length} удаа</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">Ахицын зураг</h2>
          </div>
          <button
            type="button"
            onClick={() => onUpdateConsent({ photoConsent: !consent.photoConsent })}
            className={`min-h-[36px] rounded-xl border px-3 text-[11px] font-bold ${
              consent.photoConsent ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700'
            }`}
          >
            {consent.photoConsent ? 'Зөвшөөрсөн' : 'Зөвшөөрөх'}
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
          AI дүрслэлийг түр хойшлуулсан тул та өөрийн зургийг зөвшөөрөлтэй оруулж ахицаа хадгалах ба хүссэн үедээ устгаж болно.
        </p>

        {consent.photoConsent && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Тэмдэглэл (ж: 1-р долоо хоног)"
              className="min-h-[40px] w-full rounded-xl border border-slate-300 px-3 text-xs"
            />
            <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white">
              <Upload className="h-4 w-4" />
              {uploading ? 'Оруулж байна...' : 'Зураг сонгож оруулах'}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {photoError && <p className="text-xs text-rose-700">{photoError}</p>}

            {photos.map((ph) => (
              <div key={ph.id} className="overflow-hidden rounded-xl border border-slate-200">
                <img src={ph.dataUrl} alt={ph.caption} className="h-44 w-full object-cover" />
                <div className="flex items-center justify-between p-2.5 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{ph.caption}</p>
                    <p className="text-[11px] text-slate-500">{ph.uploadedAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(ph.id)}
                    className="flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Устгах
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h2 className="font-display text-lg font-bold text-slate-900">Нууцлал ба Устгах</h2>
        </div>

        {[
          { key: 'motionConnected' as const, label: 'Утасны хөдөлгөөний өгөгдөл' },
          { key: 'locationConsent' as const, label: 'Ойролцоох бүсийн зөвшөөрөл' },
          { key: 'profileHidden' as const, label: 'Community профайл нуух' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
            <span className="text-xs font-semibold text-slate-800">{item.label}</span>
            <button
              type="button"
              onClick={() => onUpdateConsent({ [item.key]: !consent[item.key] })}
              className={`min-h-[34px] rounded-lg px-3 text-[11px] font-bold ${
                consent[item.key] ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {consent[item.key] ? 'Асаалттай' : 'Унтарсан'}
            </button>
          </div>
        ))}

        {!confirmDeleteAll ? (
          <button
            type="button"
            onClick={() => setConfirmDeleteAll(true)}
            className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 text-xs font-bold text-rose-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Миний бүх өгөгдлийг устгах
          </button>
        ) : (
          <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
            <p className="font-bold">Зорилго, зураг болон бүх өгөгдөл устгагдана. Итгэлтэй байна уу?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDeleteAllData}
                className="flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl bg-rose-700 font-bold text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Тийм, устга
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(false)}
                className="min-h-[38px] rounded-xl border border-slate-300 bg-white px-3 font-semibold"
              >
                Болих
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
