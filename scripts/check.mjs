import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build, filesIn, outputRoot, projectRoot } from './build.mjs';

await build();
const failures = [];
const shareAudit = spawnSync(process.execPath, ['--test', path.join(projectRoot, 'scripts/system-share.test.mjs')], { encoding: 'utf8' });
if (shareAudit.status !== 0) failures.push(shareAudit.stdout + shareAudit.stderr);
else console.log('Native sharing routing, cancellation and fallback passed');
const arrivalAudit = spawnSync(process.execPath, ['--test', path.join(projectRoot, 'scripts/prediction-arrival.test.mjs')], { encoding: 'utf8' });
if (arrivalAudit.status !== 0) failures.push(arrivalAudit.stdout + arrivalAudit.stderr);
else console.log('Read More arrival matching, deck order and reload coverage passed');
const followAudit = spawnSync(process.execPath, ['--test', path.join(projectRoot, 'scripts/collection-follow.test.mjs')], { encoding: 'utf8' });
if (followAudit.status !== 0) failures.push(followAudit.stdout + followAudit.stderr);
else console.log('Collection follow persistence, empty state data and recommendations passed');
const personalizationAudit = spawnSync(process.execPath, ['--test', path.join(projectRoot, 'scripts/feed-personalization.test.mjs')], { encoding: 'utf8' });
if (personalizationAudit.status !== 0) failures.push(personalizationAudit.stdout + personalizationAudit.stderr);
else console.log('Feed interest ranking, module cadence and preference persistence passed');
for (const test of ['feed-views', 'people-follow', 'badges', 'badge-dialog-motion', 'comments', 'prediction-results', 'onboarding', 'account-setup', 'collection-momentum']) {
  const audit = spawnSync(process.execPath, ['--test', path.join(projectRoot, `scripts/${test}.test.mjs`)], { encoding: 'utf8' });
  if (audit.status !== 0) failures.push(audit.stdout + audit.stderr);
  else console.log(`${test} behavior passed`);
}
const inventoryAudit = spawnSync('python3', [path.join(projectRoot, 'scripts/audit-design-system.py')], { encoding: 'utf8' });
if (inventoryAudit.status !== 0) failures.push(inventoryAudit.stderr || 'Design-system inventory audit failed');
else console.log(inventoryAudit.stdout.trim());
for (const file of await filesIn(outputRoot)) {
  if (file.endsWith('.js')) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) failures.push(result.stderr);
  }
  if (!file.endsWith('.html')) continue;
  const html = await readFile(file, 'utf8');
  if (!/<html\b[^>]*data-demo-locked/.test(html) || !/src="(?:\.\.\/)*demo-access\.js"/.test(html)) {
    failures.push(`Missing demo gate: ${path.relative(projectRoot, file)}`);
  }
  for (const [, reference] of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue;
    const pathname = decodeURIComponent(reference.split(/[?#]/)[0]);
    if (!pathname) continue;
    const target = path.resolve(path.dirname(file), pathname);
    if (!target.startsWith(outputRoot + path.sep)) {
      failures.push(`Reference outside website: ${path.relative(outputRoot, file)} → ${reference}`);
      continue;
    }
    try { await access(target); }
    catch { failures.push(`Missing file: ${path.relative(outputRoot, file)} → ${reference}`); }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('JavaScript, page references and password-gate coverage passed');
