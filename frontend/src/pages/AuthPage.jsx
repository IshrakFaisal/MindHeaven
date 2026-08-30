import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileDown,
  HeartHandshake,
  LockKeyhole,
  MoonStar,
  NotebookPen,
  Pill,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import Brand from '../components/Brand';
import MoodSlider from '../components/MoodSlider';
import useDialogFocus from '../hooks/useDialogFocus';
import { Notice, Spinner } from '../components/Ui';
import { userApi } from '../lib/api';

const moodBars = [46, 58, 52, 68, 63, 76, 84];

const featureCards = [
  { Icon: Sparkles, title: 'One connected check-in', detail: 'Capture mood, sleep, energy, anxiety and context in a gentle guided flow.', tone: 'from-[#fff6ef] to-[#f9e8da]', accent: 'bg-coral-100 text-coral-700' },
  { Icon: NotebookPen, title: 'A journal that stays useful', detail: 'Search, edit and revisit your notes without losing the feeling behind them.', tone: 'from-[#f8f4ef] to-[#f1e8de]', accent: 'bg-amber-100 text-amber-700' },
  { Icon: MoonStar, title: 'Sleep and body signals', detail: 'Bring rest, symptoms and appetite into the same wellbeing picture.', tone: 'from-[#f4f3fb] to-[#e9e8f6]', accent: 'bg-indigo-100 text-indigo-700' },
  { Icon: Pill, title: 'Medication routines', detail: 'Keep schedules, reminder times and taken or skipped decisions together.', tone: 'from-[#f1f6f2] to-[#e5efe8]', accent: 'bg-emerald-100 text-emerald-700' },
  { Icon: TrendingUp, title: 'Explainable personal insights', detail: 'See correlations only when enough paired records exist, with sample size included.', tone: 'from-[#f1f5fa] to-[#e4edf6]', accent: 'bg-sky-100 text-sky-700' },
  { Icon: FileDown, title: 'Reports you can take with you', detail: 'Choose a date range, download a PDF, or export your complete account data.', tone: 'from-[#eef7f6] to-[#deeeeb]', accent: 'bg-cyan-100 text-cyan-700' },
];

const journeySteps = [
  ['01', 'Pause for two minutes', 'Choose the feeling that fits and add only the context you want.'],
  ['02', 'Build a fuller picture', 'Add sleep, body signals and medication decisions when they are relevant.'],
  ['03', 'Notice gentle patterns', 'Your timeline and reports organize the information without judging it.'],
  ['04', 'Carry the clarity forward', 'Export a focused summary for personal reflection or a trusted professional.'],
];

const faqItems = [
  ['Is MindHaven a therapy or diagnosis service?', 'No. MindHaven is a personal wellbeing tracker. It helps you organize your own observations and does not diagnose conditions or replace professional care.'],
  ['Who can see my check-ins?', 'Your tracking records are available only through your authenticated account. The interface does not publish a public profile or social feed.'],
  ['Can I correct something I logged?', 'Yes. Mood journal, symptom, sleep and medication records include editing and deletion controls.'],
  ['Can I take my information with me?', 'Yes. You can download date-range PDF reports and export your complete account data as a readable JSON file.'],
  ['How are personal insights created?', 'MindHaven waits for enough days containing paired measurements, shows the sample size, and describes correlation without claiming that one factor caused another.'],
];

function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="landing-heading mt-3 font-semibold text-pine-950">{title}</h2>
      {description && <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">{description}</p>}
    </div>
  );
}

