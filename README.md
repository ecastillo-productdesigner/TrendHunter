# TrendHunter

Trend Hunter B2C prototype and design system, kept in its own public repository.

## Public website

Open https://ecastillo-productdesigner.github.io/TrendHunter/ and enter the demo password **demo**. GitHub Pages hosts this public website independently of ChatGPT workspace access. Anyone with the URL can open it. The public repository is https://github.com/ecastillo-productdesigner/TrendHunter.

## Demo access

The website opens with a password screen. The demo password is **`demo`**. Access lasts for the current tab session and survives navigation and refreshes. Choosing **Log out** in the profile menu ends demo access as well as the prototype sign-in session.

This matches CSA's browser-only demo gate. The source is publicly available on GitHub. The website password is a bypassable preview screen, not server authentication. The published static files can still be requested directly. No password is sent to a server.

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
- Push to `main` to update the public GitHub source and website. The GitHub workflow runs the build checks, uploads the checked `dist/` website, and deploys it to GitHub Pages. A failed check prevents publication.
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

The combined author prediction component is documented in the DS under `#profile-call-comparison`, with explicit In, Out and not-yet-voted examples. The reader’s In and Out comparison labels have transparent backgrounds and use the creator result colors for their text and icons. Creator badges keep their fills; other prediction screens keep filled reader badges. The reader’s call sits directly beneath the creator badge, above the full-width proportion bar. Personal Saved / Collections / Predictions tabs and All / Active / Resolved filters are unchanged.

Each populated creator profile starts with three sample predictions so In, Out and Make your call are visible for review. These fictional examples are identified in this documentation and source, without a visible sample label on the cards. Their fictional reader calls and any calls made on these samples use a separate `profile-comparison-example-calls` browser key and never populate personal All / Active / Resolved history or the daily prediction deck. They link to related prototype stories. The prototype deal-again action resets these sample choices. Reader chips and creator badges share a height calculated from the DS 17px line height and 8px vertical padding (33px).

Make your call uses the creator badge’s width and 33px height, with the same typography, a transparent background, purple outline, purple label and right arrow. The outline, label and arrow turn white on hover or keyboard focus in the dark theme. Resolved reader calls use the past tense: You were in / You were out.

## Feed video demo

The second home-feed card uses `assets/feed/trend-02-loop.mp4`, a seamless five-second silent pan/zoom encoded from its original photo, not new live footage. It autoplays muted and loops while at least 25% of the card is visible. Tapping pauses with a brief Material Symbols Outlined pause_circle animation; tapping again resumes with play_circle. The center icon fades after 900ms. An explicit pause remains paused when scrolling away and back. Offscreen and background-tab playback pauses automatically. Reduced-motion users start with the poster and can choose to play. The volume_off control is above Share in the existing action rail and toggles the media mute state; the source animation has no soundtrack. Story, collection, bookmark and author actions stay separate from playback. Keyboard users can play/pause with the full-card button. Re-create the MP4 with `python3 scripts/create-feed-loop.py --ffmpeg /path/to/ffmpeg`.

Reader choices on creator comparison screens use background-free “You’re in” / “You’re out” labels, with lime or orange-red text and icons. They retain the width of the creator badge above, the 33px height, and the 8px icon-to-label gap (`--spacing-component-sm`). Resolved reader labels retain past tense and muted colors.

Read more on a creator prediction with Make your call carries that prediction to its related story. The unvoted prediction starts face-up at the front of the same three-card deck used by the feed, with no onboarding cover, Get context or Read more on the current card. Other pending cards remain behind it. This works for daily predictions and profile-only fictional examples, and recognizes both .html and extensionless Site routes. Sample votes made on the story use the separate example-call key and update the creator comparison without entering personal voting history. Reloading after a call shows the existing saved-call state.

Feed playback feedback uses filled lime (#BEFC4F) play_circle and pause_circle (FILL 1). Sound on uses filled volume_up in #BEFC4F; muted uses unfilled volume_off in the bookmark outline color.

Articles opened through a prediction’s Read more use the Make your call section heading on desktop and mobile. The arrival context survives reload; saved-call results retain Your call is locked in. Feed and Daily Predictions pages keep their existing heading.

## Answers prototype

All suggested questions and submitted custom questions in Trend Hunter Answers open `answers.html?q=...`. The page mirrors the reference structure using the DS: centered article panel, illustrative source mix, section headings and citation chips, source cards, related questions, feedback and Share controls, New thread, and a sticky follow-up field. Follow-ups append another fictional response to the thread, preserved in sessionStorage for reload. No AI or external publisher service is connected; all answer text, source labels and percentages are fictional examples. Common topics have tailored copy, with a general scenario for other questions. Source cards link to the existing illustrative prototype stories. Questions are capped at 200 characters and six questions per thread. User input is escaped before rendering.

Continue with Email hover uses the fixed `--auth-email-bg-hover` token, white at 15% opacity, on the login page and authentication prompt.

The shared I’m in / I’m out voting buttons use a 15% white hover overlay on the existing black fill, from `--buttons-tertiary-bg-hover`, with a 150ms fade. Labels, icons and borders keep their default colors. Reduced-motion users get an immediate state change. The DS includes default and hover samples at `#prediction-vote-hover`.

Collection and channel mastheads keep the final word and green trend arrow in one inline group with an 8px DS gap. Earlier words wrap naturally; the arrow never occupies a line by itself. The DS documents the component at `#heading-trend-arrow`.
