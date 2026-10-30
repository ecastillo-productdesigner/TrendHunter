import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build, filesIn, outputRoot, projectRoot } from './build.mjs';

await build();
const failures = [];
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
