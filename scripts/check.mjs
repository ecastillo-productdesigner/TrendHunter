import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build, filesIn, outputRoot, projectRoot } from './build.mjs';
import { COLLECTIONS, COLLECTION_STORIES } from '../site/onboarding-data.js';
import { articleUrl, FEED_URL, PROTOTYPE_BASE } from '../site/onboarding-destinations.js';

await build();
const failures = [];
const tests = spawnSync(process.execPath, ['--test', 'scripts/onboarding.test.mjs', 'scripts/account-setup.test.mjs'], { cwd: projectRoot, encoding: 'utf8' });
console.log(tests.stdout);
if (tests.status !== 0) failures.push(tests.stderr || 'Onboarding tests failed');
const files = await filesIn(outputRoot);
const pages = files.filter(file => file.endsWith('.html')).map(file => path.relative(outputRoot, file)).sort();
assert.deepEqual(pages, ['index.html', 'onboarding.html'], 'Only onboarding and its compatibility alias may be built');
async function checkReference(file, reference) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) return;
  const pathname = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!pathname) return;
  const target = path.resolve(path.dirname(file), pathname);
  if (!target.startsWith(outputRoot + path.sep)) { failures.push(`Reference outside website: ${reference}`); return; }
  try { await access(target); } catch { failures.push(`Missing file in ${path.relative(outputRoot, file)}: ${reference}`); }
}
for (const file of files) {
  if (!/\.(html|css|js)$/.test(file)) continue;
  const text = await readFile(file, 'utf8');
  if (file.endsWith('.js')) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) failures.push(result.stderr);
    for (const [, reference] of text.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) await checkReference(file, reference);
  }
  if (file.endsWith('.css')) for (const [, reference] of text.matchAll(/url\(['"]?([^)'"\s]+)/g)) await checkReference(file, reference);
  if (!file.endsWith('.html')) continue;
  if (!/<html\b[^>]*data-demo-locked/.test(text) || !/src="demo-access\.js"/.test(text)) failures.push('Missing demo gate');
  for (const [, reference] of text.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) await checkReference(file, reference);
}
const known = new Set(COLLECTIONS.map(collection => collection.href));
for (const story of COLLECTION_STORIES) {
  assert.ok(story.collections.every(href => known.has(href)), 'Article associations must use known collections');
  await checkReference(path.join(outputRoot, 'index.html'), story.image);
  const url = new URL(articleUrl(story.href));
  assert.ok(url.href.startsWith(PROTOTYPE_BASE) && /^trend(?:-[a-z0-9-]+)?\.html$/.test(story.href), 'Articles must exit to the existing main app');
}
assert.equal(FEED_URL, PROTOTYPE_BASE + 'feed.html#for-you');
const styles = await readFile(path.join(outputRoot, 'onboarding.css'), 'utf8');
const gateStyles = await readFile(path.join(outputRoot, 'demo-access.css'), 'utf8');
const defined = new Set([...styles.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
for (const [, name] of (styles + gateStyles).matchAll(/var\((--[\w-]+)/g)) if (!defined.has(name)) failures.push(`Undefined DS token: ${name}`);
if (failures.length) { console.error([...new Set(failures)].join('\n')); process.exitCode = 1; }
else console.log('Standalone page scope, JavaScript, imports, assets, DS tokens and demo gate passed');
