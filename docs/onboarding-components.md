# Onboarding component reference

This branch keeps the existing Trend Hunter design system's Barlow Condensed display font and Inter body font. The tokens and component rules needed by onboarding are extracted into `site/onboarding.css`; unrelated prototype styles are removed.

| Component | Existing DS treatment |
| --- | --- |
| Page spacing | `--spacing-page-2xl` (48px), `--spacing-layout-xl` (32px), `--spacing-layout-lg` (24px), `--spacing-layout-md` (16px) |
| Choice spacing | `--spacing-component-ms` (12px), `--spacing-component-sm` (8px), `--spacing-component-xs` (4px) |
| Connected progress | New DS pattern composed from existing fonts, colors, spacing, circle radius, stroke and check asset. Completed: filled accent circle/check. Current: outlined numbered circle and primary label. Upcoming: muted numbered circle. Skipped: muted number with an accessible Skipped label. |
| Topic tiles | Unselected background and gray hover treatment match collection pills; nine existing selected topic colors remain on hover; `aria-pressed` buttons, multiple selection |
| Answer pills | Reuse the collection pill component: centered uppercase Barlow Condensed label, rounded shape, dark surface and gray border; selected lime outline without a checkmark; at least four choices, single selection, click again to clear; two columns desktop, stacked on mobile |
| Collection pills | Dark surface, gray border; existing collection-name chevrons with sample direction/strength; selected lime outline without a checkmark; multiple selection |
| Question pills | Existing Answers suggestion style, gray collection border, lime sparkle and text centered together; two columns desktop, one mobile |
| Article alternatives | Existing compact story link: 48px square thumbnail plus uppercase Barlow Condensed headline; two columns desktop, stacked mobile |
| Primary CTA | Existing lime primary button, Take me to the Feed below articles |

## Journey and matching

Your interests → About you → Collections → Suggested Hunts. Skipping interests bypasses About you. Back/progress controls stay within onboarding. Clicking the logo clears the draft and completion marker, resets progress and returns to Your interests without deleting previously committed preferences.

Page headings use the full onboarding content width so they stay on one line on desktop. On smaller screens they wrap naturally at the existing type size. The first heading is “Pick the topics you’re curious about” and the Collections heading is “Collections you’ll want to explore”, both without subheadings.

Mind & Body maps to Health/Beauty/Fitness; Everyday Living to Food/Home/Tech/Family; Experiences to Culture/Travel. The largest selected group wins, with ties resolved by first selected interest. The first topic within that group chooses one stable question; Culture plus Travel chooses the say-yes question. All ten questions have at least four answers; curated fourth options retain the original choices and map to related collections. Topic or answer changes prune stale answers and unrelated collection selections.

Collections lists direct answer matches first and fills with curated neighboring collections to a minimum of four. Skipped answers use topics; skipped interests use curated defaults. Chevrons reuse the main prototype’s SVG and DS colors: rising points right in green, falling points left in red; lit segments represent the existing fixed sample percentage in quarter ranges. These are static illustrative values, not live analytics, and do not change with selection.

The Suggested Hunts stage is headed “Start with a hunt” with no subheading. It always shows four unique questions and two matching article links. Selected collections take priority. The heading-to-questions gap and questions-to-article-heading gap both use 48px; article heading-to-content uses 24px including row padding. The centered “Or try these articles” heading uses Inter body type with no final period. Skip has no underline.

## Interaction and exits

Connected progress uses `--size-onboarding-step-node`, composed from the DS 20px icon and 8px spacing tokens (28px). Connectors use the existing 1px stroke; the active circle uses the 2px focus stroke. Completed nodes reuse `assets/predictions/check.svg` inside the DS accent fill, with the primary-button foreground. Barlow Condensed labels use the existing 16px editorial style (14px on mobile), and numbers use Inter utility sizes. There is no visible Current step caption. Current labels are primary text with medium weight; completed/upcoming labels are muted. This is a newly documented component pattern, rather than a pre-existing off-the-shelf DS component.

The four positions remain fixed. Skipped steps keep their number and never show a completion check or green outgoing connector. The applicable current step uses `aria-current="step"`; accessible labels name each status. Previously visited steps retain native button navigation, unavailable future steps are disabled, and bypassed About you remains disabled when interests were skipped. The logo resets the indicator with the draft. Labels wrap within their columns on mobile.

Choices use native buttons with `aria-pressed`, visible keyboard focus, Enter/Space support and click-again deselection. Continue is disabled without a choice; Skip remains optional. Drafts survive tab reloads. Final save validates choices and rolls back all preference writes on failure, keeping the current page and showing an inline error.

Hunt and article links save choices, then open the existing main app. The primary CTA saves and shows the existing SVG ripple for eight seconds before opening the external feed. Recovery offers Try again and Back if the browser remains on the transition; Back restores the final step. Reduced motion uses static rings. Back/forward cache restoration clears the loader.

No destination screens or account backend live in this branch. Saved choices remain origin-local and do not transfer to a separately hosted main app. The demo password gate is access to the prototype, not a product onboarding step.
