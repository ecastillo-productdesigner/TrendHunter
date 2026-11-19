# Standalone Trend Hunter onboarding

- This branch contains only onboarding: Mind & Body, Everyday Living, Experiences and Suggested Hunts. The first three pages each show one question with four answers; interests and collection selection pages have been removed. Keep feed, authentication, profiles, predictions, Answers and article screens in the separate main prototype.
- Editable plain HTML/CSS/JavaScript lives in `site/`. `index.html` is the entry; build also creates an `onboarding.html` compatibility alias.
- Reuse the existing DS tokens in `site/onboarding.css`: Barlow Condensed for display and Inter for body. Update `docs/onboarding-components.md` when shared behavior or styles change.
- Recommendation metadata and thumbnail assets support onboarding only. Destination URLs are centralized in `site/onboarding-destinations.js` and point to the existing public main app.
- Browser-local choices do not transfer across origins. Do not imply live authentication, AI, analytics or cross-origin personalization.
- Keep the browser-only demo gate in `access/`; build injects it into generated HTML. `dist/` is generated and ignored.
- Run `npm run check` and inspect relevant desktop/mobile behavior before pushing.
- The Onboarding workflow runs checks only. Do not deploy it over the main GitHub Pages site. Use GitHub Pages only if deployment is later explicitly requested; no ChatGPT Sites hosting.
