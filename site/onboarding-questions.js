// Hypothetical prototype questions and answers based on the supplied topic list.
// Related collection slugs refer only to real destinations in the existing prototype.
export const ONBOARDING_QUESTION_GROUPS = [
  { id: 'mind-body', label: 'Mind & Body', questions: [
    { id: 'midlife-wellbeing', name: 'Andropause & Hormonal Midlife', topics: ['wellness'], interests: ['andropause-hormonal-midlife'], related: ['andropause-hormonal-midlife', 'longevity'], question: 'What would you most like to understand about midlife wellbeing?', options: [
      ['energy', 'Energy & motivation', ['andropause-hormonal-midlife', 'metabolic-life']],
      ['sleep', 'Sleep & recovery', ['andropause-hormonal-midlife', 'sleep-medicine']],
      ['focus', 'Mood & focus', ['andropause-hormonal-midlife', 'modern-anxiety-care']],
      ['active', 'Staying active', ['andropause-hormonal-midlife', 'fitness-reset']],
    ] },
    { id: 'preventative-health', name: 'Preventative Health', topics: ['fitness', 'beauty'], interests: ['preventive-health', 'health-technology', 'fitness-reset'], related: ['preventive-health', 'health-technology'], question: 'What would help you feel more on top of your wellbeing?', options: [
      ['habits', 'Everyday habits', ['preventive-health', 'longevity']],
      ['technology', 'Useful health tech', ['preventive-health', 'health-technology']],
      ['checkups', 'Questions for checkups', ['preventive-health', 'andropause-hormonal-midlife']],
      ['recovery', 'Sleep & recovery', ['preventive-health', 'sleep-medicine']],
    ] },
    { id: 'family-wellbeing', name: 'Mind & Body for Families', topics: ['family-parenting'], interests: ['mind-body-for-families', 'back-to-school-transitions'], related: ['mind-body-for-families', 'back-to-school-transitions'], question: 'Which part of family life could use a little more ease?', options: [
      ['mornings', 'Calmer mornings', ['mind-body-for-families', 'back-to-school-transitions']],
      ['bedtime', 'Better sleep routines', ['mind-body-for-families', 'sleep-medicine']],
      ['outdoors', 'More time outdoors', ['mind-body-for-families', 'fitness-reset']],
      ['screens', 'Less screen time', ['mind-body-for-families', 'regulated-living']],
    ] },
  ] },
  { id: 'everyday-living', label: 'Everyday Living', questions: [
    { id: 'food-experiences', name: 'Food as an Experience', topics: ['food-drink', 'culture', 'travel'], interests: ['food-as-an-experience', 'protein-forward-eating'], related: ['food-as-an-experience', 'group-friend-events'], question: 'What makes a food experience worth trying?', options: [
      ['flavour', 'A new flavour', ['food-as-an-experience', 'modern-hydration-caffeine']],
      ['story', 'A great story', ['food-as-an-experience', 'retailtainment-hubs']],
      ['company', 'People to share it with', ['food-as-an-experience', 'group-friend-events']],
      ['surprise', 'Something unexpected', ['food-as-an-experience', 'adventure-active-travel']],
    ] },
    { id: 'getting-dressed', name: 'Getting Dressed as the Event', topics: ['beauty'], interests: ['evidence-based-beauty', 'beauty-from-within', 'retailtainment-hubs'], related: ['retailtainment-hubs', 'evidence-based-beauty'], question: 'What makes getting dressed feel like an event?', options: [
      ['expression', 'Showing my personality', ['retailtainment-hubs', 'evidence-based-beauty']],
      ['occasion', 'Having somewhere to go', ['group-friend-events', 'retailtainment-hubs']],
      ['discovery', 'Trying something new', ['retailtainment-hubs', 'beauty-from-within']],
      ['comfort', 'Feeling good in it', ['the-intuitive-body', 'everyday-living']],
    ] },
    { id: 'planning-ai', name: 'Planning With AI', topics: ['tech', 'home-living', 'family-parenting'], interests: ['ai-everyday-life', 'health-technology'], related: ['ai-everyday-life', 'smart-home-energy'], question: 'What would you most like AI to help you plan?', options: [
      ['week', 'My week', ['ai-everyday-life', 'everyday-living']],
      ['trip', 'My next trip', ['ai-everyday-life', 'adventure-active-travel']],
      ['meals', 'Meals & shopping', ['ai-everyday-life', 'food-as-an-experience']],
      ['project', 'A personal project', ['ai-everyday-life', 'smart-home-energy']],
    ] },
  ] },
  { id: 'experiences', label: 'Experiences', questions: [
    { id: 'budgeted-living', name: 'Budgeted Living', topics: ['travel', 'family-parenting'], interests: ['budgeted-living', 'everyday-living'], related: ['budgeted-living', 'everyday-living'], question: 'What makes a plan feel worth the money?', options: [
      ['memories', 'A memorable experience', ['budgeted-living', 'food-as-an-experience']],
      ['deal', 'Finding a good deal', ['budgeted-living', 'retailtainment-hubs']],
      ['quality', 'Quality that lasts', ['budgeted-living', 'tactile-home-design']],
      ['simple', 'Keeping it simple', ['budgeted-living', 'everyday-living']],
    ] },
    { id: 'sober-curious', name: 'Sober-Curious Living', topics: ['food-drink', 'culture', 'wellness'], interests: ['modern-hydration-caffeine', 'regulated-living', 'nervous-system-gym'], related: ['modern-hydration-caffeine', 'food-as-an-experience'], question: 'What sounds best about an alcohol-free plan?', options: [
      ['morning', 'Feeling fresh tomorrow', ['regulated-living', 'sleep-medicine']],
      ['drinks', 'Trying new drinks', ['modern-hydration-caffeine', 'food-as-an-experience']],
      ['night', 'A different kind of night', ['group-friend-events', 'food-as-an-experience']],
      ['recharge', 'More time to recharge', ['nervous-system-gym', 'regulated-living']],
    ] },
    { id: 'smart-home', name: 'Smart Home & Energy', topics: ['home-living', 'tech'], interests: ['smart-home-energy', 'tactile-home-design'], related: ['smart-home-energy', 'tactile-home-design'], question: 'What would you like your home to do better?', options: [
      ['energy', 'Use less energy', ['smart-home-energy', 'clean-living-control']],
      ['routines', 'Make routines easier', ['smart-home-energy', 'ai-everyday-life']],
      ['comfort', 'Feel more comfortable', ['smart-home-energy', 'tactile-home-design']],
      ['savings', 'Help me save money', ['smart-home-energy', 'budgeted-living']],
    ] },
  ] },
];
