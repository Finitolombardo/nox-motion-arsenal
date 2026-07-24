# Future community platform

The repository contains an earlier, broader community-platform design covering manual JSON packages, submission tokens, persistence, admin review and isolated compilation.

It is retained as future research, not as the public MVP.

## Current status

- Not deployed as an active contribution path.
- All community feature flags default to `false`, including local development.
- The local Vite server does not mount the retained community API plugin.
- Public Vercel compatibility endpoints return `404 FEATURE_NOT_AVAILABLE`.
- CI and release readiness do not depend on token, database, admin, compiler or sandbox flows.
- No production database, token service or public foreign-code execution is configured.

## MVP contribution path

Effect page → copy effect-specific prompt → fork or clone → focused branch → tests → GitHub pull request → CI → Vercel PR preview → human review → merge.

## Future activation boundary

Any activation of the retained platform requires a separate architecture and production GO covering persistence, authentication, abuse controls, sandbox isolation, observability and rollback. Do not extend it during MVP work.

Historical design notes remain under `docs/community-improvements/` and implementation code remains isolated under `src/motion-arsenal/community/` and `server/community/`.
