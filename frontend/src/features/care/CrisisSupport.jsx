import { AlertTriangle, ExternalLink, HeartHandshake, Phone, ShieldAlert } from 'lucide-react';
import { SUPPORT_RESOURCES } from './supportResources';

export function CrisisSafetyBanner() {
  return (
    <section className="care-safety-banner">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700"><ShieldAlert size={20} /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-red-950">If you may hurt yourself or someone else, use immediate human support.</p>
        <p className="mt-1 text-sm leading-6 text-red-900/70">Call Bangladesh National Emergency Service at 999 or go to the nearest emergency department. MindHaven is not an emergency service.</p>
      </div>
      <a className="care-emergency-button" href="tel:999"><Phone size={16} /> Call 999</a>
    </section>
  );
}

export function CrisisSupportPanel() {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-pine-100 text-pine-700"><HeartHandshake size={20} /></span><div><p className="eyebrow">Human support</p><h2 className="mt-1 text-xl font-semibold text-pine-950">Bangladesh support contacts</h2></div></div>
      <div className="mt-5 space-y-3">
        {SUPPORT_RESOURCES.map((resource) => <a key={resource.number} href={resource.href} className="group block rounded-2xl border border-pine-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-md"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-pine-950">{resource.name}</p><span className="inline-flex items-center gap-1 rounded-lg bg-pine-50 px-2.5 py-1 text-sm font-bold text-pine-700"><Phone size={13} /> {resource.number}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{resource.detail}</p></a>)}
      </div>
      <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900"><AlertTriangle size={15} className="mr-2 inline" />Phone availability can change. For immediate danger, use 999 or the nearest emergency department.</div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold"><a className="inline-flex items-center gap-1 text-pine-700 underline underline-offset-4" href="https://bangladesh.gov.bd/pages/static-pages/69a55ba386514399668e4e89" target="_blank" rel="noreferrer">Government hotline directory <ExternalLink size={12} /></a><a className="inline-flex items-center gap-1 text-pine-700 underline underline-offset-4" href="https://16263.dghs.gov.bd/" target="_blank" rel="noreferrer">Health service source <ExternalLink size={12} /></a></div>
    </section>
  );
}
