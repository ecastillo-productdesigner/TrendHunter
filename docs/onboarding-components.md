# Onboarding component reference

The standalone Onboarding branch uses the existing Trend Hunter DS: Barlow Condensed display type, Inter body type, lime accents, dark surfaces, shared spacing and pill components. Question and answer wording is hypothetical prototype content based on the supplied topic list.

## Journey

Mind & Body → Everyday Living → Experiences → Suggested Hunts.

The first three pages each show one question with exactly four answer pills. They replace the former Your interests, About you and Collections selection stages. The final page retains four suggested hunts, two matching article alternatives and Take me to the Feed.

| Group | Available question topics, in fallback order |
| --- | --- |
| Mind & Body | Andropause & Hormonal Midlife; Preventative Health; Mind & Body for Families |
| Everyday Living | Food as an Experience; Getting Dressed as the Event; Planning With AI |
| Experiences | Budgeted Living; Sober-Curious Living; Smart Home & Energy |

Question matching uses saved preferences from this preview's browser origin. Explicit followed collections take priority, followed by the number of matching saved topics. First selected topic and attachment order resolve ties. An unmatched group uses its first listed topic. This chooses a question topic; it does not infer age, family status or a health condition. A fresh journey snapshots the matching context but starts without preselected answers. The snapshot and selections survive reloads, so questions do not reroll halfway through the flow.

Getting Dressed as the Event, Planning With AI and Sober-Curious Living are question themes. Recommendations reuse related collections that already exist in the prototype; no new collection, article or Answers destination pages are introduced.

## Components and interactions

| Component | Existing DS treatment |
| --- | --- |
| Page heading | Make this Hunt a Little More About You on all three questions; full content width; uppercase Barlow Condensed |
| Question | Centered Barlow Condensed legend; the supplied single-question layout |
| Answer pills | Four dark, rounded pills with gray borders and centered uppercase labels; two columns desktop, one mobile |
| Selection | Lime outline, no checkmark; one answer per question; clicking again clears only that response |
| Actions | Existing primary Continue button, disabled until the current question has an answer; plain Skip without an underline |
| Page spacing | Existing 48px page gaps, 24px question-to-answer gap and 24px/48px answer-grid gaps |
| Progress | Four connected nodes labeled Mind & Body, Everyday Living, Experiences and Suggested Hunts |
| Suggested hunts | Existing gray-outline question pills with an inline lime sparkle; four unique links |
| Article alternatives | Existing 48px square image and compact uppercase headline; two desktop columns, stacked mobile |

Continue advances to the next group. Skip clears only that question's draft response and advances. Back and visited progress buttons preserve all other responses; visited-step availability also survives reload. A skipped group retains a muted number; completed groups show the plain check inside a lime circle. The current group has an outlined lime number and primary label. There is no visible Current step caption. Native buttons expose aria-pressed and aria-current; focus rings and keyboard activation remain available.

The logo clears all three draft answers and returns to Mind & Body while retaining the saved-interest matching context and committed preferences. Old topics/about-you/vibe/focus URLs map to the first question; old collections/trend-setters URLs map to Experiences; review maps to Suggested Hunts.

## Recommendations and persistence

The three responses each map to real, curated collection metadata. Recommendations take one direct match from each answered group before adding further matches. Skipped questions do not contribute an answer; if all are skipped, the selected question topics supply the fallback. At least four unique collection records support the four hunt suggestions. Article alternatives use real matching stories and take one per collection before taking a second from any one collection.

Completion saves responses only. It does not change topic preferences, follow collections, follow writers or overwrite prediction/profile activity. Previously committed matching answers survive a skipped response. Failed saves retain the draft and show an inline retry error.

The draft uses trendhunter.onboarding-draft.v3 so unfinished selections from the removed flow cannot reappear. Answers remain browser-local in trendhunter.onboarding-answers.v1. No account backend or cross-origin transfer is implied.

Hunt and article links save responses and open the existing main prototype. Take me to the Feed retains the eight-second SVG setup transition and its retry/Back recovery. The demo gate is prototype access, not a product onboarding step.
