# Trend Hunter B2C Prototype — PRD

Reviewed against the repository on November 11, 2026.

## 1. Overview

Trend Hunter is a responsive consumer prototype for discovering trends, following collections and people, and making predictions about what comes next. Readers can explore stories and videos, save articles, compare prediction calls, and catch up on followed collections through Your Digest. It is designed for curious readers who want to understand changing interests and participate in a community around them. The implementation is a static website with fictional editorial and community content, simulated trend data, and browser-stored interactions rather than a production account or content service.

## 2. Features

The statuses below describe the **prototype**, not production readiness:

- **Fully interactive:** the described flow works within the browser, including any stated local persistence.
- **Partially working:** controls or navigation work, but an important part uses simulated data, a demo shortcut, or an unfinished destination.
- **Visual only:** a presentation example without the corresponding functional action.

### Feed and discovery

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Signed-in and signed-out feed navigation | Fully interactive | Signed-in readers see For You, Collections, Following, and What’s Changing. Signed-out readers see Discover and What’s Changing; Discover leads with public stories, collection discovery, videos, then writers and an account invitation. A prediction deck sits in the right panel on desktop and follows videos in the mobile feed; tab selection supports keyboard navigation, links, and browser history. | Feed navigation |
| Editorial feed cards | Fully interactive | Story cards connect a headline and image to an article, its collection, and its writer. Cards also expose Share and Bookmark actions, with recommendation feedback on applicable cards. | Discover, For You, Collections, Following |
| Interest selection and feed ordering | Fully interactive | Readers can browse and select square topic cards in a horizontal feed carousel, available to signed-in readers. The nine interests are: Health & Wellness, Beauty & Skincare, Food & Drink, Fitness, Home & Living, Tech & AI, Family & Parenting, Culture & Experiences, and Travel. Signed-in saved interests reorder the existing story catalog by topic matches. Guest Discover has no topic picker and ignores saved account interests and legacy guest topic choices; this is local ranking rather than a recommendation service. | Onboarding; signed-in Hunt What You Like on feed and collection pages |
| Recommendation feedback | Fully interactive | More like this records a preference for a story’s collection, while Not interested excludes that recommended story on a later feed visit. A second click clears the choice, and the current card remains in place so the reader can undo it. | Recommended for you cards in For You; Editor’s Picks in Discover, with separate session feedback |
| Curated discovery modules | Partially working | Collections links to four selected collections through pills, below Popular stories in the desktop sidebar and inline in the mobile feed; Popular stories, channel pages, and Caught on the Move surface selected stories from the prototype catalog. Caught on the Move includes a carousel and a See More link to What’s Changing, but these modules do not receive live popularity or publication data. | Feed, sidebar, Mind-Body / Everyday Living / Experiences channel pages |

### Collections and trend tracking

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Collection detail pages | Fully interactive | A collection groups its description, associated stories, interest indicator, update time, and follow/share controls. Story links use the catalog’s collection memberships. | Collection pages |
| Follow and unfollow collections | Fully interactive | Follow toggles to Following and can be clicked again to unfollow; choices are saved in this browser. Signed-out readers are directed through sign-in before completing the follow intent. | Collections, channel pages, onboarding, recommendations, profile |
| Followed-collection feed and filters | Fully interactive | The Collections tab displays stories belonging to the reader’s followed collections. Readers can view all of those stories or filter to a particular followed collection. | Feed → Collections |
| Followed-collection carousel | Fully interactive | From the Collections you are following contains stories from actual followed collection memberships and is hidden when there are no follows or the reader is signed out. See More opens the Collections tab. | For You feed |
| What’s Changing | Partially working | Stacked collection cards show signed interest change over seven days, update time, and up to three latest-story links from that collection; selected cards expand with See more / See less. Filter by biggest change or smallest change orders cards by change magnitude, using illustrative percentages and update times. | Feed → What’s Changing, signed in or out |
| Changing percentages and chevrons | Partially working | A small subset of collection indicators moves subtly through predefined percentage and chevron levels, with matching instances kept in sync. Updates pause when not visible or when reduced motion is requested; they do not represent incoming analytics. | Collection indicators across the feed and collection views |
| Collection update notifications | Partially working | Scripted update batches drive the Collections red dot, collection update counts, and New in this collection story markers. Tab acknowledgement, viewing a card, and opening its article are tracked separately in the browser; there is no publishing service producing the updates. | Collections tab, collection filters/cards, articles |

