import { cp, mkdir, readFile, readdir, rm, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const outputRoot = path.join(projectRoot, 'dist');

export async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name))
    : [path.join(directory, entry.name)]));
  return files.flat();
}

export async function build() {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await cp(path.join(projectRoot, 'site'), outputRoot, {
    recursive: true,
    filter: file => !/(?:^|\/)(?:\.DS_Store|node_modules|\.git)$|\.(?:orig|rej)$/.test(file),
  });
  await copyFile(path.join(outputRoot, 'feed.html'), path.join(outputRoot, 'index.html'));
  await cp(path.join(projectRoot, 'access'), outputRoot, { recursive: true });
  const htmlFiles = (await filesIn(outputRoot)).filter(file => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const relativeRoot = path.relative(path.dirname(file), outputRoot).split(path.sep).join('/');
    const prefix = relativeRoot ? `${relativeRoot}/` : '';
    const original = await readFile(file, 'utf8');
    const guarded = original
      .replace(/<html\b/i, '<html data-demo-locked')
      .replace(/<\/head>/i, `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="${prefix}demo-access.css"><script src="${prefix}demo-access.js"></script></head>`)
      .replace(/(<body\b[^>]*>)/i, '$1<noscript class="demo-access-noscript">Enable JavaScript to enter the demo password.</noscript>');
    await writeFile(file, guarded);
  }
  await writeFile(path.join(outputRoot, '.nojekyll'), '');
  console.log(`Built ${htmlFiles.length} password-gated pages in dist/`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
