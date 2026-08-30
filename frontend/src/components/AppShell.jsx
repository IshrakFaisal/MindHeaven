import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  CalendarCheck2,
  ChevronDown,
  LogOut,
  Menu,
  HeartHandshake,
  MoonStar,
  Pill,
  Plus,
  Settings2,
  SmilePlus,
  Sparkles,
  UserRound,
  Wind,
  X,
} from 'lucide-react';
import { primaryGoal } from '../lib/preferences';
import { APP_NAV_ITEMS } from '../features/catalog';
import Brand from './Brand';

const NAV_ICONS = {
  activity: Activity,
  calendar: CalendarCheck2,
  care: HeartHandshake,
  medication: Pill,
  mood: SmilePlus,
  profile: UserRound,
  reports: BarChart3,
  sleep: MoonStar,
  wellness: Wind,
};

export const NAV_ITEMS = APP_NAV_ITEMS.map((item) => ({ ...item, Icon: NAV_ICONS[item.icon] }));

const MOBILE_ITEMS = NAV_ITEMS.filter((item) => ['overview', 'mood', 'symptoms', 'reports'].includes(item.id));

function MobileNavButton({ item, active, onClick }) {
  const { Icon } = item;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs font-semibold transition ${active ? 'text-pine-800' : 'text-slate-400 hover:text-pine-700'}`}
    >
      <span className={`grid h-8 w-10 place-items-center rounded-xl transition ${active ? 'bg-pine-100' : ''}`}><Icon size={18} strokeWidth={active ? 2.6 : 2} /></span>
      {item.short}
    </button>
  );
}

export default function AppShell({ activePage, onNavigate, user, onLogout, preferences, onOpenOnboarding, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  useEffect(() => {
    const dismiss = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const dismissOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', dismissOutside);
    return () => {
      document.removeEventListener('keydown', dismiss);
      document.removeEventListener('pointerdown', dismissOutside);
    };
  }, []);
  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const focus = primaryGoal(preferences);

  const navigate = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setAccountOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="wellness-shell relative min-h-screen overflow-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="app-header sticky top-0 z-30 border-b border-pine-200/60">
        <div className="app-header-inner relative mx-auto flex h-20 items-center">
          <Brand />

          <nav className="app-nav ml-auto hidden items-center border border-pine-200/60 lg:flex" aria-label="Wellbeing journey">
            {NAV_ITEMS.filter((item) => item.id !== 'profile').map((item) => {
              const { Icon } = item;
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-label={item.label}
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-pine-900 text-white shadow-sm' : 'text-slate-500 hover:bg-pine-50 hover:text-pine-800'}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.6 : 2} />
                  <span className="app-nav-label">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div ref={accountRef} className="relative ml-auto hidden shrink-0 items-center gap-2 lg:flex">
            <button type="button" onClick={() => navigate('checkin')} className="primary-button min-h-11 rounded-full px-5 py-2.5">
              <Plus size={16} strokeWidth={3} /> Check in
            </button>
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              aria-expanded={accountOpen}
              aria-label="Open account menu"
              className="flex items-center gap-2 rounded-full border border-pine-200/60 bg-pine-50/90 p-1.5 pr-3 text-left shadow-sm transition hover:border-pine-300 hover:bg-pine-100"
            >
              <span className="grid h-8 w-8 overflow-hidden place-items-center rounded-full bg-gradient-to-br from-pine-100 to-pine-200 text-xs font-semibold text-pine-800">{user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : initials || 'MH'}</span>
              <ChevronDown size={15} className={`text-slate-400 transition ${accountOpen ? 'rotate-180' : ''}`} />
            </button>

            {accountOpen && (
              <div className="page-enter absolute right-0 top-[3.7rem] w-72 rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-2 shadow-soft backdrop-blur-xl">
                <div className="signed-banner rounded-[1.1rem] px-4 py-4 text-white">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="mt-0.5 truncate text-xs text-pine-50">{user?.email}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pine-950/15 px-2.5 py-1 text-xs font-bold text-pine-50"><Sparkles size={12} /> Focus: {focus.shortLabel}</p>
                </div>
                <button type="button" onClick={() => { setAccountOpen(false); onOpenOnboarding(); }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-pine-50 hover:text-pine-800"><Settings2 size={16} /> Personalize MindHaven</button>
                <button type="button" onClick={() => navigate('profile')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-pine-50 hover:text-pine-800"><UserRound size={16} /> Privacy & profile</button>
                <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-700"><LogOut size={16} /> Sign out</button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="ml-auto grid h-11 w-11 place-items-center rounded-full border border-pine-200/60 bg-pine-50/90 text-pine-900 shadow-sm lg:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="page-enter fixed inset-x-3 top-[5.4rem] z-40 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-3 shadow-soft backdrop-blur-2xl lg:hidden">
          <div className="signed-banner mb-3 rounded-2xl p-4 text-white">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="mt-1 text-xs text-pine-50">Your focus: {focus.shortLabel}</p>
          </div>
          <button type="button" onClick={() => navigate('checkin')} className="primary-button mb-2 w-full"><Plus size={17} /> New daily check-in</button>
          <div className="grid grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => {
              const { Icon } = item;
              return (
                <button key={item.id} type="button" onClick={() => navigate(item.id)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${activePage === item.id ? 'bg-pine-50 text-pine-900' : 'text-slate-500'}`}>
                  <Icon size={17} /> {item.label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { setMobileMenuOpen(false); onOpenOnboarding(); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-slate-600"><Settings2 size={15} /> Personalize</button>
          <button type="button" onClick={onLogout} className="mt-2 flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-500"><LogOut size={15} /> Sign out</button>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="app-main relative">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center rounded-[1.6rem] border border-slate-200/80 bg-white/95 px-1.5 py-1.5 shadow-[0_14px_40px_rgba(26,47,43,0.14)] backdrop-blur-2xl lg:hidden" aria-label="Mobile wellbeing journey">
        {MOBILE_ITEMS.slice(0, 2).map((item) => <MobileNavButton key={item.id} item={item} active={activePage === item.id} onClick={() => navigate(item.id)} />)}
        <button type="button" onClick={() => navigate('checkin')} aria-label="Start daily check-in" className="mx-1 grid h-14 w-14 shrink-0 -translate-y-3 place-items-center rounded-[1.25rem] bg-gradient-to-br from-coral-300 to-coral-400 text-pine-950 shadow-[0_12px_28px_rgba(190,89,45,0.22)] transition active:scale-95"><Plus size={24} strokeWidth={3} /></button>
        {MOBILE_ITEMS.slice(2).map((item) => <MobileNavButton key={item.id} item={item} active={activePage === item.id} onClick={() => navigate(item.id)} />)}
      </nav>
    </div>
  );
}
