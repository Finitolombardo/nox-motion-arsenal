import React from 'react';
import type { EffectEntry, EffectImprovementStatus } from '../types';
import { formatEffectUpdatedAt } from '../lib/effectDates';
import { EffectPreview } from './EffectPreview';

interface Props {
  entry: EffectEntry;
  favorite: boolean;
  archived: boolean;
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const IMPROVEMENT_LABELS: Record<EffectImprovementStatus, string> = {
  pending: 'PENDING',
  'in-progress': 'IN PROGRESS',
  improved: 'IMPROVED',
  'needs-review': 'NEEDS REVIEW',
};

export function EffectCard({ entry, favorite, archived, onOpen, onToggleFavorite, onToggleArchive }: Props) {
  const m = entry.meta;
  const improvementStatus = m.improvementStatus ?? 'pending';
  const isImproved = improvementStatus === 'improved' && Boolean(m.lastImprovedAt);
  const timestamp = isImproved ? m.lastImprovedAt : m.updatedAt;
  const updated = formatEffectUpdatedAt(timestamp);
  const timestampLabel = isImproved ? 'IMPROVED' : 'UPDATED';
  const timestampTitle = isImproved ? 'Zuletzt verbessert' : 'Letzte Code-Aktualisierung';

  return (
    <article
      className={`fx-card ${favorite ? 'is-favorite' : ''} ${archived ? 'is-archived' : ''}`}
      data-effect-id={m.id}
      data-improvement-status={improvementStatus}
      onClick={() => onOpen(m.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen(m.id);
      }}
      role="link"
      tabIndex={0}
    >
      <div className="fx-preview">
        <EffectPreview entry={entry} interactive={false} variant="thumbnail" />
        <button
          type="button"
          className={`archive-btn ${archived ? 'on' : ''}`}
          aria-label={`${m.displayName ?? m.name} ${archived ? 'aus dem Archiv holen' : 'archivieren'}`}
          aria-pressed={archived}
          data-archive-effect={m.id}
          onClick={(event) => {
            event.stopPropagation();
            onToggleArchive(m.id);
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {archived ? 'WIEDERHERSTELLEN' : 'ARCHIV'}
        </button>
        <button
          type="button"
          className={`favorite-btn ${favorite ? 'on' : ''}`}
          aria-label={`${m.displayName ?? m.name} ${favorite ? 'aus Favoriten entfernen' : 'als Favorit markieren'}`}
          aria-pressed={favorite}
          data-favorite-effect={m.id}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(m.id);
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">{favorite ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="fx-card-body">
        <div className="fx-card-heading">
          <div className="fx-card-title">{m.displayName ?? m.name}</div>
          <time
            className="fx-updated"
            dateTime={timestamp}
            title={`${timestampTitle}: ${updated.date}`}
          >
            {timestampLabel} {updated.date} · {updated.relative}
          </time>
        </div>
        <p className="fx-card-desc">{m.description}</p>
        <div className="badges">
          <span className={`badge improvement-status improvement-${improvementStatus}`}>
            {IMPROVEMENT_LABELS[improvementStatus]}
          </span>
          {m.improvementVersion && <span className="badge">v{m.improvementVersion}</span>}
          <span className={`badge ${m.mode === 'nox-concept' ? 'lab' : 'adapted'}`}>{m.mode === 'nox-concept' ? 'NOX Concept' : 'NOX Adapted'}</span>
          <span className={`badge ${m.complexity === 'heavy' ? 'heavy' : ''}`}>{m.complexity}</span>
          {m.productionSafe && <span className="badge prod">production</span>}
          <span className="badge">{m.sourceWebsite}</span>
        </div>
      </div>
    </article>
  );
}
