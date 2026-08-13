import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CIAdvertisement } from '../types';

interface PromotionalModalProps {
  ads: CIAdvertisement[];
  /** Delay before showing, ms (default 6s). */
  delayMs?: number;
  /** Minimum hours between two showings (frequency cap). */
  capHours?: number;
}

const STORAGE_KEY = 'nf_promo_last_shown';

/**
 * Dismissible, timed promotional pop-up bound to ci_advertisement.
 * Frequency-capped via localStorage so returning readers aren't nagged.
 */
export const PromotionalModal: React.FC<PromotionalModalProps> = ({ ads, delayMs = 6000, capHours = 24 }) => {
  const [visible, setVisible] = useState(false);

  const ad = ads.find((a) => a.status === 1 && (a.position === 'blog' || a.position === 'top_banner'));

  useEffect(() => {
    if (!ad) return;
    try {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      if (Date.now() - last < capHours * 3600_000) return;
    } catch {
      /* storage unavailable — show once per pageload */
    }
    const t = setTimeout(() => {
      setVisible(true);
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }, delayMs);
    return () => clearTimeout(t);
  }, [ad?.id, delayMs, capHours]);

  if (!visible || !ad) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setVisible(false)} />
      <div className="relative z-10 w-full max-w-md bg-slate-50 border border-slate-200 rounded-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/70 bg-white">
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-slate-400 font-semibold">
            Sponsored
          </span>
          <button
            onClick={() => setVisible(false)}
            className="p-1.5 -mr-1 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100"
            aria-label="Dismiss promotion"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          title={ad.title}
          className="block p-4 hover:opacity-95 transition"
          onClick={() => setVisible(false)}
        >
          <img
            src={ad.advertisement_image}
            alt={ad.alt_tag}
            className="w-full h-auto max-h-[60vh] object-contain bg-white border border-slate-200/60 rounded-sm"
            onError={() => setVisible(false)}
          />
          <p className="pt-3 text-sm font-serif font-bold text-slate-800 text-center">{ad.title}</p>
        </a>
      </div>
    </div>
  );
};

export default PromotionalModal;
