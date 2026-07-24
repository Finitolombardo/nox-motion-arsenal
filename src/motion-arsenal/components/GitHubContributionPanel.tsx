import { useMemo, useState } from 'react';
import effectOwnedFiles from 'virtual:effect-owned-files';
import type { EffectEntry } from '../types';
import {
  buildGitHubContributionPrompt,
  effectIssueUrl,
  effectPullRequestUrl,
  REPOSITORY_URL,
} from '../contribution/githubContribution';

export function GitHubContributionPanel({ entry }: { entry: EffectEntry }) {
  const [copied, setCopied] = useState(false);
  const ownedFiles = effectOwnedFiles[entry.meta.importPath] ?? [];
  const prompt = useMemo(
    () => buildGitHubContributionPrompt(entry.meta, ownedFiles),
    [entry.meta, ownedFiles],
  );

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="github-contribution" aria-labelledby="github-contribution-title">
      <div className="github-contribution-copy">
        <span className="contribution-kicker">CONTRIBUTE VIA GITHUB</span>
        <h3 id="github-contribution-title">Diesen Effekt verbessern</h3>
        <p>Prompt kopieren, im öffentlichen Repository arbeiten und die Änderung als Pull Request prüfen lassen.</p>
      </div>

      <div className="github-contribution-actions">
        <button className="contribution-primary" type="button" onClick={copyPrompt}>
          {copied ? '✓ PROMPT KOPIERT' : 'AI-PROMPT KOPIEREN'}
        </button>
        <details className="effect-files">
          <summary>EFFEKTDATEIEN ANZEIGEN</summary>
          <ul>
            {ownedFiles.map((file) => <li key={file}>{file}</li>)}
          </ul>
        </details>
        <a className="contribution-link" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
          REPOSITORY ÖFFNEN
        </a>
        <a className="contribution-link" href={effectPullRequestUrl()} target="_blank" rel="noreferrer">
          VERBESSERUNG ÜBER GITHUB EINREICHEN
        </a>
        <a className="contribution-link contribution-link-muted" href={effectIssueUrl(entry.meta)} target="_blank" rel="noreferrer">
          VERBESSERUNG ALS GITHUB ISSUE EINREICHEN
        </a>
      </div>
    </section>
  );
}
