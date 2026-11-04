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

The profile icon opens a right-side account drawer using the Menu drawer component, with Your Profile and Log Out actions. On mobile and tablet below 960px, the lightning shortcut opens `predictions.html`; it is hidden in desktop navigation. Its selected color is `--color-border-focus`. Desktop article prediction cards hide context and Read more only for the story already open, retaining the same deck and other cards’ controls.

## Email sign-in demo

Continue with Email opens the email → six-digit code → Terms and Policies flow. A valid email enables the primary action; an invalid address shows inline feedback on blur. The prototype does not send email. Enter **123456** to continue, or any other six digits to see the incorrect-code state. Resent code clears the fields and restarts the 15-minute expiry. The password alternative accepts **demo**. Unchecked Continue shows the terms error; checking the box enables completion and returns to the originating page and section. No email, password or consent is sent to a server. Apple and Google remain prototype shortcuts.

`prediction-filter-options.html` contains three isolated DS-based proposals: compact pills, a segmented control and text filters. Their previews filter sample results without changing saved votes. Compact pills is the selected design and is applied to the live profile filters.

The combined author prediction component is documented in the DS under `#profile-call-comparison`, with explicit In, Out and not-yet-voted examples. The reader’s In and Out comparison labels have transparent backgrounds and use the creator result colors for their text and icons. Creator badges keep their fills; other prediction screens keep filled reader badges. The reader’s call sits directly beneath the creator badge, above the full-width proportion bar. Personal Saved / Collections / Predictions tabs and All / Active / Resolved filters are unchanged.

Each populated creator profile starts with three sample predictions so In, Out and Make your call are visible for review. These fictional examples are identified in this documentation and source, without a visible sample label on the cards. Their fictional reader calls and any calls made on these samples use a separate `profile-comparison-example-calls` browser key and never populate personal All / Active / Resolved history or the daily prediction deck. They link to related prototype stories. The prototype deal-again action resets these sample choices. Reader chips and creator badges share a height calculated from the DS 17px line height and 8px vertical padding (33px).

Comparison call columns use a fixed 128px width across In, Out, resolved and unvoted rows, with 4px left and right padding on creator badges and comparison controls. Make your call uses that same width and 33px height, with the same typography, a transparent background, purple outline, purple label and right arrow. The outline, label and arrow turn white on hover or keyboard focus in the dark theme. Resolved reader calls use the past tense: You were in / You were out.

## Feed video demo

The second home-feed card uses the supplied still photograph (`assets/feed/trend-02-still.png`) and links to the retailtainment article. Trending Videos and the retailtainment article retain the supplied 10.027-second, 720×1280 clip with audio (`assets/feed/trend-02-loop.mp4`) and its poster. The original retailtainment clip remains on its article. Trending Videos now uses four different user-supplied clips with matching fictional articles, listed in `site/assets/videos/sources.json`. The article autoplays muted and loops while visible, with pause/play, sound and reduced-motion behavior. `scripts/create-feed-loop.py` retains the earlier still-photo animation recipe; it is not the source of the supplied clip.

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

The Experimental branch applies the image-first reference layout to all 19 home-feed story cards: bordered surface, 2:1 media, collection and interest indicator, full headline and an Editorial footer: original author portrait and full name on the left, with Share and Bookmark on the right. Image and headline links open the matching story; the video frame toggles playback. The feed replaces summaries and Go Deeper with these direct article links. Other pages retain their portrait story cards.

Spacing uses existing DS tokens: 12px phone gutters, 16px phone card padding, 24px card padding from 600px, 16px between media / collection / headline, 24px before actions, 24px between actions and 24px between cards. From 600px, cards fill the 482px center column: its surrounding border, background, list inset and sticky top band are removed. The 24px gap below navigation and between cards remains. The DS reference includes the live component at #experimental-feed-cards.

Mobile Daily Predictions stays after the first three home-feed stories below 960px. Its voting panel uses 16px top and bottom padding, matching phone story cards, and content-driven height with a 24px heading-to-deck gap. Desktop placement and the completed-results scroll frame are retained.

Experimental discovery modules use bordered panels matching the feed: 16px phone padding, 24px from 600px, 24px heading and row gaps, 1px default border and 2px radius. More to Explore shows four collections; Now Trending shows three stories in both mobile and sidebar versions. Feed Share and Bookmark graphics are 20 × 20px; author images remain 24 × 24px. Share and Bookmark have 48 × 48px action targets; the author profile link is at least 48px tall.

