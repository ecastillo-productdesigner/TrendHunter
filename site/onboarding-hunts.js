import { cleanDraft, onboardingCollections } from './onboarding-state.js?v=three-questions-9';
import { COLLECTION_STORIES } from './onboarding-data.js?v=three-questions-9';
import { answerUrl } from './onboarding-destinations.js';

// Curated prompts open the existing fictional Answers prototype; no live AI service is implied.
const pools = {
  sleep: ['What’s next for sleep tech?', 'How might bedrooms become less screen-focused?', 'How are evening wellness routines changing?', 'What could make sleep technology easier to use?'],
  travel: ['What’s next for adventure travel?', 'How are solo travel experiences changing?', 'What’s next for food tourism?', 'How could hotels make relaxation more personal?'],
  home: ['What’s next for smart home tech?', 'What’s trending in home decor?', 'How are homes getting smarter?', 'How could home design make daily routines easier?'],
  food: ['What’s next for food tourism?', 'How are everyday food rituals changing?', 'What’s next for hydration?', 'Why are shared supper clubs becoming popular?'],
  social: ['How are social plans changing?', 'Why are run clubs growing?', 'What’s next for shared supper clubs?', 'How might stores become community gathering places?'],
  tech: ['How is AI changing everyday routines?', 'What could make AI assistants more useful?', 'How will AI change shopping?', 'What’s next for smart home tech?'],
  beauty: ['What’s next for beauty routines?', 'How is health tech shaping skincare?', 'What are new wellness trends?', 'How are everyday beauty rituals changing?'],
  wellness: ['What are new wellness trends?', 'How is health tech evolving?', 'How are recovery rituals changing?', 'What’s next for everyday wellness routines?'],
  family: ['How are family wellbeing routines changing?', 'What could make family mornings easier?', 'How are families making more time for outdoor activities?', 'What’s next for screen-free family time?'],
  value: ['How are people making everyday budgets go further?', 'What makes an experience feel worth the money?', 'How are shoppers finding quality that lasts?', 'What’s next for affordable everyday upgrades?'],
};
const focusByCollection = {
  'andropause-hormonal-midlife': 'wellness', 'preventive-health': 'wellness',
  'mind-body-for-families': 'family', 'back-to-school-transitions': 'family',
  'budgeted-living': 'value', 'everyday-living': 'value',
  'sleep-medicine': 'sleep', 'regulated-living': 'sleep',
  'adventure-active-travel': 'travel', 'solo-travel': 'travel',
  'smart-home-energy': 'home', 'tactile-home-design': 'home',
  'food-as-an-experience': 'food', 'protein-forward-eating': 'food', 'modern-hydration-caffeine': 'food',
  'group-friend-events': 'social', 'retailtainment-hubs': 'social',
  'ai-everyday-life': 'tech', 'evidence-based-beauty': 'beauty', 'beauty-from-within': 'beauty',
  'biohackers-body': 'wellness', 'nervous-system-gym': 'wellness', 'wellness-maxxing': 'wellness',
  'the-intuitive-body': 'wellness', 'longevity': 'wellness', 'health-technology': 'wellness', 'fitness-reset': 'wellness',
};
function collectionQuestions(collection) {
  const slug = collection.href === 'collection.html' ? 'group-friend-events' : collection.href.slice(11, -5);
  const focus = focusByCollection[slug];
  return pools[focus] || [
    `What’s next for ${collection.name}?`,
    `What trends are shaping ${collection.name}?`,
    `How is ${collection.name} changing everyday life?`,
    `What should I watch in ${collection.name}?`,
  ];
}
export function onboardingHunts(draft) {
  const clean = cleanDraft(draft);
  const matches = onboardingCollections(clean.topics, clean.answers, clean.preferredCollections);
  let sources = matches.map(collectionQuestions);
  if (!sources.length) sources = [pools.wellness];
  const questions = [];
  for (let index = 0; index < 4; index++) {
    for (const source of sources) {
      if (source[index] && !questions.includes(source[index])) questions.push(source[index]);
      if (questions.length === 4) return questions.map(question => ({ question, href: answerUrl(question) }));
    }
  }
  return questions.map(question => ({ question, href: answerUrl(question) }));
}


export function onboardingArticles(draft) {
  const clean = cleanDraft(draft);
  const matches = onboardingCollections(clean.topics, clean.answers, clean.preferredCollections);
  const ordered = matches.map(collection => collection.href);
  const articles = [];
  // Take one story per matching collection before taking a second from any one collection.
  for (const href of ordered) {
    const story = COLLECTION_STORIES.find(story => story.collections.includes(href) && !articles.some(item => item.href === story.href));
    if (story) articles.push(story);
    if (articles.length === 2) return articles;
  }
  return articles;
}