### Following and community

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Follow and unfollow people | Fully interactive | Readers can follow writers/creators and community members, with the same state reflected across profile and recommendation controls. A signed-out follow preserves its intent through the demo sign-in flow. | Writer and community profiles, Who to Follow, profile Following list |
| Who to Follow | Fully interactive | A horizontal writer carousel provides portraits, names, roles, profile links, and Follow buttons. Already-followed people are excluded, and the module disappears when no eligible suggestions remain. | For You feed |
| Following activity feed | Partially working | All, Creators, and Community filters show activity from followed people, including writer stories, member prediction calls, and community members following collections. Person names link to profiles, while the description of their action remains plain text; activity is supplied by fictional fixtures. | Feed → Following |
| Item-level Following updates | Partially working | Unseen activity drives a red dot on the feed’s Following tab and New or Updated labels on individual items. Saved snapshots identify changed content, and viewing an item acknowledges it rather than clearing every update when the tab opens. | Feed Following tab and activity cards |
| Following introduction and empty-state recommendations | Fully interactive | The introduction flow offers collections, writers, and community members under Most followed Collections, Most followed Writers, and Most active Community Members. Suggestions exclude existing follows, and the preview keeps real follow choices intact rather than clearing them to simulate an empty account. | Following empty/start state; announcement Try it destination |
| Members exploring a collection | Partially working | Signed-in readers see a member count and linked overlapping avatars near the end of an article. The count and people are stable samples, not real-time presence; the strip is hidden when signed out. | Article pages, before comments |

### Your Digest

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Personalized dated briefing | Partially working | Your Digest gathers eligible stories from followed collections, shows the current edition date and counts, and previews the first story. Summaries are curated text attached to catalog stories, not generated daily by a backend; the digest is shown only in signed-in For You. | Top of For You feed |
| Expandable numbered collection groups | Fully interactive | See all updates expands the same card into numbered collection groups separated by lines, with story titles, short summaries, and Read more links to the corresponding articles. Close digest at the end collapses the expanded content without marking it read. | Your Digest card |
| Story catch-up and Mark all as read | Fully interactive | Opening an article catches up that story’s current digest revision so it is omitted on a later visit; a changed revision can become eligible again. Mark all as read at the end catches up the current eligible set and hides the digest, and no caught-up confirmation card is shown when nothing remains. | Your Digest and linked article pages |

### Predictions

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Prediction card deck and calls | Fully interactive | Readers choose I’m In or I’m Out, skip a card, or drag right, left, or upward for those actions. The stacked deck saves calls for the current tab, preserves them across pages, and supports revisiting skipped predictions and completion states. | Desktop prediction rail, mobile feed, dedicated predictions page |
| Prediction context and deeper reading | Fully interactive | Get Context flips a prediction to supporting copy, and readers can return to make a call or open its related article. Article links preserve the prediction context and existing call; an article-sheet presentation is also implemented for deck reading. | Prediction cards and prediction-linked articles |
| Community vote breakdowns | Partially working | In/Out bars and percentages let readers compare their call with the displayed community split. The splits are sample totals and do not aggregate actual visitors’ votes. | Prediction context/results and profile prediction rows |
| Personal prediction history | Partially working | The profile groups calls under All, Active, and Resolved, with empty states when appropriate; active calls use the visitor’s saved choices, while illustrative past results can appear after a first call. View My Active Predictions is hidden at zero, and the older open-predictions route redirects to this profile view. | Own profile → Predictions; prediction completion links |
| Prediction results and notifications | Partially working | A result banner and red dot open a sequence of solved-result dialogs showing the reader’s call, verified In/Out outcome, correct/different result, and Read Our Analysis link. Previous/Next navigation and a final Close action are implemented; viewing the last unseen result clears the banner and dot, but the outcomes are explicitly seeded examples. | Feed, bolt/predictions destination, result dialogs, resolved history |
| Writer and member call comparisons | Partially working | Public profiles and activity can compare a fictional person’s prediction with the visitor’s own call. Eligible open predictions offer Make Your Call, while a resolved prediction without a visitor call says You did not make the call. | Writer/community profiles and Following prediction activity |
| Mobile prediction destination | Fully interactive | The bolt opens a page with unanswered predictions before called predictions and the result banner above them when results are available. The banner opens the same result-dialog flow used on desktop. | Mobile header → bolt; predictions page |