function AuthPanel({ mode, setMode, form, setForm, showPassword, setShowPassword, error, submitting, onSubmit, onClose }) {
  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="app-dialog relative overflow-hidden p-6 sm:p-8">
      <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-pine-100/70 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Your private space</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-pine-950">
              {mode === 'login' ? 'Welcome back.' : 'Begin with one check-in.'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {mode === 'login' ? 'Continue from where you left off.' : 'Create your account in less than a minute.'}
            </p>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:rotate-6 hover:bg-slate-200 hover:text-pine-900" aria-label="Close account form">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-100/80 p-1.5" role="group" aria-label="Account action">
          {[
            ['login', 'Sign in'],
            ['register', 'Create account'],
          ].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === value ? 'bg-white text-pine-950 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {label}
            </button>
          ))}
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === 'register' && (
            <div>
              <label className="field-label" htmlFor="auth-name">Full name</label>
              <input id="auth-name" className="field" type="text" autoComplete="name" placeholder="Your name" value={form.name} onChange={updateField('name')} required />
            </div>
          )}
          <div>
            <label className="field-label" htmlFor="auth-email">Email address</label>
            <input id="auth-email" className="field" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={updateField('email')} required autoFocus />
          </div>
          <div>
            <label className="field-label" htmlFor="auth-password">Password</label>
            <div className="relative">
              <input id="auth-password" className="field pr-12" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="At least 6 characters" minLength="6" value={form.password} onChange={updateField('password')} required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-pine-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <Notice type="error">{error}</Notice>}

          <button className="primary-button group w-full" type="submit" disabled={submitting}>
            {submitting && <Spinner />}
            <span>{submitting ? 'Please wait' : mode === 'login' ? 'Sign in securely' : 'Create my private space'}</span>
            {!submitting && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        <p className="mt-5 flex items-start gap-2 rounded-2xl bg-pine-50 px-4 py-3 text-xs leading-5 text-pine-800">
          <LockKeyhole size={15} className="mt-0.5 shrink-0" />
          Your check-ins are only visible inside your account. Passwords are securely hashed.
        </p>
      </div>
    </div>
  );
}

