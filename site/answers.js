// Trend Hunter Answers: one instance moves between the desktop rail and the mobile feed.
(() => {
  const answersTemplate = `
    <h2 class="answers-heading" id="trend-answers-heading"><span class="answers-sparkle" aria-hidden="true"></span>Trend Hunter Answers</h2>
    <form class="answers-form" role="search">
      <label class="visually-hidden" for="trend-answers-input">Ask Trend Hunter</label>
      <span class="answers-sparkle answers-input-icon" aria-hidden="true"></span>
      <input class="answers-input" id="trend-answers-input" name="question" type="search" placeholder="Ask Trend Hunter..." autocomplete="off" required>
      <button class="answers-submit" type="submit" aria-label="Submit question"><span aria-hidden="true"></span></button>
    </form>
    <div class="answers-suggestions" aria-label="Suggested questions">
      <div class="answers-suggestion-row">
        <button class="answers-suggestion" type="button" data-question="What’s Gatorade’s future?"><span class="answers-sparkle" aria-hidden="true"></span>What’s Gatorade’s future?</button>
        <button class="answers-suggestion" type="button" data-question="What are new wellness trends?"><span class="answers-sparkle" aria-hidden="true"></span>What are new wellness trends?</button>
      </div>
      <div class="answers-suggestion-row">
        <button class="answers-suggestion" type="button" data-question="How is health tech evolving?"><span class="answers-sparkle" aria-hidden="true"></span>How is health tech evolving?</button>
        <button class="answers-suggestion" type="button" data-question="What’s next for hydration?"><span class="answers-sparkle" aria-hidden="true"></span>What’s next for hydration?</button>
      </div>
    </div>
    <div class="answers-mobile-suggestions" aria-label="Suggested questions">
<button class="answers-suggestion" type="button" data-question="What’s Gatorade’s future?"><span class="answers-sparkle" aria-hidden="true"></span>What’s Gatorade’s future?</button>
<button class="answers-suggestion" type="button" data-question="How is health tech evolving?"><span class="answers-sparkle" aria-hidden="true"></span>How is health tech evolving?</button>
<button class="answers-suggestion" type="button" data-question="What are new wellness trends?"><span class="answers-sparkle" aria-hidden="true"></span>What are new wellness trends?</button>
<button class="answers-suggestion" type="button" data-question="What’s next for hydration after 40?"><span class="answers-sparkle" aria-hidden="true"></span>What’s next for hydration after 40?</button>
<button class="answers-suggestion" type="button" data-question="How will AI change shopping?"><span class="answers-sparkle" aria-hidden="true"></span>How will AI change shopping?</button>
<button class="answers-suggestion" type="button" data-question="Why are run clubs growing?"><span class="answers-sparkle" aria-hidden="true"></span>Why are run clubs growing?</button>
<button class="answers-suggestion" type="button" data-question="What’s next for sleep tech?"><span class="answers-sparkle" aria-hidden="true"></span>What’s next for sleep tech?</button>
<button class="answers-suggestion" type="button" data-question="How are homes getting smarter?"><span class="answers-sparkle" aria-hidden="true"></span>How are homes getting smarter?</button>
<button class="answers-suggestion" type="button" data-question="Where is beauty heading next?"><span class="answers-sparkle" aria-hidden="true"></span>Where is beauty heading next?</button>
</div>
    <p class="answers-status" role="status" hidden></p>`;

  const productRecommendationsTemplate = `
    <h2 class="product-recommendations-heading" id="product-recommendations-heading">You might be interested in</h2>
    <ul class="product-card-grid" id="product-card-track" tabindex="0" aria-label="Products. Use left and right arrow keys to browse.">
      <li>
        <article class="product-card">
          <img class="product-card-image" src="assets/products/magnesium-mineral-butter.webp" width="887" height="1182" alt="Pantry Magnesium Mineral Butter jar and open tins" loading="lazy" decoding="async">
          <h3 class="product-card-title">Magnesium Mineral Butter | Deep Relaxation + Nourishment for Body + Mind</h3>
          <p class="product-card-price"><span>$15.99</span><span class="product-card-price-label">Shop Now</span><span class="product-card-external" aria-hidden="true"></span></p>
        </article>
      </li>
      <li>
        <article class="product-card">
          <img class="product-card-image" src="assets/products/turkey-crumbles.webp" width="1000" height="1000" alt="Farm to Pet Turkey Crumbles cat treats in an orange resealable bag" loading="lazy" decoding="async">
          <h3 class="product-card-title">Farm To Pet Turkey Crumbles for Cats | Grain-Free Cat Treats</h3>
          <p class="product-card-price"><span>$3.99</span><span class="product-card-price-label">Shop Now</span><span class="product-card-external" aria-hidden="true"></span></p>
        </article>
      </li>
      <li>
        <article class="product-card">
          <img class="product-card-image" src="assets/products/pantry-lip-balm.webp" width="825" height="1035" alt="Pantry natural lip balm tubes" loading="lazy" decoding="async">
          <h3 class="product-card-title">Pantry Handpoured Lip Balm | Natural Lip Care with SPF 15</h3>
          <p class="product-card-price"><span>$9.00</span><span class="product-card-price-label">Shop Now</span><span class="product-card-external" aria-hidden="true"></span></p>
        </article>
      </li>
      <li>
        <article class="product-card">
          <img class="product-card-image" src="assets/products/chicken-crumbles.webp" width="1000" height="1000" alt="Farm to Pet Chicken Crumbles cat treats in a blue resealable bag" loading="lazy" decoding="async">
          <h3 class="product-card-title">Farm To Pet Chicken Crumbles | Single-Ingredient Cat Treats</h3>
          <p class="product-card-price"><span>$11.95</span><span class="product-card-price-label">Shop Now</span><span class="product-card-external" aria-hidden="true"></span></p>
        </article>
      </li>
    </ul>`;

  function setupProductCarousel(section) {
    const track = section.querySelector('.product-card-grid');
    const step = () => track.children[1].offsetLeft - track.children[0].offsetLeft;
    const move = (direction) => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollBy({ left: direction * step() * 2, behavior: reduced ? 'auto' : 'smooth' });
    };
    track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
  }

  const rail = document.querySelector('.rail-right');
  const predictionPanel = document.querySelector('.predictions-panel');
  let liveAnswers = null;
  let mobileSlot = null;
  const article = document.querySelector('article.article');

  if (rail && predictionPanel) {
    liveAnswers = document.createElement('section');
    liveAnswers.className = 'side-panel trend-answers';
    liveAnswers.setAttribute('aria-labelledby', 'trend-answers-heading');
    liveAnswers.innerHTML = answersTemplate;
    const productRecommendations = article ? document.createElement('section') : null;
    if (productRecommendations) {
      productRecommendations.className = 'product-recommendations';
      productRecommendations.setAttribute('aria-labelledby', 'product-recommendations-heading');
      productRecommendations.innerHTML = productRecommendationsTemplate;
      setupProductCarousel(productRecommendations);
      productRecommendations.hidden = true;
      article.append(productRecommendations);
    }
    const feedAnchor = document.querySelector('.feed-trending-slot') || document.querySelector('.feed-explore-slot');
    if (feedAnchor) {
      liveAnswers.classList.add('trend-answers--feed');
      mobileSlot = document.createElement('li');
      mobileSlot.className = 'feed-answers-slot';
      const siblings = [...feedAnchor.parentElement.children];
      const stories = siblings.slice(siblings.indexOf(feedAnchor) + 1).filter((item) => item.querySelector(':scope > .trend-card'));
      (stories[2] || feedAnchor).after(mobileSlot);
    }

    const desktop = window.matchMedia('(min-width: 960px)');
    const wideDesktop = window.matchMedia('(min-width: 1344px)');
    const discovery = document.querySelector('.feed-discovery-rail');
    const leftRail = document.querySelector('.rail-left');

    const placeModules = () => {
      liveAnswers.classList.toggle('trend-answers--inline', !desktop.matches && !mobileSlot && Boolean(article));
      if (desktop.matches || (!mobileSlot && !article)) rail.prepend(liveAnswers);
      else if (mobileSlot) mobileSlot.append(liveAnswers);
      else article.append(liveAnswers);
      if (mobileSlot) mobileSlot.hidden = desktop.matches;
      if (productRecommendations) {
        productRecommendations.hidden = desktop.matches;
        if (!desktop.matches) liveAnswers.before(productRecommendations);
      }
      if (discovery && leftRail) {
        const home = desktop.matches && !wideDesktop.matches ? rail : leftRail;
        home.append(discovery);
      }
    };
    desktop.addEventListener('change', placeModules);
    wideDesktop.addEventListener('change', placeModules);
    placeModules();
  }

  document.querySelectorAll('.trend-answers').forEach((answers) => {
    const input = answers.querySelector('.answers-input');
    const status = answers.querySelector('.answers-status');
    answers.querySelectorAll('.answers-suggestion-row').forEach((row) => {
      const group = document.createElement('div');
      group.className = 'answers-suggestion-group';
      group.append(...row.children);
      const track = document.createElement('div');
      track.className = 'answers-suggestion-track';
      track.append(group);
      // Copies remain clickable, while only the original questions enter the tab order.
      for (let copy = 0; copy < 2; copy += 1) {
        const duplicate = group.cloneNode(true);
        duplicate.setAttribute('aria-hidden', 'true');
        duplicate.querySelectorAll('button').forEach((button) => { button.tabIndex = -1; });
        track.append(duplicate);
      }
      row.classList.add('is-ticker');
      row.append(track);
    });
    // Keep a clicked visual copy from taking focus before the click fills the input.
    answers.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.answers-suggestion-group[aria-hidden="true"]')) event.preventDefault();
    });
    answers.addEventListener('click', (event) => {
      const suggestion = event.target.closest('.answers-suggestion[data-question]');
      if (!suggestion) return;
      input.value = suggestion.dataset.question;
      status.hidden = true;
      input.focus();
    });
    answers.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      if (!input.value.trim()) { input.focus(); return; }
      status.textContent = 'Trend Hunter Answers is coming soon.';
      status.hidden = false;
    });
  });
})();