Trending Videos follows story twelve on mobile and desktop, with four distinct uploaded clips: friends on a city walk, an LED skincare session, meal prep and a laundry cycle. Each preview body and title links to a matching fictional trend article, which shows the same video in its native 16:9 aspect ratio. Separate 48px play/pause and sound controls support in-feed previews. Portrait 9:16 slides occupy 75% of the row with 16px gaps and a next-video peek. Clips begin paused, have play/pause and mute controls, and only one carousel clip plays at a time. Offscreen/background playback pauses. Swipe or focus the carousel and use Left / Right to browse. The mobile Answers module follows three stories after Trending Videos.

The selected Editorial layout uses the original Share and Bookmark SVG masks and existing author portraits. The left author credit reuses the DS contributor byline (14px Barlow Condensed, 8px portrait-to-name gap), and right-side actions use a 12px gap and retain their existing states. All 19 story destinations, author links and bookmark metadata are preserved.


## Experimental collection interest



## Experimental feed navigation

The home feed has a sticky secondary navigation below the main header: For You, Collections, Trending Up and Trending Down. It uses DS 16px / 18px light Barlow Condensed, 32px tab gaps, 24px top padding, a 12px label-to-underline gap, 57px tab targets (48px minimum) and a 3px selected underline over the default 1px divider. The tab group is centered on desktop from 960px; mobile horizontally scrolls the row from the left. The feed’s sticky rail and content offsets include the extra 58px row. Other pages retain their original single-row header and spacing. For You retains the 19-story feed and module cadence; Collections shows followed collections, the shared profile empty state with an inline collection link when none exist; Trending Up filters rising cards and sorts them by percentage gain from highest to lowest, with original order for ties. Trending Down filters falling cards from the smallest percentage decline to the largest. Returning to For You restores its saved-interest story order and original module slots. Views reuse existing nodes without duplicating cards or losing saved/deck state. Keyboard arrows, Home/End, selected-state semantics, live counts and reload/back/forward through URL hashes are supported. Collection interest remains illustrative prototype data.


## Collection follow flow

Follow on any of the 36 collection detail pages persists the collection in browser-local prototype storage, changes the control to Following, and uses the existing toast with the collection name and a View Collections link to `feed.html#collections`. Clicking Following unfollows. The feed and personal-profile Collections panels share this state across pages/reloads. Empty feed Collections reuses the profile Predictions empty-state typography, with its extra minimum height and bottom padding removed. The word collections in “Follow collections to see them here” is a green, underlined link to Evidence-Based Beauty. Recommended Collections is removed. Once populated, the tab shows collection pills without an outer frame or Following heading. Interest figures remain illustrative. No account backend is connected.

Photo-overlay collection pills now use their full available width and truncate only long names to keep the name and momentum indicator on one compact line. Editorial feed labels retain full text.


The mobile feed Answers module reuses the desktop’s compact framed panel: 24px padding, a 1px default border, 2px radius, the existing input and two horizontally scrolling question rows. It replaces the nine-pill vertical list. The 22-second ticker, 24px edge fades, keyboard focus behavior and reduced-motion scrolling remain shared. Mobile article Answers retains its existing inline layout.


The mobile For You feed adds Hunt What You Like after three story cards following Answers. Its nine square, independently selectable topic tiles use the supplied colors in reading order. Update My Feed is disabled with no selection, becomes enabled after selection, saves browser-local prototype interests, prioritizes existing stories by topic match count and returns to the top of For You with the existing confirmation toast. Equal match counts retain original order; all 19 stories remain available. Modules keep their cadence, including three stories between Answers and this picker. Saved choices restore on reload and also personalize the desktop For You view. Trending views keep their own ordering and collection follows stay separate. Beauty and Books currently have no matching demo feed stories; these preferences save without changing story order. The picker is hidden at 960px and above and in Collections/Trending views.


Signed-out Bookmark actions go straight to `login.html` and remember the originating page for the existing return flow. No bookmark authentication pop-up is shown. Collections shows only followed pills, without a frame or Following label. For You retains the feed footer; Collections, Trending Up, Trending Down and the standalone Daily Predictions page omit it. Trending Down orders declines from smallest to largest (7%, 12%, 20%, 20% in the current sample).




The DS Colors section deduplicates resolved color values separately for dark and light themes. Brand, Neutrals, Signals and Topic colors show one compact swatch per value with shared uses grouped underneath. Copy returns the literal color value. All Tokens retains every semantic token and both theme values; no product color tokens are removed.


The navigation bolt uses a 20px graphic in a 48px target; negative outer margins preserve its existing header alignment. The feed’s Share and Bookmark graphics are also 20px, with 48px targets and a 16px gap. Recommendation text and the info icon use #697182.


