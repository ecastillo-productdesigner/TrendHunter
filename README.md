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

Profile Predictions reuses the feed/article result row. Personal profiles have All, Active and Resolved filters. Author profiles show the creator’s call, the proportion bar and the reader’s call together in one row, without Your votes / creator’s votes filters. Signed-out readers see the creator’s calls and can sign in with Make your call. Compact pill filters use the DS 4px vertical and 16px horizontal padding, an 8px gap, with a 32px minimum height and unchanged 16px type. Personal profiles start empty and contain saved stories and recorded deck calls. After the first call, three illustrative historical votes also populate the Resolved filter. Their tabs are Saved, Collections and Predictions. Empty lists use the shared centered heading and helper text; personal prediction status filters appear only after a call has been recorded. Clearing the last bookmark immediately shows the Stories empty state. Collections currently previews the empty state; the existing Follow buttons are still static. Author histories are fictional demonstration data, not a claim about any writer’s actual votes. Personal profile filters do not write or replace votes. On author profiles, Make your call opens the existing In / Out buttons inline and records the reader’s call in shared browser storage. Resolved rows do not accept new calls. Signing in from a selected profile section preserves that section.

The original local prototype was copied from `TrendHunterB2C`; unrelated CSA files and repository history are not included.

Author profiles show first-name empty-state copy only when posts or author votes are absent. Samantha’s main article byline links to her contributor bio. Profile side padding and filter horizontal padding are 16px.

The profile icon opens a right-side account drawer using the Menu drawer component, with Profile and Log Out actions. On mobile and tablet below 960px, the lightning shortcut opens `predictions.html`; it is hidden in desktop navigation. Its selected color is `--color-border-focus`. Desktop article prediction cards hide context and Read more only for the story already open, retaining the same deck and other cards’ controls.

## Email sign-in demo

Continue with Email opens the email → six-digit code → Terms and Policies flow. A valid email enables the primary action; an invalid address shows inline feedback on blur. The prototype does not send email. Enter **123456** to continue, or any other six digits to see the incorrect-code state. Resent code clears the fields and restarts the 15-minute expiry. The password alternative accepts **demo**. Unchecked Continue shows the terms error; checking the box enables completion and returns to the originating page and section. No email, password or consent is sent to a server. Apple and Google remain prototype shortcuts.

`prediction-filter-options.html` contains three isolated DS-based proposals: compact pills, a segmented control and text filters. Their previews filter sample results without changing saved votes. Compact pills is the selected design and is applied to the live profile filters.

The combined author prediction component is documented in the DS under `#profile-call-comparison`, with explicit In, Out and not-yet-voted examples. The reader’s In and Out marks use the exact same background and icon colors as creator result badges. The reader’s call sits directly beneath the creator badge, above the full-width proportion bar. Personal Saved / Collections / Predictions tabs and All / Active / Resolved filters are unchanged.

Each populated creator profile starts with three sample predictions so In, Out and Make your call are visible for review. These fictional examples are identified in this documentation and source, without a visible sample label on the cards. Their fictional reader calls and any calls made on these samples use a separate `profile-comparison-example-calls` browser key and never populate personal All / Active / Resolved history or the daily prediction deck. They link to related prototype stories. The prototype deal-again action resets these sample choices. Vote marks and creator badges share a height calculated from the DS 17px line height and 8px vertical padding (33px).

Make your call uses the creator badge’s width and 33px height, with the same typography and the existing purple callout color.
