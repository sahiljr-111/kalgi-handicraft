'use client';

import { Check, Link2 } from 'lucide-react';
import { useState } from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';

/** Share on WhatsApp, or copy the link. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const btn = 'inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-navy hover:text-ink';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Share:</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={btn}>
        <WhatsAppIcon className="size-3.5" /> WhatsApp
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt('Copy this link', url);
          }
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />} {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
