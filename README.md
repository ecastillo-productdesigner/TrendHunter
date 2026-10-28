# TrendHunter

Trend Hunter B2C prototype and design system, kept in its own private repository.

## Private preview

The preview is hosted privately with Sites at https://trendhunter-ecastillo.mcclatchy-me-8401.chatgpt.site. Sites requires an authorized account before the demo password screen. GitHub Pages could not be enabled because the current GitHub plan does not support Pages for this private repository.

## Demo access

The website opens with a password screen. The demo password is **`demo`**. Access lasts for the current tab session and survives navigation and refreshes. Choosing **Log out** in the profile menu ends demo access as well as the prototype sign-in session.

This matches CSA's browser-only demo gate. The private repository protects access to the source on GitHub; the website password is a bypassable preview screen, not server authentication. The published static files can still be requested directly. No password is sent to a server.

The same gate is applied to feed, article, collection, contributor, login and design-system pages, including direct links.

## Local preview

With Node.js 24 or newer:

```sh
npm run dev
```

Open http://127.0.0.1:4176/TrendHunter/. Set `PORT` to choose a different port.

## Edit and publish

- Edit the website in `site/` and the password screen in `access/`.
- Run `npm run design-system:build` after changing the design-system generator or token definitions. This uses Python 3's standard library.
- Run `npm run check` to build, check JavaScript syntax and validate local page references.
- Push to `main` to keep the private GitHub source current. The GitHub workflow runs the build checks.
- Publish the private preview through Sites using `.openai/hosting.json`. The Site source must be synchronized and its exact commit packaged before deployment.
- `npm run build` creates `dist/`, copies the password screen, and injects it into every HTML page. `index.html` is generated from the feed so the website opens at its root URL.

## Prototype content

Prediction vote percentages, several story texts, and the six illustrated contributor profiles are sample content. Votes, sign-in state and demo access are stored in the browser. Product cards remain static and do not link to a shop.

Profile Predictions reuses the feed/article result row. Personal profiles have All, Active and Resolved filters. Signed-in author profiles have By Me and By [first name] instead. Signed-out author profiles show only the author’s history, without the secondary filters. Filter buttons use the DS 4px vertical and 12px horizontal padding, with a 32px minimum height and unchanged 16px type. When no deck calls have been recorded, profile lists show an illustrative history with active and resolved examples; real recorded calls take precedence. Author histories are fictional demonstration data, not a claim about any writer’s actual votes. The profile filters do not write or replace votes. Signing in from a selected profile section preserves that section, so Predictions returns with By Me available.

The original local prototype was copied from `TrendHunterB2C`; unrelated CSA files and repository history are not included.
