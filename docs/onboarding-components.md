# Onboarding component reference

This branch keeps the existing Trend Hunter design system's Barlow Condensed display font and Inter body font. The tokens and component rules needed by onboarding are extracted into `site/onboarding.css`; unrelated prototype styles are removed.

| Component | Existing DS treatment |
| --- | --- |
| Page spacing | `--spacing-page-2xl` (48px), `--spacing-layout-xl` (32px), `--spacing-layout-lg` (24px), `--spacing-layout-md` (16px) |
| Choice spacing | `--spacing-component-ms` (12px), `--spacing-component-sm` (8px), `--spacing-component-xs` (4px) |
| Topic tiles | Nine existing topic colors; `aria-pressed` buttons, multiple selection |
| Answer pills | Reuse the collection pill component: centered uppercase Barlow Condensed label, rounded shape, dark surface and gray border; selected lime border and right-side plain lime tick; three choices, single selection, click again to clear; three columns desktop, stacked on mobile |
| Collection pills | Dark surface, gray border; selected lime border and right-side plain lime tick; multiple selection |
| Question pills | Existing Answers suggestion style, gray collection border, lime sparkle; two columns desktop, one mobile |
| Article alternatives | Existing compact story link: 48px square thumbnail plus uppercase Barlow Condensed headline; two columns desktop, stacked mobile |
| Primary CTA | Existing lime primary button, Take me to the Feed below articles |

## Journey and matching

Your interests → About you → Collections → Suggested Hunts. Skipping interests bypasses About you. Back/progress controls stay within onboarding. Clicking the logo clears the draft and completion marker, resets progress and returns to Your interests without deleting previously committed preferences.

Mind & Body maps to Health/Beauty/Fitness; Everyday Living to Food/Home/Tech/Family; Experiences to Culture/Travel. The largest selected group wins, with ties resolved by first selected interest. The first topic within that group chooses one stable question; Culture plus Travel chooses the say-yes question. All ten questions have exactly three answers. Topic or answer changes prune stale answers and unrelated collection selections.

Collections lists direct answer matches first and fills with curated neighboring collections to a minimum of four. Skipped answers use topics; skipped interests use curated defaults. Metadata represents prototype recommendations, not measured popularity.

Suggested Hunts always shows four unique questions and two matching article links. Selected collections take priority. The heading/subtitle-to-questions gap and questions-to-article-heading gap both use 48px; article heading-to-content uses 24px including row padding. Both helper headings use centered Inter body type, with no final period. Skip has no underline.

## Interaction and exits

Choices use native buttons with `aria-pressed`, visible keyboard focus, Enter/Space support and click-again deselection. Continue is disabled without a choice; Skip remains optional. Drafts survive tab reloads. Final save validates choices and rolls back all preference writes on failure, keeping the current page and showing an inline error.

Hunt and article links save choices, then open the existing main app. The primary CTA saves and shows the existing SVG ripple for eight seconds before opening the external feed. Recovery offers Try again and Back if the browser remains on the transition; Back restores the final step. Reduced motion uses static rings. Back/forward cache restoration clears the loader.

No destination screens or account backend live in this branch. Saved choices remain origin-local and do not transfer to a separately hosted main app. The demo password gate is access to the prototype, not a product onboarding step.
