# Trend Hunter onboarding

The `Onboarding` branch is a standalone prototype. It starts at **Your interests** and contains only this journey:

1. **Your interests** — choose any of nine topics, or Skip
2. **About you** — answer one topic-matched question with at least four choices, or Skip
3. **Collections** — follow matching collections; at least four direct or related suggestions
4. **Suggested Hunts** — four questions, two article alternatives and a **Take me to the Feed** CTA

The logo resets the onboarding draft and returns to the beginning. Answers reuse the collection pill component with centered uppercase labels, rounded shapes, gray borders and a lime outline when selected, without a checkmark. Both support click-again deselection; answers allow one selection and collections allow several. Existing DS fonts, colors and spacing are preserved.

## Live preview

[Open the onboarding-only preview](https://ecastillo-productdesigner.github.io/TrendHunter-Onboarding/) (demo password: `demo`). Its generated files are hosted in a separate GitHub Pages repository, keeping the main prototype intact. Source stays on the `Onboarding` branch of `TrendHunter`.

## Run locally

Requires Node.js 24. No package installation is needed.

```sh
npm run dev
```

Open <http://127.0.0.1:4176/>. Enter the demo password `demo` if prompted. `PORT=3457 npm run dev` uses port 3457. The root URL and `/TrendHunter/onboarding.html#topics` both open onboarding.

```sh
npm run check
```

This builds the standalone site, tests matching/persistence/navigation, checks JavaScript and validates local page/import/image references.

## Scope and exits

There are no feed, sign-in, profile, prediction, Answers, collection-detail or article screens in this branch. Collection labels and article metadata/thumbnails exist only to support onboarding recommendations.

Hunts, articles and the feed CTA open the [existing main prototype](https://ecastillo-productdesigner.github.io/TrendHunter/). The feed CTA retains the eight-second setup transition before leaving. Choices are saved to this prototype's browser storage; a separately hosted origin **does not share those preferences** with the main site. This is a browser-only demo with no account backend or live AI.

`site/index.html` is the only source page. Build creates `dist/onboarding.html` as a compatibility alias for previously shared local links. The browser-only password gate is prototype access, separate from product onboarding.

The branch's GitHub workflow runs checks only. The existing public GitHub Pages URL continues to serve `main`; it is not a deployment of this branch. Git history is retained; unrelated app files are removed from the branch's current contents.

See [onboarding components](docs/onboarding-components.md) for the design and behavior reference.