### Profiles, bookmarks, and saved content

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Own profile editing | Partially working | The reader profile provides Saved, Collections, Predictions, and Following tabs plus an Edit Profile dialog. Readers can change their display name or choose a photo from their computer, preview it, and save for this browser tab; photos are centered and resized to 512px without a server upload. Membership details are sample content. | Own profile and account drawer |
| Personal account menu | Fully interactive | Signed-in readers see their current visible badge, “Hello” with their display name, and Your Profile, which opens the profile page. Readers without badges see a gray First Call medal; clicking explains how to earn it and links to predictions to start collecting. A divider separates this header from Log Out. | Signed-in header account menu |
| Fresh start on logout | Fully interactive | Log Out clears personal bookmarks, follows, interests, feedback, local comments, badge progress, prediction votes/results/skips, digest history, update markers and onboarding drafts before returning to Discover. Other open or restored tabs also sign out and clear their old session activity. Signing in again shows empty Digest, Following and Collections states with no collected badges. Predictions restart unanswered with their introductory cover; the display name, photo and theme are retained. This reset applies to the prototype’s browser storage, without a backend account deletion. | Account menu → Log Out |
| Writer and community profiles | Partially working | Writer pages show a biography, linked stories, and prediction examples; community pages expose sample collection lists, predictions, and badges. Follow controls work, but these are fictional identities and read-only content lists rather than a live profile or collection-publishing service. | Linked writer/contributor and community member pages |
| Manage followed people and collections | Fully interactive | The reader can review followed collections and people from their profile and unfollow them. The people list supports All, Creators, and Community filters; its profile Following tab has no notification dot. | Own profile → Collections / Following |
| Bookmark and Saved stories | Fully interactive | Bookmark toggles save or remove an article and synchronize matching cards, article controls, and video cards in the current tab. Saved shows the stored articles and an empty state when none remain; signed-out bookmark actions route to sign-in. | Feed/article/video Bookmark controls; own profile → Saved |
| From Your Bookmarks | Fully interactive | A compact carousel resurfaces actual saved stories, with a bookmark heading icon and See All link to the profile’s Saved tab. It is hidden when signed out or when there are no saved stories. | For You feed |

### Collectible badges and progress

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Activity-based badge collection | Partially working | First Call rewards one prediction vote, Regular Hunter rewards calls on five different days, Deep Diver rewards three completed story reads, and Field Notes rewards five saved stories. Sharp Eye is defined for three correct verified calls, but cannot currently be earned because the real verified-outcome catalog is empty. | Signed-in activity tracking and member badge UI |
| Badge details and collection | Fully interactive | Readers can inspect a badge’s icon, earning rule, and earned date, then view other earned or locked badges. The most recently earned visible badge is associated with the member avatar. | Profile/avatar badge controls and badge dialogs |
| Badge celebrations and sharing | Fully interactive | Newly earned badges open an animated celebration with confetti and matching open/close motion, with reduced-motion support. A share action opens native or fallback sharing for a badge-gallery link. | Badge celebration and detail dialogs |
| Fictional member achievements | Visual only | Community profiles include predefined earned-badge examples and dates for their sample members. These do not represent real users earning achievements through the prototype. | Public community profiles |

