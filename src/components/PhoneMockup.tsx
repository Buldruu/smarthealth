import React from 'react';
import { CalendarDays, Coins, Footprints, Settings, Tag } from 'lucide-react';
import { APP_TABS, TabId } from '../constants/smartHealthData';

interface PhoneMockupProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  hideBottomNav?: boolean;
  overlay?: React.ReactNode;
  children: React.ReactNode;
}

function getTabIcon(tab: TabId) {
  switch (tab) {
    case 'today':
      return CalendarDays;
    case 'walk':
      return Footprints;
    case 'coins':
      return Coins;
    case 'discounts':
      return Tag;
    case 'settings':
      return Settings;
  }
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  activeTab,
  onSelectTab,
  hideBottomNav = false,
  overlay,
  children,
}) => {
  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-3 sm:p-6">
      {/* Realistic Phone Frame Mockup */}
      <div
        className="relative w-[375px] h-[780px] max-w-full rounded-[52px] bg-[#0b1220] overflow-hidden shrink-0 flex flex-col"
        style={{
          boxShadow:
            'inset 0 0 0 2px rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.6), 0 0 0 10px #1a1a1e, 0 0 0 11px rgba(255,255,255,0.06), 0 24px 64px rgba(15,23,42,0.35)',
        }}
      >
        {/* Dark Slate Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(56,189,248,0.16),transparent_45%),radial-gradient(circle_at_88%_78%,rgba(250,204,21,0.12),transparent_48%)]"
        />

        {/* Dynamic Island */}
        <div
          aria-hidden="true"
          className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-full z-50 flex items-center justify-end pr-3"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-700" />
        </div>

        {/* Scrollable Screen Body */}
        <main
          className={`relative z-10 flex-1 overflow-y-auto no-scrollbar pt-[56px] px-[18px] ${
            hideBottomNav ? 'pb-[36px]' : 'pb-[92px]'
          }`}
        >
          {children}
        </main>

        {/* Bottom 5-Tab Glass Navigation (shown after entering app) */}
        {!hideBottomNav ? (
          <nav
            aria-label="Үндсэн цэс"
            className="absolute bottom-0 left-0 right-0 z-40 glass-panel-strong px-2 pt-2 pb-[20px] border-t border-white/15"
          >
            <div className="grid grid-cols-5 gap-0.5">
              {APP_TABS.map((tab) => {
                const Icon = getTabIcon(tab.id);
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`min-h-[46px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isActive
                        ? 'text-amber-300 bg-white/10'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                    <span className="text-[10px] font-semibold tracking-tight leading-none whitespace-nowrap">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              aria-hidden="true"
              className="mx-auto mt-2 w-[120px] h-[4px] rounded-full bg-white/30"
            />
          </nav>
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[10px] left-1/2 -translate-x-1/2 z-40 w-[120px] h-[4px] rounded-full bg-white/30"
          />
        )}

        {/* Optional In-Screen Modal Overlay */}
        {overlay}
      </div>
    </div>
  );
};
