import { readFileSync } from 'node:fs';

const shell = readFileSync('src/motion-arsenal/components/ArsenalShell.tsx', 'utf8');
const styles = readFileSync('src/styles/arsenal-v3.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

const checks = [
  ['signature filter replaces redundant mode filter', shell.includes("{ id: 'signature', label: 'SIGNATURE' }") && !shell.includes("{ id: 'nox-adapted'")],
  ['explorer state initializes from URL search params', shell.includes("readSearchParams().get('q')") && shell.includes("readSearchParams().get('category')")],
  ['explorer state persists to the current URL', shell.includes("window.history.replaceState") && shell.includes("url.searchParams.set('favorites', '1')")],
  ['mobile category drawer is accessible', shell.includes('aria-controls="arsenal-sidebar"') && shell.includes('aria-expanded={sidebarOpen}')],
  ['mobile drawer locks background scrolling and supports Escape', shell.includes("document.body.style.overflow = 'hidden'") && shell.includes("event.key === 'Escape'")],
  ['v3 stylesheet is loaded after global styles', main.indexOf("'./styles/arsenal-v3.css'") > main.indexOf("'./styles/global.css'")],
  ['mobile sidebar overrides the legacy static layout', styles.includes('.arsenal-v3-shell .sidebar') && styles.includes('position: fixed !important')],
  ['reduced motion disables drawer transition', styles.includes('@media (prefers-reduced-motion: reduce)') && styles.includes('transition: none')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) {
  console.log(`${passed ? '✓' : '✗'} ${label}`);
}

if (failed.length) {
  console.error(`\n${failed.length} Arsenal v3 contract check(s) failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} Arsenal v3 contract checks passed.`);