### Articles, discussion, and feedback

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Long-form trend reading | Fully interactive | Articles present editorial content, collection context, writer links, images or video, perspective/next-step sections, and related-story links. Prediction-linked pages can also expose the associated prediction and analysis. | Trend and prediction-analysis articles |
| Comments and replies | Fully interactive | Readers can expand a discussion, view additional comments, and sort by newest, oldest, or most liked. Signed-in readers can post, reply, edit their own comments, or delete them with confirmation; deleted comments retain a placeholder when needed to preserve replies. | Article Comments section |
| What readers are saying | Fully interactive | A quote-first module samples one comment from each of three stories, with the reader identity, story thumbnail, headline and current comment count. Join the conversation opens the matching article’s comments; previews use the same browser-local discussion data and exclude deleted or reported comments. | For You and logged-out Discover feed |
| Comment likes and reports | Partially working | Signed-in readers can toggle likes and report another person’s comment. These actions update browser-local state, but reports do not reach a moderator or shared discussion service. | Article comments |
| Article sentiment and optional feedback | Fully interactive | What did you think about this trend? offers thumbs up/down, followed by an optional reasons-and-comment dialog. Sentiment is saved immediately, clicking it again clears it, Cancel retains the initial rating, and Submit saves the additional feedback locally. | Article end, before the members strip |

### Video

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Auto-playing video carousel | Fully interactive | Portrait videos play muted and loop when sufficiently visible, pause offscreen or in a background tab, and offer playback and volume controls. Readers can move through the carousel and share, bookmark the associated story, or open its writer; reduced-motion mode starts playback paused. | Trending Videos in the feed |
| Full-screen video viewer | Fully interactive | Clicking a Trending Videos preview opens a portrait video overlay with the centered TH logo, Log In and the shared close icon aligned above the video navigation arrows. Readers can browse clips with buttons, arrow keys, wheel or swipe, pause, mute, share, bookmark or open the article; closing restores the feed and focus. | Trending Videos carousel, desktop and mobile |
| Go Deeper and article video | Fully interactive | Go Deeper opens the matching article with its tall video presentation instead of an unrelated destination. Embedded article videos include volume and Share controls, using the same visibility-based playback behavior. | Video-linked articles, including city walks, LED skincare, meal prep, and laundry |

### Demo access and onboarding

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Published demo access gate | Partially working | The published build includes a browser-only password screen using the demo password, with access retained for the tab session. It is a preview gate rather than server-enforced authentication or protection of the public repository. | Entry to published prototype pages |
| Email, code, password, and terms flow | Partially working | Email validation, a six-digit demo code, code resend/expiry, a password alternative, and a required terms checkbox support the sign-in journey. These use fixed demo credentials and browser session state; Apple and Google are shortcuts rather than real provider sign-ins. | Login, email/code/password, and terms pages |
| Account navigation and logout | Fully interactive | The header switches between Login and account controls, and the account drawer links to the reader profile. Logout clears the prototype sign-in and demo-access session and returns to the feed. | Header and account drawer |
| Three-step interest and follow selection | Fully interactive | Your interests, Collections, and Trendsetters let readers select preferences without automatic selections, move back to visited steps, or skip. Continue requires a selection in the current chooser, and skipping clears that step’s draft picks rather than marking it completed. | Onboarding |
| Interest-matched collection suggestions | Fully interactive | Collection choices are drawn from mappings for the selected interests rather than filled with unrelated defaults. With no interests selected, the prototype uses its curated default suggestions. | Onboarding → Collections |
| Great Picks review and Add More | Fully interactive | The review shows only chosen groups, including square interest tiles, collection pills, and Trendsetter names, titles, and portraits. Each text-only Add More returns to its chooser, and Continue returns directly to the review; on mobile, See Your Feed sits immediately after the introduction. | Onboarding → Great Picks |
| Completion and account-setup transition | Fully interactive | Completing onboarding saves interests and adds chosen collection/person follows, then runs an eight-second signal animation before revealing For You. Skipping all three steps bypasses the empty review and goes directly to this transition, which includes reduced-motion handling and recovery controls. | End of onboarding and feed handoff |

