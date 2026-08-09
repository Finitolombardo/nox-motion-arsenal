import React from 'react';
import type { CapabilityEntry } from '../capabilities/types';
import { CAPABILITY_CATEGORY_LABELS } from '../data/capabilitiesCatalog';

const MATURITY_LABEL: Record<CapabilityEntry['maturity'], string> = {
  experimental: 'EXPERIMENTAL',
  verified: 'VERIFIED',
  'production-proven': 'PRODUCTION PROVEN',
};

export function CapabilityCard({ entry, onOpen }: { entry: CapabilityEntry; onOpen: (id: string) => void }) {
  const passedEvidence = entry.evidence.filter((item) => item.status === 'pass').length;

  return (
    <article
      className="cap-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(entry.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(entry.id);
        }
      }}
    >
      <div className="cap-card-topline">
        <span className="cap-category">{CAPABILITY_CATEGORY_LABELS[entry.category]}</span>
        <span className={`cap-maturity cap-maturity-${entry.maturity}`}>{MATURITY_LABEL[entry.maturity]}</span>
      </div>

      <div className="cap-card-title-row">
        <div>
          <h2>{entry.displayName ?? entry.name}</h2>
          <p className="cap-code-name">{entry.name}</p>
        </div>
        <span className={`cap-exposure ${entry.exposure === 'operator-private' ? 'private' : ''}`}>
          {entry.exposure === 'operator-private' ? 'PRIVATE IMPL' : 'PUBLIC SAFE'}
        </span>
      </div>

      <p className="cap-summary">{entry.summary}</p>

      <div className="cap-metrics">
        <div><span>PORTABILITY</span><strong>{entry.portability.toUpperCase()}</strong></div>
        <div><span>EVIDENCE</span><strong>{passedEvidence}/{entry.evidence.length} PASS</strong></div>
        <div><span>RUNTIME</span><strong>{entry.runtimes[0]}</strong></div>
      </div>

      <div className="cap-tags">
        {entry.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}
      </div>

      <div className="cap-card-footer">
        <span>{entry.reusable ? 'REUSABLE MODULE' : 'PROJECT-BOUND'}</span>
        <span>DETAILS →</span>
      </div>
    </article>
  );
}
