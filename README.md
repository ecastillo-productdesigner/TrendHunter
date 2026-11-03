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

Profile Predictions reuses the feed/article result row. Personal profiles have All, Active and Resolved filters. Author profiles show the creator’s call, the proportion bar and the reader’s call together in one row, without Your votes / creator’s votes filters. Signed-out readers see the creator’s calls and results without Make your call or voting choices. Signed-in readers who have not voted retain Make your call. Compact pill filters use the DS 4px vertical and 16px horizontal padding, an 8px gap, with a 32px minimum height and unchanged 16px type. Personal profiles start empty and contain saved stories and recorded deck calls. After the first call, three illustrative historical votes also populate the Resolved filter. Their tabs are Saved, Collections and Predictions. Empty lists use the shared centered heading and helper text; personal prediction status filters appear only after a call has been recorded. Clearing the last bookmark immediately shows the Stories empty state. Collections currently previews the empty state; the existing Follow buttons are still static. Author histories are fictional demonstration data, not a claim about any writer’s actual votes. Personal profile filters do not write or replace votes. On author profiles, Make your call opens the existing In / Out buttons inline and records the reader’s call in shared browser storage. Resolved rows do not accept new calls. Signing in from a selected profile section preserves that section.

The original local prototype was copied from `TrendHunterB2C`; unrelated CSA files and repository history are not included.

Author profiles show first-name empty-state copy only when posts or author votes are absent. Samantha’s main article byline links to her contributor bio. Profile side padding and filter horizontal padding are 16px.

The profile icon opens a right-side account drawer using the Menu drawer component, with Profile and Log Out actions. On mobile and tablet below 960px, the lightning shortcut opens `predictions.html`; it is hidden in desktop navigation. Its selected color is `--color-border-focus`. Desktop article prediction cards hide context and Read more only for the story already open, retaining the same deck and other cards’ controls.

## Email sign-in demo

Continue with Email opens the email → six-digit code → Terms and Policies flow. A valid email enables the primary action; an invalid address shows inline feedback on blur. The prototype does not send email. Enter **123456** to continue, or any other six digits to see the incorrect-code state. Resent code clears the fields and restarts the 15-minute expiry. The password alternative accepts **demo**. Unchecked Continue shows the terms error; checking the box enables completion and returns to the originating page and section. No email, password or consent is sent to a server. Apple and Google remain prototype shortcuts.

`prediction-filter-options.html` contains three isolated DS-based proposals: compact pills, a segmented control and text filters. Their previews filter sample results without changing saved votes. Compact pills is the selected design and is applied to the live profile filters.

The combined author prediction component is documented in the DS under `#profile-call-comparison`, with explicit In, Out and not-yet-voted examples. The reader’s In and Out comparison labels have transparent backgrounds and use the creator result colors for their text and icons. Creator badges keep their fills; other prediction screens keep filled reader badges. The reader’s call sits directly beneath the creator badge, above the full-width proportion bar. Personal Saved / Collections / Predictions tabs and All / Active / Resolved filters are unchanged.

Each populated creator profile starts with three sample predictions so In, Out and Make your call are visible for review. These fictional examples are identified in this documentation and source, without a visible sample label on the cards. Their fictional reader calls and any calls made on these samples use a separate `profile-comparison-example-calls` browser key and never populate personal All / Active / Resolved history or the daily prediction deck. They link to related prototype stories. The prototype deal-again action resets these sample choices. Reader chips and creator badges share a height calculated from the DS 17px line height and 8px vertical padding (33px).

Comparison call columns use a fixed 128px width across In, Out, resolved and unvoted rows, with 4px left and right padding on creator badges and comparison controls. Make your call uses that same width and 33px height, with the same typography, a transparent background, purple outline, purple label and right arrow. The outline, label and arrow turn white on hover or keyboard focus in the dark theme. Resolved reader calls use the past tense: You were in / You were out.

## Feed video demo

The second home-feed card uses the supplied `gemini_generated_video_6f0b965f.mp4`, stored as `assets/feed/trend-02-loop.mp4`, with a poster extracted from its first frame. The full clip is 10.027 seconds at 720×1280 and includes audio. It autoplays muted and loops while at least 25% of the card is visible. Tap to pause/play with filled lime feedback that fades after 900ms; the volume control enables/disables its audio. Explicit pauses survive scrolling, and offscreen/background playback pauses. Reduced-motion users start with the poster. In the Experimental feed layout, the video card’s headline opens the article and its landscape media area toggles playback. The sound control is inside the media frame. Collection, sound, share, bookmark and author controls remain separate. The retailtainment article replaces its main image with the same clip and poster in the existing square frame, with the shared playback and sound controls. `scripts/create-feed-loop.py` retains the earlier still-photo animation recipe; it is not the source of the supplied clip.

Reader choices on creator comparison screens use background-free “You’re in” / “You’re out” labels, with lime or orange-red text and icons. They retain the width of the creator badge above, the 33px height, and the 8px icon-to-label gap (`--spacing-component-sm`). Resolved reader labels retain past tense and muted colors.

