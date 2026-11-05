import { readFile, writeFile } from 'node:fs/promises';
import { RESULT_CATALOG } from '../site/prediction-result-state.js';
import { OUTCOME_ARTICLES } from '../site/prediction-outcome-articles.js';
import { escapeText as esc } from '../site/story-card.js';
import { resolvedPredictionRow } from '../site/prediction-result-card.js';

// Reuse each original story's complete page shell and panels. Keeping the article
// in the initial HTML also lets normal comments, shopping and Answers initialize.
for (const record of RESULT_CATALOG) {
  const article = OUTCOME_ARTICLES[record.id];
  const template = await readFile(new URL(`../site/${record.storyHref}`, import.meta.url), 'utf8');
  const markup = `<article class="article" data-prediction-analysis="${record.id}">
    <header class="article-masthead">
      <a class="article-collection" href="${article.collectionHref}">${esc(article.collection)}</a>
      <h1 class="masthead-title">${esc(article.title)}</h1>
      <div class="article-meta"><div class="article-byline-group"><p class="contributor-byline"><a class="avatar avatar--contributor" href="contributor-${article.authorSlug}.html" aria-label="View ${esc(article.author)}’s profile"><img src="${article.authorImage}" alt="" width="24" height="24"></a><span class="contributor-credit"><span class="contributor-by">By</span><span class="contributor-name">${esc(article.author)}</span></span></p></div><div class="article-actions"><button class="bookmark-button" type="button" aria-label="Bookmark" aria-pressed="false" data-story="prediction-analysis-${record.id}" data-title="${esc(article.title)}" data-image="${article.image}" data-href="${record.articleHref}"><span class="bookmark-icon" aria-hidden="true"></span></button><button class="article-share" type="button" aria-label="Share analysis" data-share-title="${esc(article.title)}"><span class="article-share-icon" aria-hidden="true"></span></button></div></div>
    </header>
    <p class="prediction-outcome-source">Fictional prediction follow-up · November 4, 2026</p>
    <figure class="body-image"><img src="${article.image}" alt="${esc(article.imageAlt)}"><figcaption class="caption-credit">Illustrative image · Invented editorial example</figcaption></figure>
    <div class="article-body"><p>${esc(article.intro)}</p><h2>The original prediction</h2><figure class="body-quote"><blockquote><p>${esc(record.text)}</p></blockquote><figcaption>Editorial outcome in this fictional example: ${record.outcome.toUpperCase()}</figcaption></figure>${article.sections.map(section=>`<h2>${esc(section.heading)}</h2>${section.paragraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}`).join('')}<p>This article and its outcome are made up for the prototype. They do not describe verified reporting or real-world results.</p></div>
  </article>`;
  if (!/<article class="article">[\s\S]*?<\/article>/.test(template)) throw new Error(`Missing article in ${record.storyHref}`);
  const page = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(article.title)} · Trend Hunter</title>`)
    .replace(/<article class="article">[\s\S]*?<\/article>/, markup)
    .replace(/(<section class="context-card"[^>]*>[\s\S]*?<p>)[\s\S]*?(<\/p>)/, `$1${esc(article.intro)}$2`);
  await writeFile(new URL(`../site/${record.articleHref}`, import.meta.url), page);
}
console.log(`Built ${RESULT_CATALOG.length} full prediction analysis pages`);

const exampleCalls = ['in', 'out', 'in'];
await writeFile(new URL('./components/prediction-resolved-results.html', import.meta.url), `<article class="ds-panel ds-component" id="prediction-resolved-results"><h3>Resolved prediction rows</h3><p>Your Profile → Predictions → Resolved uses a compact headline, outlined 10px call panels and an underlined Read our analysis link. The link sits to the right of both panels, vertically centered with a 24px gap, and wraps below when the row is too narrow. The sharp SVG check is 17 × 12px and the SVG cross is 14 × 14px, matching vote controls and popup results. Your In call is lime; Your Out call is red. Verified outcomes have a 18.36px lime circle with a black check and primary text. Matching 24px value rows align the call and outcome labels. Rows are separated by the existing 1px divider, with 24px gaps between content groups. The actual outcome records persist after being read.</p><ol class="prediction-results-list">${RESULT_CATALOG.map((result,index)=>resolvedPredictionRow({...result,call:exampleCalls[index],articleHref:'../'+result.articleHref})).join('')}</ol></article>`);