All 39 Trend Detail pages end their article text with Members exploring this collection, before the mobile prediction deck. The panel follows the supplied signed-in/signed-out design with the DS black surface (--color-black, #000000), 10px corners, 12px top/bottom padding on desktop and mobile, 16px phone / 24px desktop side padding, 14px bold condensed label and matching linked 24px fictional member portraits overlapping by 8px. Both adjacent section gaps are 24px. Signed-out readers get a lime underlined Join them link into the existing login-and-return flow; signed-in readers see only the label and portraits. The sample members are not live presence. Fixed illustrative totals of 3, 4, 5 or 7 are shown with exactly that many distinct supplied portraits, with no and others suffix.


Seven public reader profiles use distinct supplied 160px circular community photos rather than contributor portraits. The unchanged PNGs and fictional-name mapping are in site/assets/readers/. They reuse the personal-profile DS with Collections and Predictions only; Saved is private. Their sample libraries and member calls are read-only; visitors can record their own comparison votes. Follow / Following is a separate relationship control; signed-out visits redirect to login. When a signed-in visitor has already voted on the same prediction, their actual call appears beneath the member’s sample call. Signed-in visitors can select Make your call on unanswered open predictions. The Following feed offers Make Your Call for pending member activities. User names and histories are illustrative and do not identify the people in the supplied photographs.

Signed-out article avatars have no href, keyboard focus stop or hover state. Signing in enables the profile links. Direct public-reader URLs use the existing browser-only login-and-return flow; community profiles are available after signing in.

All reader profiles and the personal profile show Member since 2026 beneath the name, reusing the 14px muted uppercase profile-role style and 4px identity gap.


## Open predictions and recommendation feedback

Daily Predictions has a secondary View all open predictions action with the total, 24px below the stack and still visible after completion. The directory includes the ten daily picks plus four earlier open examples. All / Not yet voted filters, closing-soonest sorting, collection links, published/closing dates and actual saved-vote status are shared across reloads and Back. Each action opens the matching article with the exact selected prediction first. Earlier calls enter personal history without adding the older catalogue to the daily stack. Dates and community percentages are illustrative as of November 3, 2026.

Collection popularity now uses four logo-inspired chevrons, 20 × 14px: lime to the right for rising and red to the left for falling, with progressive opacity. Percentages are hidden visually but retained for accessible labels/tooltips and Trending sorting.

The two recommendation examples use direct 20px thumbs beside the 16px muted label, in 48px targets. Both match the label color, toggle on and off, and save feedback without moving the current card. Future For You visits apply ranking and hiding; Reset Recommendations restores the cards. Discovery modules keep their slots.

The recommendation overlay heading reuses the DS Card headline class: 28px / 28px Barlow Condensed, weight 800 and uppercase, retaining the overlay’s light text color.

Recommendation feedback uses outlined Material Symbols thumb_up and thumb_down icons at 24px in 48px circular targets, with accessible labels/tooltips More like this and Not interested. The local preference and Undo behavior is unchanged.

Voting-results frames use one 24px inset on every side across desktop and mobile; the panel owns that padding so nested content does not double it. Finish today’s predictions now has the shared secondary hover fill and a DS focus ring. The recommendation row balances visible top/bottom space and lifts the text optically by 1px. Feed Share/Bookmark target spacing is --spacing-layout-md (16px).

Feed Share now matches the Bookmark’s 20px visible height. Its original artwork proportions produce a roughly 25.5px-wide arrow; both targets remain 48px. Public community-reader profiles omit the page footer.


### Collection panels and recommendation feedback

Desktop collection and channel pages keep their overview and complete story list in a 1px bordered panel with 24px padding. More Stories starts 24px below, with no outer frame or inset; its editorial cards fill the middle-column width like the feed. The collection detail list is generated from the same full membership catalogue as the followed feed, including article-primary assignments. It has no four-story cap.

New story markers clear after half of a card’s media has been visible for 600ms. Seen-card state is browser-local and separate from article-read state; merely seeing a card does not earn reading badges. Offscreen cards retain their markers.

Recommendation thumbs match the muted label color, show selection with a filled icon, and toggle off on a second click. Feedback saves without moving or hiding the current card or scrolling to the tabs; ranking changes apply on the next visit to For You. Reset Recommendations in prototype settings removes thumb feedback and restores hidden recommendations immediately, opens For You and reveals an unanswered recommended card first, retaining selected topic interests and follows.

Achievement badges use rounded-square tiles with --radius-md corners: 72px full badges, 32px symbols, lime #BEFC4F inset borders and charcoal #343841 fill. Only the most recently earned visible badge appears as a 48px tile on the lower-right of the 140px avatar. The old chip row is removed.

Both Trending views provide sticky All / Ascending / Descending controls. Ascending sorts visible percentages low to high; Descending sorts high to low; All restores the existing direction-specific default. Following uses the same sticky filter treatment, with an opaque 24px gap beneath the pills.

Desktop More Stories on articles, collections and channels is unframed; cards fill the available middle-column width. The retailtainment article uses the supplied escalator still photo again. The city content-walk article video is 9:16. Signed-in Following activity offers an inline Make Your Call control for unanswered member predictions and displays the visitor’s saved call after submission.

The current avatar badge opens a square detail popup with 100px --radius-full corners, a 3px --stroke-thick lime border and the shared panel scrim. It uses Card headline, a 144px symbol (80px on phones), Body criteria (16/22 Inter), Helper progress/date (12/20), and Close / Show all actions with 24px above the row. Own-badge Show all flips to five earned/to-collect badges; gray unearned icons remain clickable for criteria and progress. Show recent returns to the latest earned badge. Other members’ badge details offer Close only. Outside clicks, including transparent rounded corners, and Escape dismiss the popup. Personal awards trigger a 1200ms Medal burst near the toast; reduced motion omits it. Reset Badges clears personal progress while treating existing saved calls as a baseline.

The daily feed-completion section now fits its content with 24px padding on all sides; the old 9:16 aspect ratio and vertical centering are removed.

Editorial card controls now have 16px bottom padding in desktop and mobile layouts. The account drawer separates Your Profile and Log Out with the existing DS divider.

Community presence labels now emphasize collections: fixed illustrative totals of 3, 4, 5 or 7 members exploring this collection, consistent across a collection’s stories, with no and others suffix. Public reader profiles expose only Collections and Predictions and default to Collections; Saved remains private to the owner profile.

Recommendation cards are always placed after the first three stories, with discovery module slots retained. Reset restores them in those later positions. Recommendation thumb hover turns the glyph white without a background fill. Following context labels are centered and match recommendation typography.

Badge detail opens with a continuous horizontal rotateY reveal, 300ms ease-out (half of --motion-card-flip), matching the incoming Show all / Show recent transition. There are no intermediate stops or overshoot. Reduced motion is immediate.

Recommendation thumbs retain separate 48px tap targets, abutting without overlap; inward icon alignment leaves a 16px visible gap.

Trending Video overlays show article headings across at least three lines without truncation. The headline and primary Go deeper link sit left of a vertical right-hand rail: Volume, Share, Bookmark and the linked story author avatar. Both story actions use 48px targets and matching 20px visible glyph heights; saved metadata and share URLs identify the article, never the MP4.

Collection unread badges are 24px red circles with only a numeric count visible and the full new-story count in their accessible label. The badge collection grid aligns name and state rows and centers its final two items.

Show new in Collections in prototype settings sets a separate manual red-dot preview. Opening Collections dismisses it. It does not alter follows, read/seen history or the normal sample-release schedule. Unearned badge names and symbols are gray; badge rows use 24px desktop and 16px mobile spacing.

Following activity labels align left with card content, using the same typography and color as Recommended for you. Medal burst is the selected award treatment: a temporary earned-badge preview above the toast with 24 radial DS-color particles over 1200ms. Reduced motion keeps only the confirmation toast. Desktop badge-detail typography uses 40px names, 18px descriptions and actions, and 14px dates.

The Following and personal-profile filters are labelled All / Creators / Community. Community retains the same member activity and follow state. Account-menu divider list items stretch across the drawer so the existing DS rule is visible between Your Profile and Log Out.

Badge surfaces use #343841, the existing DS overlay color. The Member Badges heading-to-grid spacing is --spacing-layout-xl (32px) at every viewport. The account-drawer action is labelled Your Profile.

The badge catalogue now contains First Call (first prediction vote), Regular Hunter (calls on five different dates), Deep Diver (finish three different signals), Field Notes (save five distinct signals), and Sharp Eye (three correct verified predictions). Retired badge awards are not converted into the new achievements. Reset Badges preserves saved stories and calls as baselines. Edit Profile no longer includes a View all badges action; current earned badges remain accessible on the avatar. The personal profile heading reads Your Profile.

Typography roles expose copyable semantic font tokens, including --type-card-headline. Feed card headings use --type-card-headline (28px/28px, 800). Trending Videos headings use --type-button-label (16px/18px, 700). Caught on the Move cards omit share, bookmark and author controls.

Public community prediction profiles share the creator comparison flow. Signed-in visitors see their actual saved call beneath the member call, or Make your call to open In/Out choices on open predictions. These votes use shared prediction state and count toward actual participation badges. Sample member choices stay unchanged; no example visitor votes are invented. Signed-out visitors have no voting controls.

Trending Videos use 20 × 20px visuals for volume, share, bookmark and the author avatar, centered in 48px targets with --spacing-component-sm (8px) between targets. Video headings use --type-button-label.

Badge icon mapping uses Material Symbols Outlined: First Call → bolt; Regular Hunter → my_location; Deep Diver → scuba_diving; Field Notes → menu_book; Sharp Eye → eye_tracking.
