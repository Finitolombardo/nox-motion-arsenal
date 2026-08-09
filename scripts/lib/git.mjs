// Git-Zugriff, der eine beschaedigte Windows-Installation ueberlebt.
//
// Auf dieser Maschine fehlen `Git\cmd\git.exe` und `Git\mingw64\bin\git.exe`
// (typisch nach einer Antivirus-Quarantaene), waehrend das echte Binary unter
// `mingw64\libexec\git-core\git.exe` liegt. Die PATH-Eintraege zeigen damit ins
// Leere. Ohne diesen Fallback bricht jeder automatisierte Lauf ab.

import { execFileSync } from 'node:child_process';

const CANDIDATES = [
  'git',
  'C:/Program Files/Git/cmd/git.exe',
  'C:/Program Files/Git/mingw64/bin/git.exe',
  'C:/Program Files/Git/mingw64/libexec/git-core/git.exe',
];

let resolved;

export function gitBinary() {
  if (resolved !== undefined) return resolved;
  for (const candidate of CANDIDATES) {
    try {
      const out = execFileSync(candidate, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      if (/^git version/.test(out)) {
        resolved = candidate;
        return resolved;
      }
    } catch {
      /* naechster Kandidat */
    }
  }
  resolved = null;
  return null;
}

export function git(args, { cwd, allowFail = false } = {}) {
  const binary = gitBinary();
  if (!binary) {
    if (allowFail) return null;
    throw new Error('Kein funktionierendes git-Binary gefunden. Git for Windows reparieren.');
  }
  try {
    return execFileSync(binary, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    if (allowFail) return null;
    const detail = error.stderr ? `\n${error.stderr}` : '';
    throw new Error(`git ${args.join(' ')} fehlgeschlagen${detail}`);
  }
}

export const isPathBroken = () => gitBinary() !== null && gitBinary() !== 'git';
