# NOX Motion Arsenal

Source-viewable gallery and implementation library for 76 reusable UI and motion effects. Each effect has a stable ID, searchable metadata, adjustable controls, responsive preview and reduced-motion behavior.

## Local development

Requires Node.js `22.20.0`.

```bash
npm ci
npm run dev
```

The local gallery is available at `http://localhost:5195`.

## Verification

```bash
npm audit --audit-level=high
npm run lint
npm run build
npm test
npm run test:contribution:e2e
npm run test:favorites
npm run test:previews:smoke
```

The browser suites require a real Chrome installation and a running local Vite server. The focused preview smoke covers representative Canvas, Three.js, cursor and premium effects. The full `npm run test:previews` audit is maintenance triage, not a release gate by itself.

## GitHub contribution flow

Open an effect, copy its individual AI prompt, fork or clone this repository and work on:

```text
community/<effect-id>/<short-description>
```

Run the required checks and open a pull request against `main`. CI validates every pull request; the linked Vercel project is prepared to build pull-request branches as isolated previews. If direct GitHub work is not possible, use the structured effect-improvement issue form.

## Repository map

- `src/motion-arsenal/effects/` — effect implementations and catalog metadata
- `src/motion-arsenal/components/` — gallery, filters, favorites, detail and controls
- `src/motion-arsenal/contribution/` — effect-specific GitHub contribution prompts and links
- `.github/` — CI, pull-request template and structured effect-improvement issue form
- `src/motion-arsenal/community/` and `server/community/` — inactive future community-platform research
- `docs/future/community-platform.md` — explicit boundary for the retained inactive architecture
- `docs/control-audit.md` — targeted classification rules for generic control markers
- `docs/PROVENANCE.md` — publication and rights classification
- `THIRD_PARTY_NOTICES.md` — dependency and tool attribution

## Security boundary

The public MVP uses GitHub pull requests for submission, review, status and versioning. It does not deploy a submission database, issue tokens or execute submitted third-party JSON. Compatibility API routes return `404 FEATURE_NOT_AVAILABLE`; retained compiler research is not part of current CI or release readiness.

This repository is public for review and contribution, but it is not distributed under an OSI-approved open-source license. See `LICENSE` before reusing or redistributing code. Dependency licenses remain unaffected.
