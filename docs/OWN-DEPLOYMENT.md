# Eigenes Deployment-Ziel

Dieses Repository ist ein Klon der Baseline `Finitolombardo/nox-motion-arsenal`.
Deren Vercel-Projekt gehört einem fremden Team — dorthin kann und soll dieser
Checkout nicht deployen. Dieses Dokument beschreibt den Weg zu einem eigenen
`*.vercel.app`, das ein Agent laufend befüllen darf.

## Was bereits steht

| Baustein | Status |
| --- | --- |
| Eigener GitHub-Fork | `Denisbalik1-debug/nox-motion-arsenal`, Remote `fork`, 42 Branches |
| CI | `.github/workflows/motion-arsenal-ci.yml` — audit, lint, build, test auf jedem PR |
| Dist-Export | `.github/workflows/export-vercel-dist.yml` |
| Security-Header | `vercel.json` (CSP, X-Frame-Options, Permissions-Policy) |
| Agenten-Automation | Motion Foundry v1 — `plan`, `verify`, `batch`, `publish`, `install` |
| Publish-Guard | Operator-GO, sauberer Tree, Produktionsbranch, verlinktes Projekt, Smoke-Test |

Es fehlt also **kein Code** — es fehlt ausschließlich das eigene Deployment-Ziel.

## Statuscheck

```bash
npm run own:check
```

Prüft Git-Binary, `GH_TOKEN`, eigenen Remote, Vercel-Verlinkung und die lokale
Foundry-Konfiguration und nennt den jeweils nächsten Schritt. Ändert nichts.

## Einrichtung

### 1. Git reparieren

`C:\Program Files\Git\cmd\git.exe` und `mingw64\bin\git.exe` fehlen in dieser
Installation, während das echte Binary unter `mingw64\libexec\git-core\git.exe`
noch liegt — typisches Bild einer Antivirus-Quarantäne. Die PATH-Einträge zeigen
damit ins Leere, und jeder `git`-Aufruf aus Foundry oder CI-Skripten schlägt fehl.

Git for Windows neu installieren (Reparatur genügt), danach:

```bash
git --version
```

Die Skripte hier haben einen Fallback auf das libexec-Binary, der Foundry-
Publish-Guard (`runCommand("git status --porcelain")`) hat ihn nicht.

### 2. GH_TOKEN erneuern

`gh auth status` meldet aktuell: *The token in GH_TOKEN is invalid.* Ohne
gültiges Token kann der Agent weder pushen noch PRs öffnen. Neues Fine-grained
Token für `Denisbalik1-debug/nox-motion-arsenal` mit Contents (RW), Pull requests
(RW), Workflows (RW) anlegen und als `GH_TOKEN` setzen.

### 3. Vercel-Projekt anlegen und verlinken

Im Repository-Ordner:

```bash
npx vercel login
```

```bash
npx vercel link
```

Dabei ein **neues eigenes Projekt** wählen (nicht das bestehende
`nox-motion-arsenal` des fremden Teams). Vercel schreibt danach
`.vercel/project.json` mit `orgId` und `projectId` — die Datei ist gitignored und
bleibt lokal.

Framework-Erkennung: Vite. Build `npm run build`, Output `dist`. Die
`vercel.json` mit den Security-Headern wird automatisch mitgenommen.

### 4. Ziel übernehmen

```bash
npm run own:adopt
```

Schreibt `.nox/motion-foundry.local.json` aus dem, was tatsächlich im Checkout
steht — eigener Remote-Slug plus `orgId`/`projectId` aus der Vercel-Verlinkung.
Erfundene IDs gibt es hier nicht.

Die Datei überlagert `.nox/motion-foundry.json` und ist gitignored: die Baseline
bleibt unangetastet, ein späterer Merge von upstream kollidiert nicht. Nicht
gesetzte Schlüssel werden geerbt — `publishGuard`, `productionBranch`,
`deployCommand` und `verificationCommands` gelten unverändert weiter.

Zum Schluss die Produktionsdomain in der Datei gegenprüfen: `own:adopt` leitet
sie aus dem Projektnamen ab, Vercel vergibt bei Namenskollision aber eine
abweichende Domain.

### 5. Erster eigener Deploy

```bash
npm run own:check
```

Wenn alles grün ist, auf `main` wechseln, sauberen Tree herstellen und:

```bash
NOX_MOTION_FOUNDRY_PROD_GO=GO npm run foundry:prod -- batches/example-motion-batch.json
```

Der Guard bricht ab, wenn das verlinkte Vercel-Ziel nicht zu
`.nox/motion-foundry.local.json` passt — genau das schützt davor, versehentlich
gegen das fremde Projekt zu deployen.

## Danach: der Agenten-Loop

Der eigentliche Grund für das eigene Ziel. Motion Foundry ist bereits darauf
gebaut, ein Batch mit mehreren Effekten in einem Durchgang zu verarbeiten:

1. Batch-JSON unter `batches/` anlegen — Effekt-IDs oder -Links, Intent,
   Varianten, Brand-Kits, Constraints.
2. `npm run foundry:plan -- batches/<datei>.json` — löst Katalogeinträge und
   Implementierungsdateien auf, schreibt Plan nach `reports/motion-foundry/`.
3. Agent ändert die Effektquellen bzw. legt neue an.
4. `npm run foundry:verify -- batches/<datei>.json` — `npm ci`, `lint`, `test`,
   `build` in einem Durchlauf.
5. PR gegen `main` des eigenen Forks, CI grün, squash-merge.
6. Sauberes `main` ziehen, `foundry:prod` mit Operator-GO.

Neue Effekte brauchen zusätzlich einen Katalogeintrag in
`src/motion-arsenal/effects/<familie>/catalog.ts` und einen Contract-Test unter
`scripts/`, sonst greift `npm test` nicht.

Was seit dem letzten Production-Stand dazugekommen ist, zeigt:

```bash
npm run whats-new
```

## Grenzen

- Vercel-Login und Projektanlage sind interaktiv und an das Vercel-Konto
  gebunden — das muss der Betreiber selbst durchführen.
- Der Fork behält `origin` auf die Baseline. PRs versehentlich gegen upstream zu
  öffnen ist damit möglich; für Agentenläufe `fork` explizit angeben.
- `reports/` ist gitignored. Die QA-Screenshots, auf die `whats-new.html`
  verweist, existieren nur lokal und fehlen in einem frischen Klon.
