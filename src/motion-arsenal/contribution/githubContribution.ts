import type { EffectMeta } from '../types';

export const REPOSITORY_URL = 'https://github.com/Finitolombardo/nox-motion-arsenal';

const REQUIRED_TESTS = [
  'npm ci',
  'npm run lint',
  'npm run build',
  'npm test',
  'npm run test:previews:smoke',
];

export function buildGitHubContributionPrompt(effect: EffectMeta, ownedFiles: string[]): string {
  const controls = effect.props.length
    ? effect.props.map((control) => `- ${control.key} (${control.label}): ${control.type} (default: ${String(control.default)})`).join('\n')
    : '- No configurable controls are currently defined.';
  const dependencies = effect.dependencies.length
    ? effect.dependencies.map((dependency) => `- ${dependency}`).join('\n')
    : '- No effect-specific packages.';

  return `You are improving exactly one effect in the NOX Motion Arsenal.

Repository:
${REPOSITORY_URL}

Target effect:
${effect.id}

Effect name:
${effect.displayName ?? effect.name}

Owned files:
${ownedFiles.map((file) => `- ${file}`).join('\n')}

Current controls:
${controls}

Allowed dependencies:
${dependencies}

Task:
Improve the visual quality, motion quality, performance, responsiveness and configurability of this effect.

Rules:
- Modify only the listed effect-owned files unless strictly necessary.
- Do not modify authentication, deployment, CI, community APIs or unrelated effects.
- Preserve existing controls.
- Add useful controls where appropriate.
- Support mobile and prefers-reduced-motion.
- Do not add tracking, network requests, remote scripts or secrets.
- Avoid new dependencies unless clearly justified.

Required verification:
${REQUIRED_TESTS.map((command) => `- ${command}`).join('\n')}

Git workflow:
1. Fork or clone the repository.
2. Create branch:
   community/${effect.id}/<short-description>
3. Implement the improvement.
4. Add or update a focused test where useful.
5. Run all required verification commands.
6. Open a pull request against main.

Pull request must include:
- before/after explanation
- modified files
- new or changed controls
- performance impact
- mobile impact
- accessibility impact
- screenshots or video if possible
- all test results`;
}

export function effectIssueUrl(effect: EffectMeta): string {
  const params = new URLSearchParams({
    template: 'effect-improvement.yml',
    title: `[effect: ${effect.id}] `,
  });
  return `${REPOSITORY_URL}/issues/new?${params.toString()}`;
}

export function effectPullRequestUrl(): string {
  return `${REPOSITORY_URL}/compare/main...main?expand=1`;
}