Every prediction Read More link (cards, creator comparisons, personal history and results) selects the exact matching prediction at the front of its related article’s three-card deck. There is no onboarding cover, Get context or duplicate Read more on the first card; the other pending cards keep Get context. This is shared across desktop, mobile and article sheets, including reload and resizing. Saved calls stay locked on that first card, with Next prediction to continue. Resolved examples retain their historic call or Voting closed. Profile-only example votes stay in their separate browser key. The daily catalogue and existing saved votes are preserved. scripts/prediction-arrival.test.mjs covers matching, queue order, saved calls and reload.

Feed playback feedback uses filled lime (#BEFC4F) play_circle and pause_circle (FILL 1). Sound on uses filled volume_up in #BEFC4F; muted uses unfilled volume_off in the bookmark outline color.

Articles opened through prediction Read More use the Make your call deck heading on desktop and mobile. Arrival context survives reload. Completed decks retain their result heading and vote-history controls. Feed and Daily Predictions keep their existing heading.

## Answers prototype

All suggested questions and submitted custom questions in Trend Hunter Answers open `answers.html?q=...`. The page mirrors the reference structure using the DS: centered article panel, illustrative source mix, section headings and citation chips, source cards, related questions, feedback and Share controls, New thread, and a sticky follow-up field. Follow-ups append another fictional response to the thread, preserved in sessionStorage for reload. No AI or external publisher service is connected; all answer text, source labels and percentages are fictional examples. Common topics have tailored copy, with a general scenario for other questions. Source cards link to the existing illustrative prototype stories. Questions are capped at 200 characters and six questions per thread. User input is escaped before rendering.

Get context and Back to call use 10% white backgrounds by default and the DS tertiary 15% white background on hover or keyboard focus (`--buttons-tertiary-bg-hover`). The text and flip icon remain white. This shared rule applies to feed, full prediction decks and embedded article decks; the DS button inventory shows both states.

Continue with Email hover uses the fixed `--auth-email-bg-hover` token, white at 15% opacity, on the login page and authentication prompt.

The shared I’m in / I’m out voting buttons use a 15% white hover overlay on the existing black fill, from `--buttons-tertiary-bg-hover`, with a 150ms fade. Labels, icons and borders keep their default colors. Reduced-motion users get an immediate state change. The DS includes default and hover samples at `#prediction-vote-hover`.

Collection and channel mastheads keep the final word and green trend arrow in one inline group with an 8px DS gap. Earlier words wrap naturally; the arrow never occupies a line by itself. The DS documents the component at `#heading-trend-arrow`.

Share icons on stories, predictions, articles, collections and Answers now open the device’s native sharing menu directly through the Web Share API. The matching title and URL are passed synchronously from the user gesture. The device/browser supplies destinations such as AirDrop, Mail and Messages; cancelling returns to the page without opening another popup. Unsupported or rejected native sharing opens the existing Copy link/Email dialog. A successful copy shows Link Copied in lime for 5 seconds with no success toast. The trigger stays lime while the native request or fallback dialog is active. Dynamic prediction and Answers triggers follow the same behavior. Routing, cancellation and unavailable-browser cases are covered by scripts/system-share.test.mjs and npm run check.

Share states are shared across story, prediction, article-header and Answers controls: hover is white on dark/photo/prediction surfaces and dark on light page surfaces, with no hover background. Pressing immediately turns the icon lime; the open state remains lime and takes priority over hover or focus. Keyboard focus adds a 2px ring with a 4px offset, lime on dark/photo/prediction surfaces and purple on light page surfaces. Icons keep their size and position throughout. The DS `#share-menu` includes five state previews that follow its theme switch.

Every story card uses the crisp matching SVG arrow (`site/assets/feed/icon-share.svg`) as its share mask, replacing the 28×22px raster image. It uses a 30×30px action box and a 20px-wide arrow, matching Bookmark’s visible left and right edges, above Bookmark in the right action rail on desktop and mobile. Default color matches the unsaved bookmark in each theme; hover and keyboard focus turn white without a background. While the share menu is open, its trigger is #BEFC4F, taking priority over hover; closing the menu restores the default or hover color. Story bookmarks turn white on hover and keyboard focus, whether outlined or saved. Prediction Share uses the same vector and states at 24px. The original supplied PNG remains in the source asset inventory for reference.

The DS now has dedicated `#icons` and `#buttons` sections with searchable inventories and downloadable `icons.json` / `buttons.json`. Icon previews use product classes for inactive/active bookmarks, profile, bolt, checkboxes, volume and feedback, plus all single-action icons, all SVG/PNG sources, supporting layers, brand marks and the unused legacy prediction-share asset. Button previews include product states and every button class combination found in app HTML/JS, plus styled anchor buttons and runtime-created controls. Previews are inert. `scripts/audit-design-system.py` verifies coverage and that every story card includes Share before publication.

Share is present above Bookmark on all story cards at every breakpoint, and at the top right of prediction deck cards, including dynamically dealt and compact cards. Prediction shares use that prediction’s related story; onboarding shares open Daily Predictions. The saved custom share-menu hover changes only label/icon color to white in dark mode (theme primary in light mode), with no background. Apple and Google provider buttons hover to #E5E7EB. The sticky Make your call pill hovers to white with purple text/arrow over 150ms, with no size or position change and no motion for reduced-motion users.

Creator prediction comparisons animate once on their first visible render per page load: rows fade/rise 12px over 500ms with 70ms staggering, split labels fade in, and split bars reveal left-to-right over 650ms. Reduced-motion users see final values immediately. Reopening tabs or recording votes does not replay the entrance. The DS has a Replay entrance animation control. Prediction-card share buttons live inside both 3D card faces and follow the context flip and each face’s inert state. Story collection labels turn white on hover while the arrow stays lime.

The DS icon gallery groups shared glyphs instead of repeating story/article/profile presentations. Bookmark has one inactive/active pair with size/theme notes; Share and vote glyphs are grouped the same way. All raw icon sources and button markup variants remain available in expandable inventories.

Article shopping recommendations and Trend Hunter Answers stay inline on desktop and mobile, after the article’s prediction section and before More Stories. The same four static products appear in a horizontal carousel showing two complete cards plus a 24px glimpse of the next card, with keyboard Left/Right support. A divider separates Answers from More Stories at all viewports. Answers appears once in the article body instead of the article sidebar; the feed retains its existing responsive Answers placement. Dividers keep 32px of spacing on each side. The DS includes the visible shopping module and article link at `#shopping-module`. Story action rails use a 24px gap between control boxes.

Each of the 35 stories includes two short contextual links within its paragraphs, opening relevant collections or related prototype stories. The links remain underlined and use the existing article tokens: #BEFC4F in dark mode and #875FE7 in light mode. The DS shows an example at `#story-text-links`.

Story collection links change to primary text on hover and keyboard focus (white in dark mode), without an underline, pill outline, background or layout shift. The trend arrow keeps its signal color. The DS includes both states.

Channel and collection pages share the same divider above More Stories as articles, with 32px of space on either side.

The shopping carousel has no edge fades; its 24px next-card preview stays visible. Article-header Share and Bookmark icons turn primary text color on hover and keyboard focus, without a background. Share keeps its lime active state while open.

Shopping card Shop Now labels match the 18px price, with 18px arrows. Labels and arrows use #BEFC4F in both themes and align at their vertical centers in the price row, with a 4px label-to-arrow gap and 8px between price and action.

Shop Now and its arrow turn primary text color on hover (white in dark mode), without underlining or linking anywhere. Article bylines keep 8px after the avatar and use 4px between By and the author name; author names turn primary text color on hover.

Collection arrows keep a consistent fictional sample direction across collection titles, collection pills, story-card labels and article links. Back-to-School Transitions, Clean Living Control, Tactile Home Design, Supplement Science, Wellness Maxxing and Solo Travel use red down arrows; the other collections use green up arrows. These are static prototype signals, not live popularity measurements.

The previous custom Copy link/Email/More popup remains interactive in the DS at `#share-menu-archive`. It uses an explicit data-share-legacy trigger and is no longer the normal Share flow. Its original JavaScript, menu CSS and DS markup are separately saved in `archive/share-menu-custom-2026-11-02/`. The current system-sharing example is at `#share-menu`.

Desktop Trend Detail pages (960px and above) use four separate content-sized panels in order: article, shopping, Trend Hunter Answers and More Stories. Each uses the default 1px border, 2px corner radius, 24px padding and a 24px gap. The middle column scrolls with the document while side rails remain sticky. A clear 24px band beneath the sticky menu uses the opaque page surface in both themes, keeping scrolling panels separated from navigation. Each panel keeps its 1px top border visible beneath that gap while its content scrolls upward; the border stays within its own panel and releases as that panel leaves. The home feed retains its scrolling frame. Mobile and article sheets retain inline modules and section dividers. The existing shopping and Answers nodes move between desktop and mobile placement so carousel position, input and handlers are preserved. The DS documents this at #trend-detail-panels.

## Experimental feed cards

The Experimental branch applies the image-first reference layout to all 19 home-feed story cards: bordered surface, 2:1 media, collection and trend arrow, full headline and a horizontal Share / Bookmark / author row aligned right. Image and headline links open the matching story; the video frame toggles playback. The feed replaces summaries and Go Deeper with these direct article links. Other pages retain their portrait story cards.

Spacing uses existing DS tokens: 12px phone gutters, 16px phone card padding, 24px card padding from 600px, 16px between media / collection / headline, 24px before actions, 24px between actions and 24px between cards. From 600px, cards fill the 482px center column: its surrounding border, background, list inset and sticky top band are removed. The 24px gap below navigation and between cards remains. The DS reference includes the live component at #experimental-feed-cards.

Mobile Daily Predictions stays after the first three home-feed stories below 960px. Its voting panel uses 16px top and bottom padding, matching phone story cards, and content-driven height with a 24px heading-to-deck gap. Desktop placement and the completed-results scroll frame are retained.
