// Fictional answer-page content for the prototype. No AI, live reporting or external publisher attribution is claimed.
const ANSWER_TOPICS = [
  {
    "keys": [
      "gatorade",
      "hydrat",
      "electrolyte"
    ],
    "name": "Everyday hydration",
    "intro": "The next chapter of hydration could be less about a single sports drink and more about fitting different moments of the day. In this fictional outlook, brands compete on familiar flavors, simpler formats and a clear reason to choose one option over another.",
    "shift": "From a workout purchase to an everyday ritual",
    "body": "Imagine a commuter choosing a small refill pack, a weekend player buying a familiar bottle and a family keeping a concentrate at home. The product changes shape around the routine. For a brand like Gatorade, the opportunity in this scenario is to make those choices feel connected without making every drink sound like a performance product.",
    "why": "People are navigating more beverage formats and more claims at the same time. A useful next step for brands is a simpler explanation of what a product is, what it contains and when it fits. Clear shelf labels and easy-to-compare packs become part of the experience.",
    "audience": "This imagined shift is for shoppers who want a convenient daily choice and retailers looking for a shelf that is easier to understand. It rewards products with a distinct role rather than a long list of promises.",
    "watch": [
      "Refill and concentrate formats designed for small kitchens and bags.",
      "Flavor-led ranges that explain ingredients in plain language.",
      "Clearer boundaries between everyday refreshment and products made for sport."
    ],
    "related": [
      "How could refill formats change the hydration aisle?",
      "What’s next for hydration after 40?",
      "What are new wellness trends?"
    ]
  },
  {
    "keys": [
      "hotel",
      "travel",
      "amenit"
    ],
    "name": "The next hotel stay",
    "intro": "In this fictional vision, the hotel room becomes a more thoughtful place to reset. Quiet corners, adaptable lighting and small local experiences matter as much as a longer list of amenities.",
    "shift": "From more extras to a more personal stay",
    "body": "Picture a hotel that asks how a guest wants to spend an evening, then offers a quiet room setting, a neighborhood walk or a shared supper. The service is built around preferences rather than a universal definition of luxury. A useful amenity helps a guest feel at home quickly.",
    "why": "A crowded itinerary can make a trip feel like another task list. This scenario imagines hotels responding with simpler choices and clearer descriptions, giving visitors more control over noise, pace and social time.",
    "audience": "It is a concept for travelers who value comfort and autonomy, and for hotel teams that want memorable details without turning every stay into an intensive program.",
    "watch": [
      "Room controls that guests can understand without downloading another app.",
      "Optional small-group activities led by local hosts.",
      "Quiet spaces and clear descriptions of what a room actually includes."
    ],
    "related": [
      "How could hotels make quiet rooms easier to book?",
      "Why are shared supper clubs becoming popular?",
      "What’s next for sleep tech?"
    ]
  },
  {
    "keys": [
      "health tech",
      "healthtech",
      "wearable",
      "ring"
    ],
    "name": "More useful health technology",
    "intro": "This fictional outlook imagines health technology becoming quieter and easier to understand. A smaller number of useful signals replaces the feeling of constantly checking another dashboard.",
    "shift": "From more data to a clearer next step",
    "body": "A wearable might offer a short weekly summary instead of a stream of alerts. A companion app could explain what it measures, what it does not know and which settings the wearer controls. The value of the design comes from clarity, not a bigger score.",
    "why": "When every device competes for attention, a product that respects a person’s time can feel different. In this scenario, simple language and meaningful privacy choices become central parts of the experience.",
    "audience": "The concept suits people who want to reflect on their routines without treating a consumer device as a diagnosis. It also gives designers a reason to make uncertainty and data controls easier to find.",
    "watch": [
      "Weekly summaries with fewer competing charts.",
      "Useful controls for sharing, deleting and exporting personal data.",
      "Products that explain the limits of their readings as clearly as their features."
    ],
    "related": [
      "What could smart rings do beyond tracking sleep?",
      "How might wearable apps become less distracting?",
      "What are new wellness trends?"
    ]
  },
  {
    "keys": [
      "sleep",
      "wind-down",
      "wind down"
    ],
    "name": "A simpler evening routine",
    "intro": "In this fictional future, sleep technology blends into the room instead of adding another screen. The focus is an easier transition into the evening, with familiar controls and fewer interruptions.",
    "shift": "From another gadget to a coordinated environment",
    "body": "Imagine a bedside control that gently adjusts lighting, starts a chosen sound and silences nonessential notifications. Each feature works on its own, and the person using it chooses which parts to keep. The experience feels like a routine rather than a score to improve.",
    "why": "Many evening products ask people to learn a new app at the end of a long day. This scenario explores the opposite: a short setup, obvious settings and an easy way to switch everything off.",
    "audience": "It is a design idea for people who enjoy a consistent evening rhythm and want their devices to require less attention. It makes no promise about treating sleep problems or changing health outcomes.",
    "watch": [
      "Simple physical controls alongside optional app settings.",
      "Audio products that fit comfortably into a bedroom.",
      "Evening modes that work across lights, speakers and notifications."
    ],
    "related": [
      "How might bedrooms become less screen-focused?",
      "What could smart rings do beyond tracking sleep?",
      "How are homes getting smarter?"
    ]
  },
  {
    "keys": [
      "run club",
      "running",
      "club",
      "supper",
      "social"
    ],
    "name": "Community through a shared routine",
    "intro": "In this fictional scenario, the most appealing social invitation is a repeatable activity with a welcoming host. A run, a walk or a neighborhood supper gives people an easy reason to show up again.",
    "shift": "From one big event to a familiar weekly ritual",
    "body": "Picture a club that makes its meeting point, pace and after-event plans easy to understand. Newcomers know what to expect before they arrive. The shared activity creates a starting point for conversation without demanding instant friendship.",
    "why": "A predictable format lowers the effort of making a plan. This outlook imagines organizers spending as much time on the welcome as on the activity, with optional ways to join and no pressure to be the fastest or most outgoing person in the group.",
    "audience": "The idea is for people looking for a regular local plan, neighborhood hosts and small businesses that can offer a comfortable place to gather afterward.",
    "watch": [
      "Clear first-timer information and optional social time.",
      "More ways to join the same event at different paces.",
      "Recurring collaborations between clubs and local cafés or venues."
    ],
    "related": [
      "How could neighborhood supper clubs grow?",
      "Why are run clubs growing?",
      "How might stores become community gathering places?"
    ]
  },
  {
    "keys": [
      "ai",
      "shopping",
      "retail",
      "store"
    ],
    "name": "Shopping with a little more help",
    "intro": "This fictional outlook imagines shopping assistants becoming useful organizers rather than endless recommendation feeds. The better experience helps a person compare a few clear choices and understand the trade-offs.",
    "shift": "From a long product list to a manageable shortlist",
    "body": "Imagine an assistant that starts with budget, delivery timing and the person’s actual preferences. It checks whether an item fits the request, then explains a small set of options. A nearby store can still play a role when someone wants to see or collect an item in person.",
    "why": "More suggestions do not always make a decision easier. In this scenario, retailers compete on useful details such as stock information, total cost and return terms, while shoppers stay in control of the final purchase.",
    "audience": "The concept works for busy shoppers, gift buyers and retailers that can make practical information easier to compare. It does not assume that an automated recommendation is always correct.",
    "watch": [
      "Shortlists that show why each item was included.",
      "Clear confirmation of price, availability and delivery terms.",
      "Connections between online planning and local store experiences."
    ],
    "related": [
      "How will AI change shopping?",
      "How might stores become community gathering places?",
      "What could make gift recommendations more useful?"
    ]
  },
  {
    "keys": [
      "home",
      "house",
      "energy",
      "smart"
    ],
    "name": "A home that responds to everyday life",
    "intro": "In this fictional vision, a smarter home starts with comfort and understandable controls. Useful changes solve an everyday irritation before adding another layer of automation.",
    "shift": "From isolated devices to a more comfortable room",
    "body": "Picture someone starting with a room that gets too warm in the afternoon. Shading, a simpler thermostat schedule and clear energy information work together. The person can still make a manual choice, and the home explains what it is doing.",
    "why": "A product that works well in a demonstration can become confusing when several devices are combined. This scenario favors systems that are easy to set up, easy to pause and useful even when an internet connection is unavailable.",
    "audience": "It is an idea for households that value comfort and predictability, and for product teams looking to make connected features more approachable.",
    "watch": [
      "Simple room-level controls rather than competing apps.",
      "Clear descriptions of automation and manual overrides.",
      "Comfort-focused renovations considered alongside decorative upgrades."
    ],
    "related": [
      "How could comfort upgrades change home renovation?",
      "How might bedrooms become less screen-focused?",
      "What makes a smart-home product easier to live with?"
    ]
  },
  {
    "keys": [
      "beauty",
      "skin",
      "cosmetic"
    ],
    "name": "Beauty with a clearer promise",
    "intro": "This fictional outlook explores a beauty shelf with fewer competing promises and more understandable routines. Brands make room for questions about texture, use and personal preference instead of presenting every launch as a complete reinvention.",
    "shift": "From a crowded routine to a more considered choice",
    "body": "Imagine a shopper comparing a small range with clear instructions and consistent packaging. They can see what each product is designed to do and how it fits with the rest of the range. The experience is built around confidence and simplicity.",
    "why": "When many products use similar language, a clear explanation can become part of the product’s appeal. This scenario imagines brands prioritizing practical information and a recognizable point of view over a growing stack of claims.",
    "audience": "The idea is for shoppers who want an easier routine and for brands that can communicate without promising a universal result. It is an editorial concept, not skin-care or medical advice.",
    "watch": [
      "Clearer product roles and instructions.",
      "Packaging that makes it easier to compare a small range.",
      "More straightforward language around long-term routines."
    ],
    "related": [
      "Where is beauty heading next?",
      "How could beauty routines become simpler?",
      "What are new wellness trends?"
    ]
  },
  {
    "keys": [
      "wellness",
      "wellbeing",
      "well-being",
      "ritual"
    ],
    "name": "Wellness that fits an ordinary day",
    "intro": "This fictional outlook imagines wellness becoming less elaborate and more repeatable. Small, flexible rituals take the place of routines that require a new product for every moment.",
    "shift": "From a complete lifestyle overhaul to a useful small habit",
    "body": "Picture an evening walk, a short break from screens or a regular shared meal. The point of the concept is that people can choose a routine that fits their own schedule. Brands and venues support the ritual without making participation feel like another obligation.",
    "why": "An appealing idea is easier to try when the commitment is clear. This scenario imagines experiences that explain the time, cost and equipment involved, with an obvious way to adapt or opt out.",
    "audience": "The concept is for people who value familiar routines and social connection, and for designers who want to make an experience feel welcoming. It offers no health claims or treatment recommendations.",
    "watch": [
      "Smaller, easier-to-understand experience formats.",
      "Products that support an existing routine rather than creating a new task.",
      "Optional social elements and welcoming first-time experiences."
    ],
    "related": [
      "What’s next for sleep tech?",
      "Why are run clubs growing?",
      "What’s the future of hotel amenities?"
    ]
  }
];
const ANSWER_STORIES = [
  {
    "href": "trend-smart-ring-sleep.html",
    "image": "assets/feed/trend-08.png",
    "title": "Smart rings and a more considered evening routine",
    "copy": "A sample story exploring devices, habits and everyday choices."
  },
  {
    "href": "trend-sober-socials.html",
    "image": "assets/feed/trend-02.png",
    "title": "A new generation of shared social rituals",
    "copy": "An illustrative look at how familiar activities can bring people together."
  },
  {
    "href": "trend-everyday-protein.html",
    "image": "assets/feed/trend-10.png",
    "title": "How everyday products find a clearer role",
    "copy": "A fictional consumer story about formats, routines and a useful promise."
  },
  {
    "href": "trend-home-energy.html",
    "image": "assets/feed/trend-11.png",
    "title": "Comfort becomes part of the smart-home conversation",
    "copy": "A prototype article about approachable choices in the spaces we live in."
  }
];
(() => {
  const thread = document.getElementById('answer-thread');
  const form = document.querySelector('.answer-followup');
  const input = form.querySelector('input');
  const announcement = document.querySelector('.answer-announcement');
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const answerUrl = question => `answers.html?q=${encodeURIComponent(question)}`;
  let initialQuestion = clean(new URLSearchParams(location.search).get('q'));
  let questions = initialQuestion ? [initialQuestion] : [];
  const storageKey = () => `answer-thread:${initialQuestion}`;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey()));
    if (initialQuestion && Array.isArray(saved) && saved[0] === initialQuestion) questions = saved.map(clean).filter(Boolean).slice(-6);
  } catch {}
  const thumb = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10H3v11h4m0-11 5-8c2 0 2 2 1 5l-1 3h7c2 0 2 1 2 2l-2 8c0 1-1 1-2 1H7Z"/></svg>';
  const fallback = question => ({
    name: 'An everyday shift to watch',
    intro: `The question “${question}” opens up a useful fictional scenario: people choosing products and experiences that fit their real routines, with clearer information and fewer unnecessary steps.`,
    shift: 'From more options to a more useful experience',
    body: 'Imagine a familiar activity becoming easier to plan, compare or share. A product or service earns a place in someone’s day by solving a clear problem. This outlook explores the small design choices that could make that change feel natural.',
    why: 'A large promise can attract attention, but a useful detail gives someone a reason to return. In this fictional future, clear pricing, familiar controls and a welcoming first experience help an idea become a habit.',
    audience: 'This concept is for curious readers, product teams and local hosts looking for a practical way to explore a new idea. It is an illustrative editorial response rather than a report about actual events.',
    watch: ['A clear explanation of what is changing and who it helps.','Simple ways to try an idea without a large commitment.','Products and experiences that respect a person’s time and choices.'],
    related: ['What are new wellness trends?','How will AI change shopping?','How are homes getting smarter?'],
  });
  const topicFor = question => ANSWER_TOPICS.find(topic => topic.keys.some(key => question.toLowerCase().includes(key))) || fallback(question);
  function response(question, index) {
    const topic = topicFor(question);
    const heading = index === 0 ? 'h1' : 'h2';
    const sectionHeading = index === 0 ? 'h2' : 'h3';
    const sourcesId = `answer-sources-${index}`;
    const cite = `<a class="answer-citation" href="#${sourcesId}" aria-label="View illustrative sources for this answer">Trend Hunter +3 ↗</a>`;
    return `<article class="answer-response" id="answer-${index}" data-answer-index="${index}">
      <${heading} class="answer-question" tabindex="-1">${escape(question)}</${heading}>
      <div class="answer-source-mix" aria-label="Illustrative source mix, not measured attribution"><span>49% Trend Hunter</span><span>23% Future Living</span><span>20% Consumer Notes</span><span>8% Other</span></div>
      <div class="answer-copy"><p>${escape(topic.intro)}</p>${cite}
        <section class="answer-section"><${sectionHeading}>The shift: ${escape(topic.shift)}</${sectionHeading}><p>${escape(topic.body)}</p>${cite}</section>
        <section class="answer-section"><${sectionHeading}>Why it matters now</${sectionHeading}><p>${escape(topic.why)}</p>${cite}</section>
        <section class="answer-section"><${sectionHeading}>Who it’s for</${sectionHeading}><p>${escape(topic.audience)}</p>${cite}</section>
        <section class="answer-section"><${sectionHeading}>What to watch next</${sectionHeading}><ul>${topic.watch.map(item => `<li>${escape(item)}</li>`).join('')}</ul>${cite}</section>
      </div>
      <p class="answer-demo">Fictional example for this prototype. Source labels and percentages are illustrative.</p>
      <div class="answer-feedback-row"><button class="answer-icon-button" type="button" data-answer-feedback="up" aria-label="Helpful answer" aria-pressed="false">${thumb}</button><button class="answer-icon-button" type="button" data-answer-feedback="down" aria-label="Unhelpful answer" aria-pressed="false"><span style="display:block;transform:rotate(180deg)">${thumb}</span></button><button class="answer-outline-button answer-share" type="button" data-answer-share aria-haspopup="menu" aria-expanded="false" data-share-title="${escape(question)}" data-share-url="${escape(answerUrl(question))}"><span class="answer-share-icon" aria-hidden="true"></span>Share</button></div>
      <section class="answer-sources" id="${sourcesId}" aria-label="Illustrative source stories"><div class="answer-sources-header"><${sectionHeading}>Explore the stories</${sectionHeading}><div class="answer-source-controls"><button class="answer-outline-button" type="button" data-source-scroll="-1" aria-label="Previous sources">←</button><button class="answer-outline-button" type="button" data-source-scroll="1" aria-label="Next sources">→</button></div></div><div class="answer-source-track" tabindex="0" aria-label="Related prototype stories. Scroll to browse.">${ANSWER_STORIES.map(story => `<a class="answer-source-card" href="${story.href}"><div><span class="answers-sparkle" aria-hidden="true"></span>Trend Hunter · Demo</div><strong>${story.title}</strong><p><img src="${story.image}" alt="" loading="lazy">${story.copy}</p></a>`).join('')}</div></section>
      <section class="answer-related"><${sectionHeading}>Related questions</${sectionHeading}>${topic.related.map(q => `<a href="${answerUrl(q)}">${escape(q)}</a>`).join('')}</section>
    </article>`;
  }
  function render() {
    thread.innerHTML = questions.length ? questions.map(response).join('') : '<section class="answer-empty"><h1 class="answer-question">What’s on your mind?</h1><p>Ask Trend Hunter about what’s next.</p></section>';
    document.title = questions.length ? `${questions[0]} — Trend Hunter Answers` : 'Trend Hunter Answers';
    input.placeholder = questions.length ? 'Ask a follow-up...' : 'Ask Trend Hunter...';
    form.setAttribute('aria-label', questions.length ? 'Ask a follow-up' : 'Ask a question');
    form.querySelector('label').textContent = questions.length ? 'Ask a follow-up' : 'Ask Trend Hunter';
    form.querySelector('button').setAttribute('aria-label', questions.length ? 'Submit follow-up' : 'Submit question');
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = clean(input.value);
    if (!question) { input.focus(); return; }
    if (!questions.length) {
      initialQuestion = question;
      history.replaceState({}, '', answerUrl(question));
    }
    if (questions.length >= 6) {
      announcement.textContent = 'Start a new thread to ask more questions.';
      return;
    }
    questions.push(question);
    try { sessionStorage.setItem(storageKey(), JSON.stringify(questions)); } catch {}
    render();
    input.value = '';
    const heading = thread.querySelector(`#answer-${questions.length - 1} .answer-question`);
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    announcement.textContent = 'Your example answer is ready.';
  });
  thread.addEventListener('click', event => {
    const feedback = event.target.closest('[data-answer-feedback]');
    if (feedback) {
      const selected = feedback.getAttribute('aria-pressed') !== 'true';
      feedback.closest('.answer-feedback-row').querySelectorAll('[data-answer-feedback]').forEach(button => button.setAttribute('aria-pressed', String(button === feedback && selected)));
      announcement.textContent = selected ? 'Thanks for your feedback.' : 'Feedback cleared.';
    }
    const scroll = event.target.closest('[data-source-scroll]');
    if (scroll) {
      const track = scroll.closest('.answer-sources').querySelector('.answer-source-track');
      track.scrollBy({ left: Number(scroll.dataset.sourceScroll) * track.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  });
  document.querySelector('[data-new-thread]').addEventListener('click', () => {
    try { sessionStorage.removeItem(storageKey()); } catch {}
    questions = [];
    initialQuestion = '';
    history.pushState({}, '', 'answers.html');
    render();
    input.value = '';
    input.focus();
    window.scrollTo({ top: 0 });
  });
  render();
})();