### Answers and search-style exploration

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Ask Trend Hunter and suggested questions | Partially working | A search-style input and moving suggested-question pills open an Answers page for the submitted question. Responses come from keyword-matched fictional topic templates or a fallback, not a live search or AI service. | Feed/collection Answers entry points and Answers page |
| Answers content and sources | Partially working | Responses include structured sections, citation links, an illustrative source mix, a source/related-story carousel, and related questions. Source mix values and response content are sample material rather than retrieved evidence. | Answers response layout |
| Follow-up conversation and answer feedback | Fully interactive | Readers can add follow-up questions within a capped session thread, reload that thread, or start a new one. Helpful/unhelpful controls toggle for an answer, and sharing is available; responses still use the same local templates. | Answers page |
| Product suggestion carousel | Partially working | Readers can browse example products and prices in a horizontal carousel. Feed cards show a bold price and Shop Now row with the shared diagonal shopping arrow, followed by a Why is Trending text link to related product context; article shopping cards omit that link. Shop Now labels are not purchase links or checkout actions. | Article product module, alongside the Answers panel; Trending Products in the signed-in For You feed |

### Sharing, app shell, and announcements

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Native and fallback sharing | Fully interactive | Share uses the device’s native share sheet where available, with relevant titles and URLs. Otherwise a dialog offers Copy Link and Email, with copy confirmation; Email opens a mail draft rather than sending a message. | Stories, collections, predictions, videos, Answers, badges |
| Light and dark themes | Fully interactive | A header control switches the color theme and stores the choice in this browser. Shared tokens provide the corresponding surfaces, typography, borders, and green accents. | Site-wide |
| Navigation drawers and feedback toasts | Fully interactive | Menu/account drawers support close controls, outside-click and Escape dismissal, and focus return. Short feedback toasts report actions such as saving or following and can be dismissed. | Shared app shell |
| Following feature announcement | Fully interactive | A dismissible announcement introduces Following only when a signed-in reader explicitly invokes Show New Feature Card in prototype settings. Account creation, sign-in and ordinary page loads do not show it automatically. Try it opens the Following introduction/recommendations flow, and the close action uses a puff-style exit; signed-out readers do not see the card. | For You feed |
| Trend Hunter for Business callout | Partially working | A dismissible business strip introduces business trend insights and remembers dismissal for the session. Explore Solutions is presentation text without a destination. | Above the shared site header |
| Custom 404 page | Fully interactive | The missing-page screen uses the signal-ring animation and a Find Your Signal link back to the feed. It can also be opened explicitly from prototype settings. | 404 page |

### Prototype and design-system tools

| Name | Status | Summary | Where it appears |
| --- | --- | --- | --- |
| Replay and reset settings | Fully interactive | A floating settings menu re-deals predictions, resets recommendation feedback or badge progress, replays Collections/Following updates and prediction results, and shows the digest, announcement, B2B strip, or 404 page. Show Your Digest restores the current followed collections’ sample summaries so a fresh example can be reviewed. | Floating prototype settings menu |
| Show Osano placeholder | Visual only | The menu includes Show Osano, but its handler only closes the menu. No consent-management interface is implemented by that action. | Prototype settings |
| Design-system reference | Fully interactive | The reference documents colors/themes, typography, spacing, borders/strokes, radii, icons, avatars, buttons, layouts, components, and motion, with searchable inventories, copyable tokens, and JSON downloads. It includes working examples such as dialogs and the complete Answers layout, alongside clearly scoped visual previews and archived assets. | Design-system site |
| Isolated design-review pages | Partially working | The badge gallery presents the badge family, and a separate prediction-filter exploration page lets reviewers switch filters inside isolated examples. Those preview filters do not change saved calls or the active profile filters. | Badge designs and prediction-filter option pages |

