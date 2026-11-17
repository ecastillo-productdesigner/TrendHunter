import { cleanDraft, onboardingCollections, onboardingQuestion } from './onboarding-state.js?v=standalone-1';
import { COLLECTION_STORIES } from './onboarding-data.js';
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
  learning: ['What’s next for learning experiences?', 'How are reading clubs bringing people together?', 'How are people discovering their next good book?', 'What could make learning a more social experience?'],
};
const focusByCollection = {
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
  const question = onboardingQuestion(clean.topics);
  let sources;
  if (question?.id === 'say-yes' && clean.answers[question.id] === 'learning') sources = [pools.learning];
  else {
    const matches = onboardingCollections(clean.topics, clean.answers);
    const selected = matches.filter(collection => clean.collections.includes(collection.href));
    sources = (selected.length ? selected : matches).map(collectionQuestions);
  }
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
  const matches = onboardingCollections(clean.topics, clean.answers);
  const selected = matches.filter(collection => clean.collections.includes(collection.href));
  const ordered = [...new Set([...selected, ...matches].map(collection => collection.href))];
  const articles = [];
  for (const href of ordered) {
    for (const story of COLLECTION_STORIES) {
      if (story.collections.includes(href) && !articles.some(item => item.href === story.href)) articles.push(story);
      if (articles.length === 2) return articles;
    }
  }
  return articles;
}
