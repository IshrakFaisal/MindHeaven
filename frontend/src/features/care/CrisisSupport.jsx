import { AlertTriangle, ExternalLink, HeartHandshake, Phone, ShieldAlert } from 'lucide-react';
import { SUPPORT_RESOURCES } from './supportResources';

export function CrisisSafetyBanner() {
  return (
    <section className="care-safety-banner" aria-labelledby="care-safety-title">
      <span className="care-safety-icon" aria-hidden="true"><ShieldAlert size={20} /></span>
      <div className="care-safety-copy">
        <span className="care-safety-label">Immediate safety</span>
        <p id="care-safety-title">If you may hurt yourself or someone else, use immediate human support.</p>
        <small>Call Bangladesh National Emergency Service or go to the nearest emergency department. MindHaven is not an emergency service.</small>
      </div>
      <a className="care-emergency-button" href="tel:999"><Phone size={16} /> Call 999</a>
    </section>
  );
}

export function CrisisSupportPanel() {
  return (
    <section className="card care-support-panel">
      <div className="care-support-heading"><span><HeartHandshake size={20} aria-hidden="true" /></span><div><p className="eyebrow">Human support</p><h2>Bangladesh support contacts</h2><small>For moments that need a real person.</small></div></div>
      <div className="care-support-list">
        {SUPPORT_RESOURCES.map((resource) => <a key={resource.number} href={resource.href} className="care-support-contact"><div><p>{resource.name}</p><span><Phone size={12} /> {resource.number}</span></div><small>{resource.detail}</small></a>)}
      </div>
      <div className="care-support-note"><AlertTriangle size={15} />Phone availability can change. For immediate danger, use 999 or the nearest emergency department.</div>
      <div className="care-support-sources"><a href="https://bangladesh.gov.bd/pages/static-pages/69a55ba386514399668e4e89" target="_blank" rel="noreferrer">Government hotline directory <ExternalLink size={12} /></a><a href="https://16263.dghs.gov.bd/" target="_blank" rel="noreferrer">Health service source <ExternalLink size={12} /></a></div>
    </section>
  );
}