function ProductPreview() {
  const [previewMood, setPreviewMood] = useState(8);
  return (
    <div id="product-preview" className="relative mx-auto w-full max-w-[36rem] py-8 lg:py-0">
      <div className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-coral-200/55 blur-3xl" />
      <div className="absolute -right-12 bottom-12 h-56 w-56 rounded-full bg-pine-300/50 blur-3xl" />

      <div className="hero-float relative rounded-[2.1rem] border border-white/80 bg-white/80 p-3 shadow-[0_40px_90px_rgba(26,47,43,0.16)] backdrop-blur-xl sm:p-4">
        <div className="rounded-[1.65rem] bg-[#fbfaf7] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine-500">Today’s reflection</p>
              <p className="mt-1 text-lg font-semibold text-pine-950">How are you feeling?</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-pine-700 shadow-sm">2 min</span>
          </div>

          <div className="mt-5">
            <MoodSlider value={previewMood} onChange={setPreviewMood} />
          </div>
          <p className="preview-caption">Try the slider · Sample data, not saved</p>

          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-semibold text-pine-950">Your weekly rhythm</p><p className="mt-1 text-xs text-slate-400">Mood, sleep and context together</p></div>
              <BarChart3 size={18} className="text-pine-500" />
            </div>
            <div className="mt-4 flex h-24 items-end gap-2">
              {moodBars.map((height, index) => <span key={index} className={`flex-1 rounded-t-lg ${index === moodBars.length - 1 ? 'bg-coral-300' : 'bg-pine-200'}`} style={{ height: `${height}%` }} />)}
            </div>
            <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
              {['We', 'Th', 'Fr', 'Sa', 'Su', 'Mo', 'Tu'].map((day) => <span key={day}>{day}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="hero-float-delayed absolute -left-5 bottom-3 hidden items-center gap-3 rounded-2xl border border-white bg-white/95 p-3 pr-5 shadow-soft sm:flex">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><MoonStar size={18} /></span>
        <div><p className="text-xs font-bold text-slate-400">Last night</p><p className="text-sm font-semibold text-pine-950">7.5 hours of rest</p></div>
      </div>
      <div className="hero-float absolute -right-4 top-3 hidden items-center gap-3 rounded-2xl border border-white bg-white/95 p-3 pr-5 shadow-soft sm:flex">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral-50 text-coral-600"><Activity size={18} /></span>
        <div><p className="text-xs font-bold text-slate-400">Gentle consistency</p><p className="text-sm font-semibold text-pine-950">6 check-ins this week</p></div>
      </div>
    </div>
  );
}

export default function AuthPage({ onAuthenticated }) {
  const dialogRef = useRef(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  useDialogFocus(dialogRef, authOpen);
  const [openFaq, setOpenFaq] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openAuth = (nextMode) => {
    setMode(nextMode);
    setError('');
    setAuthOpen(true);
  };

  useEffect(() => {
    if (!authOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setAuthOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [authOpen]);

  useEffect(() => {
    const sections = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = mode === 'register'
        ? await userApi.register(form)
        : await userApi.login({ email: form.email, password: form.password });
      onAuthenticated(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="landing-page min-h-screen overflow-hidden">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-20 max-w-[82.5rem] items-center justify-between px-5 sm:px-8 lg:px-12 xl:px-16">
          <Brand />
          <nav className="ml-auto mr-5 hidden items-center gap-1 xl:flex" aria-label="Landing navigation">
            {[
              ['#features', 'Features'],
              ['#how-it-works', 'How it works'],
              ['#trust', 'Privacy'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => <a key={href} href={href} className="rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-white/70 hover:text-pine-900">{label}</a>)}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="mr-3 hidden items-center gap-1.5 text-xs font-bold text-pine-800 lg:flex"><ShieldCheck size={15} /> Private by design</span>
            <button type="button" onClick={() => openAuth('login')} className="rounded-full px-4 py-2.5 text-sm font-semibold text-pine-900 transition hover:bg-white/70">Sign in</button>
            <button type="button" onClick={() => openAuth('register')} className="primary-button hidden min-h-10 rounded-full px-4 py-2.5 sm:inline-flex sm:px-5">Get started <ChevronRight size={16} /></button>
          </div>
        </div>
      </header>

      <section className="premium-hero relative flex min-h-[min(56rem,100vh)] items-center overflow-hidden px-5 pb-16 pt-28 sm:px-8 lg:px-12 xl:px-16">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="mx-auto grid w-full max-w-[82.5rem] items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine-200/70 bg-white/75 px-4 py-2 text-xs font-semibold text-pine-700 shadow-sm backdrop-blur">
              <Sparkles size={14} /> A calmer digital space, made for Bangladesh
            </div>
            <h1 className="mt-7 text-[3.2rem] font-semibold leading-[0.98] tracking-[-0.062em] text-pine-950 sm:text-[4.35rem] xl:text-[5.35rem]">
              Your days hold a pattern.
              <span className="block bg-gradient-to-r from-pine-500 via-pine-600 to-coral-500 bg-clip-text text-transparent">See it with care.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              MindHaven brings mood, sleep, symptoms and daily context into one private wellbeing story—so small check-ins become meaningful clarity.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => openAuth('register')} className="primary-button group min-h-14 rounded-full px-7 text-base">
                Start your first check-in <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#product-preview" className="secondary-button min-h-14 rounded-full px-7 text-base">See how it feels</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500">
              {['No ads', 'Export anytime', 'Designed for reflection'].map((item) => <span key={item} className="inline-flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-pine-100 text-pine-700"><Check size={12} strokeWidth={3} /></span>{item}</span>)}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-pine-200/60 bg-pine-100/45 px-5 py-5 sm:px-8" aria-label="MindHaven trust principles">
        <div className="mx-auto grid max-w-[82.5rem] grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [ShieldCheck, 'Private account', 'No public profile'],
            [LockKeyhole, 'Protected records', 'Authenticated access'],
            [FileDown, 'Data ownership', 'Export or delete'],
            [HeartHandshake, 'Human-first language', 'No diagnostic claims'],
          ].map(([Icon, title, detail]) => (
            <div key={title} className="flex items-center gap-3 px-1 py-2 sm:px-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pine-50 text-pine-700"><Icon size={17} /></span>
              <div><p className="text-xs font-semibold text-pine-950 sm:text-sm">{title}</p><p className="mt-0.5 text-xs text-pine-700 sm:text-xs">{detail}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section px-5 py-24 sm:px-8 lg:px-12 xl:px-16" data-reveal>
        <div className="mx-auto max-w-[82.5rem]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <SectionHeading eyebrow="Everything in one gentle place" title="Wellbeing tools that feel connected—not clinical." description="Each feature is useful alone. Together, they help the story of your days become easier to understand." />
            <button type="button" onClick={() => openAuth('register')} className="secondary-button w-fit rounded-full">Explore with your own data <ArrowRight size={16} /></button>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map(({ Icon, title, detail, tone, accent }, index) => (
              <article key={title} className={`premium-feature-card group bg-gradient-to-br ${tone} ${index === 0 ? 'md:col-span-2 xl:col-span-1' : ''}`}>
                <div className="flex items-start justify-between gap-5">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${accent}`}><Icon size={21} /></span>
                  <span className="text-xs font-bold text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight text-pine-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p>
                <button type="button" onClick={() => openAuth('register')} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-pine-700 hover:text-pine-950">Try it in your space <ArrowRight size={15} /></button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12 xl:px-16" data-reveal>
        <div className="relative mx-auto grid max-w-[82.5rem] overflow-hidden rounded-[2.5rem] bg-pine-950 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10 p-7 text-white sm:p-12 lg:p-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral-300">Clarity without pressure</p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">A dashboard should guide your attention, not compete for it.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-pine-100/90 sm:text-base">MindHaven keeps today’s next step obvious, then lets deeper history and insights wait quietly until you need them.</p>
            <div className="mt-8 space-y-4">
              {['One primary action at a time', 'Plain-language patterns with sample sizes', 'Warm visual cues instead of alarm-heavy design'].map((item) => (
                <p key={item} className="flex items-center gap-3 text-sm font-bold text-pine-50"><span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-coral-300"><Check size={14} strokeWidth={3} /></span>{item}</p>
              ))}
            </div>
          </div>
          <div className="relative min-h-[28rem] overflow-hidden bg-gradient-to-br from-pine-700 to-pine-900 p-6 sm:p-10">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-coral-300/15 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-72 w-72 rounded-full bg-pine-300/15 blur-3xl" />
            <div className="relative mx-auto max-w-xl rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-lg sm:p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-pine-100/90">Example day</p><p className="mt-1 text-xl font-semibold text-white">A small moment for yourself</p></div><span className="text-3xl">🙂</span></div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[[MoonStar, 'Sleep', '7.5h'], [Activity, 'Energy', '7/10'], [BarChart3, 'Rhythm', 'Steady']].map(([Icon, label, value]) => <div key={label} className="rounded-2xl bg-white/10 p-4"><Icon size={16} className="text-coral-300" /><p className="mt-4 text-xs font-bold text-pine-100/90">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>)}
              </div>
              <div className="mt-3 rounded-2xl bg-white p-5">
                <p className="text-xs font-bold text-pine-600">Example insight</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-pine-950">Your mood has been steadier on days following seven or more hours of sleep.</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">Based on paired records. Correlation does not establish cause.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section px-5 py-24 sm:px-8 lg:px-12 xl:px-16" data-reveal>
        <div className="mx-auto max-w-[82.5rem]">
          <SectionHeading eyebrow="A simple rhythm" title="From a feeling to a clearer story." description="There is no perfect way to track wellbeing. MindHaven keeps the journey light enough to return to." align="center" />
          <div className="relative mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-8 hidden border-t border-dashed border-pine-300 xl:block" />
            {journeySteps.map(([number, title, detail]) => (
              <article key={number} className="landing-surface relative rounded-[1.75rem] border border-pine-200/65 p-6 shadow-card backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-soft">
                <span className="relative z-10 grid h-16 w-16 place-items-center rounded-[1.4rem] bg-gradient-to-br from-pine-500 to-pine-700 text-lg font-bold text-white shadow-lg shadow-pine-200">{number}</span>
                <h3 className="mt-7 text-lg font-semibold text-pine-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="landing-section px-5 py-24 sm:px-8 lg:px-12 xl:px-16" data-reveal>
        <div className="mx-auto grid max-w-[82.5rem] items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div>
            <span className="grid h-14 w-14 place-items-center rounded-[1.25rem] bg-pine-100 text-pine-700"><ShieldCheck size={25} /></span>
            <SectionHeading eyebrow="Trust is a product feature" title="Proof in the controls—not inflated promises." description="MindHaven builds confidence through things you can actually use: protected routes, clear ownership controls, cautious insight language and complete exports." />
            <p className="mt-6 text-sm leading-6 text-slate-600">MindHaven is a personal tracking tool. It does not provide emergency support, professional therapy or medical advice.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['01', 'Your records are account-gated', 'Personal tracking APIs require an authenticated account token.'],
              ['02', 'You can correct your history', 'Core journal, sleep, symptom and medication records can be edited or deleted.'],
              ['03', 'Insights show their evidence', 'Pattern cards wait for paired days and display the sample size used.'],
              ['04', 'Leaving is a real option', 'Export everything first, then delete the account and its owned records with password confirmation.'],
            ].map(([number, title, detail]) => (
              <article key={number} className="landing-surface rounded-[1.75rem] border border-pine-200/65 p-6 shadow-card transition duration-300 hover:border-pine-300 hover:shadow-soft">
                <span className="text-xs font-bold text-coral-500">{number}</span>
                <h3 className="mt-4 text-base font-semibold text-pine-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-12 xl:px-16" data-reveal aria-label="MindHaven product facts">
        <div className="mx-auto max-w-[82.5rem] rounded-[2.25rem] border border-slate-200 bg-gradient-to-r from-[#f8f4ee] via-white to-[#edf5f2] p-7 sm:p-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-pine-600">Built for everyday reflection</p>
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              ['5', 'daily wellbeing signals'],
              ['4', 'report range options'],
              ['366', 'days in a custom report'],
              ['100%', 'of account data exportable'],
            ].map(([value, label]) => <div key={label} className="text-center"><p className="text-3xl font-bold tracking-tight text-pine-950 sm:text-4xl">{value}</p><p className="mt-2 text-xs font-bold text-pine-700 sm:text-sm">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section id="faq" className="landing-section px-5 py-24 sm:px-8 lg:px-12 xl:px-16" data-reveal>
        <div className="mx-auto grid max-w-[82.5rem] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <SectionHeading eyebrow="Questions, answered clearly" title="Know what MindHaven is—and what it isn’t." description="Trust grows when a product explains its boundaries in plain language." />
          <div className="space-y-3">
            {faqItems.map(([question, answer], index) => {
              const expanded = openFaq === index;
              return (
                <article key={question} className={`overflow-hidden rounded-2xl border transition ${expanded ? 'border-pine-300 bg-pine-50/90' : 'border-slate-200 bg-white/85'}`}>
                  <button type="button" className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left" onClick={() => setOpenFaq(expanded ? -1 : index)} aria-expanded={expanded}>
                    <span className="text-sm font-semibold text-pine-950 sm:text-base">{question}</span>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-pine-700 shadow-sm transition ${expanded ? 'rotate-180' : ''}`}><ChevronDown size={16} /></span>
                  </button>
                  {expanded && <p className="px-5 pb-5 text-sm leading-7 text-slate-500 page-enter">{answer}</p>}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 xl:px-16" data-reveal>
        <div className="relative mx-auto max-w-[82.5rem] overflow-hidden rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-[#f9e8da] via-[#fbf7f1] to-[#deeeeb] px-6 py-14 text-center sm:px-12 sm:py-20">
          <div className="absolute -left-14 -top-16 h-52 w-52 rounded-full bg-white/50 blur-2xl" />
          <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-pine-300/25 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <p lang="bn" className="text-sm font-semibold text-pine-700">আজকের অনুভূতি থেকেই শুরু হোক</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-pine-950 sm:text-5xl">Give today a quiet place to land.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Your first check-in does not need to be profound. It only needs to be honest enough for today.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => openAuth('register')} className="primary-button min-h-14 rounded-full px-8 text-base">Create my MindHaven <ArrowRight size={18} /></button>
              <button type="button" onClick={() => openAuth('login')} className="secondary-button min-h-14 rounded-full px-8 text-base">I already have an account</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-pine-950 px-5 pb-8 pt-14 text-white sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto max-w-[82.5rem]">
          <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_0.6fr_0.6fr]">
            <div className="max-w-md">
              <Brand light />
              <p className="mt-5 text-sm leading-7 text-pine-100/90">A private, human-centered wellbeing tracker built to help everyday patterns feel clearer and more manageable.</p>
              <p className="mt-5 text-xs font-bold text-coral-300">Made with care in Bangladesh.</p>
            </div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine-200">Product</p><div className="mt-4 space-y-3 text-sm text-pine-100/90"><a className="block hover:text-white" href="#features">Features</a><a className="block hover:text-white" href="#how-it-works">How it works</a><a className="block hover:text-white" href="#trust">Privacy</a></div></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine-200">Account</p><div className="mt-4 space-y-3 text-sm text-pine-100/90"><button className="block hover:text-white" type="button" onClick={() => openAuth('login')}>Sign in</button><button className="block hover:text-white" type="button" onClick={() => openAuth('register')}>Create account</button><a className="block hover:text-white" href="#faq">FAQ</a></div></div>
          </div>
          <div className="flex flex-col justify-between gap-3 pt-6 text-xs leading-5 text-pine-100/90 sm:flex-row"><p>© 2026 MindHaven. Personal wellbeing tracking, thoughtfully designed.</p><p>Not a diagnosis or substitute for professional or emergency care.</p></div>
        </div>
      </footer>

      {authOpen && (
        <div className="dialog-overlay fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-pine-950/45 px-4 py-8 backdrop-blur-md" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
          <div ref={dialogRef} tabIndex={-1} className="w-full max-w-[30rem]" role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Sign in to MindHaven' : 'Create a MindHaven account'}>
            <AuthPanel mode={mode} setMode={(nextMode) => { setMode(nextMode); setError(''); }} form={form} setForm={setForm} showPassword={showPassword} setShowPassword={setShowPassword} error={error} submitting={submitting} onSubmit={handleSubmit} onClose={() => setAuthOpen(false)} />
          </div>
        </div>
      )}
    </main>
  );
}