## 3. Open Questions

1. **Production accounts and persistence:** There is no account, database, or authentication backend. Sign-in, bookmarks, and prediction calls use tab-session storage, while follows, preferences, feedback, badges, and read/update state use local browser storage; what should persist across devices, and how should it be scoped to a real account?
2. **Unique user numbering:** No onboarding-generated user number or numbering service was found. Profile identities and membership details are examples; should a real Hunter/member number be created, and where should it appear?
3. **Meaning and source of interest change:** Collection percentages, rising/falling direction, and “updated hours ago” values are illustrative. What behavior will define interest, its seven-day comparison, update timestamps, and eligibility for a real-time change?
4. **Trend filters:** The active What’s Changing controls are biggest change and smallest change. Increasing, decreasing, and newest trend filters were not found in the active flow; are those still intended, or should the two existing sorts be the complete scope?
5. **Prediction refresh and alerts:** The deck uses a fixed sample catalog and dated fixtures rather than a daily publishing job. What supplies future predictions, closes voting, and sends the outcome alerts suggested by some copy?
6. **Outcome verification and Sharp Eye:** The verified-outcome catalog used for badge accuracy is empty. Preview results and aggregate vote splits are not verified evidence and do not award Sharp Eye; who or what will resolve outcomes in the real product?
7. **Digest publication and revisions:** The edition date is current, but summaries and revision identifiers are curated constants. What determines a genuinely new or revised update, produces the summaries, and decides how much belongs in one daily edition?
8. **Recommendation claims:** Most followed / Most active suggestions use curated priorities rather than measured rankings. Onboarding collections are interest-matched, but the initial Trendsetter suggestions are a fixed list; should those people also be matched to interests, and what evidence should support the ranking labels?
9. **Community data and shared collections:** Following activity, public profiles, collection lists, and exploring-member counts are fictional examples. There is no collection authoring, collaborative collection management, or live presence service; what should sharing a collection mean beyond linking to an existing collection page?
10. **Discussion, reporting, and feedback delivery:** Comments, likes, reports, article ratings, and recommendation choices remain in the browser. What moderation, reporting destination, shared discussion storage, and feedback-analysis process will be required?
11. **Answers evidence and generation:** Answers do not call an AI or search service, and the displayed source mix is illustrative. Which retrieval/generation service and source-attribution rules should replace the templates?
12. **Unfinished destinations:** Shop Now, Explore Solutions, and Show Osano lack their corresponding functional destinations or integrations. Should these be implemented, replaced, or removed from a production scope?
13. **Badge visibility and share identity:** Badge state supports visibility choices, but an exposed visibility control was not found in the rendered badge dialog. Badge sharing links to a generic gallery rather than a member-specific achievement; should readers be able to manage visibility and share a personal earned-badge page?
14. **Editorial and data operations:** Stories, creators, comments, activities, collection membership, summaries, and result examples are checked-in content. No CMS, ingestion, analytics pipeline, or live social update source exists in this repository; ownership and update workflows remain undefined.

## Features found beyond the supplied checklist

- Your Digest, including dated editions, numbered groups, individual catch-up, and Mark all as read.
- Saved-story management and the From Your Bookmarks resurfacing carousel.
- Interest-based local feed ordering and recommendation feedback.
- Article sentiment ratings and optional reasons/comments.
- Ask Trend Hunter, templated Answers, citation/source layouts, and follow-up threads.
- Following introduction/empty-state recommendations and dismissible feature announcements.
- Demo access, email/code/password/terms screens, profile-name editing, and logout.
- Light/dark themes, navigation drawers, toasts, and the animated custom 404 page.
- Prototype replay/reset settings and the design-system reference.
- A product suggestion carousel with example prices and nonfunctional shopping labels.
