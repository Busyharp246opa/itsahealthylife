# Desktop concept study

The separate public [landing page sample](04-landing/index.html) introduces both audiences before they enter the live app. Its research, imagery, interaction and QA notes are in [04-landing/DESIGN.md](04-landing/DESIGN.md). It is linked from the concept index but is not a fourth desktop workspace concept.

These are standalone, front-end desktop prototypes for member and expert roles. They use the existing logo, plum, lime, lavender, rounded controls, and the local demo's sample records. Daily Workbench now informs the member desktop shell in `src/`; the admin console keeps its existing UI.

## Shared brief

- **Audience:** members managing daily habits and experts managing coaching work.
- **Job:** show the next useful action without hiding the wider workspace.
- **Brand anchor:** “Small steps add up.” Progress should feel approachable, while expert operations remain precise.
- **Data:** clearly labelled sample data from the existing local demo; no prototype writes to Supabase.
- **Stack:** HTML, CSS, and small classic JavaScript files. The pages work through the existing Vite server and have direct `index.html` links for opening from the folder.
- **Motion:** short state transitions and hover/focus feedback. There is no loader or decorative animation; reduced motion removes transitions.

## 01 · Daily workbench

**Idea:** The product becomes a single desk for today's task, with the current work in the center and relevant context always within reach.

- **Metaphor:** a calm working desk.
- **Structure:** plum left navigation, broad central workspace, narrow right context rail.
- **Signature:** selecting a section repositions the active workspace marker and updates the right rail's next action.
- **Emotion:** capable, reassuring, quick.
- **Motion verb:** settle.
- **Screenshot moment:** the member's Train view with a seven-day schedule, selected program, and exercise finder; Track retains its nutrition figure and context rail.
- **Anchor:** members return to the same few daily actions; experts return to schedules and clients.
- **Hallmark macrostructure:** Workbench. Theme: custom Healthy Life light.
- **Score, originality / fit / feasibility / portability:** 3 / 5 / 5 / 3.

## 02 · Guided journey

**Idea:** Every role sees a short sequence from what is done to what comes next, so the platform teaches its workflow as it is used.

- **Metaphor:** a path of small steps.
- **Structure:** plum masthead, horizontal role navigation, wide stage panels linked by one progress line.
- **Signature:** selecting a stage moves the path indicator and reveals only its relevant action.
- **Emotion:** encouraging, human, uncluttered.
- **Motion verb:** advance.
- **Screenshot moment:** a large “Today” stage with nutrition and meals, followed by one clear next step.
- **Anchor:** the brand promise that small steps become a healthy life.
- **Hallmark macrostructure:** Narrative Workflow. Theme: custom Healthy Life warm.
- **Score, originality / fit / feasibility / portability:** 4 / 5 / 4 / 2.

## 03 · Signal index

**Idea:** One navigable index turns health and operations into a readable ledger of signals and decisions.

- **Metaphor:** a field guide or operating index.
- **Structure:** narrow dark identity rail, large typographic index, dense but calm detail pane.
- **Signature:** hovering an index row highlights it; selecting it updates the adjacent detail pane.
- **Emotion:** assured, focused, expert.
- **Motion verb:** lock.
- **Screenshot moment:** the Track index selected with a large 820 kcal figure and a precise meal ledger.
- **Anchor:** one platform serves two roles with different data density.
- **Hallmark macrostructure:** Index-First. Theme: custom Healthy Life contrast.
- **Score, originality / fit / feasibility / portability:** 4 / 4 / 4 / 2.

## Design system

| Token | Value | Purpose |
| --- | --- | --- |
| Plum | `#52305c` | identity, navigation, important type |
| Lime | `#75d100` | action and progress |
| Lavender | `#f2e3fa` | soft emphasis |
| Mist | `#f6f4f8` | canvas |
| Ink | `#141217` | body text |
| White | `#ffffff` | readable surfaces |

Typography uses Inter for the familiar product voice. Journey introduces Newsreader for a small amount of editorial display; Index uses Space Grotesk for display and IBM Plex Mono for labels. The prototypes fall back to system fonts if those Google fonts are unavailable.

## Comparison criteria

Review each at 1440 px and 390 px. Switch roles, navigate sections, try one primary action, then compare: orientation speed, day-to-day scanning, brand fit, and suitability for member and expert work. The final recommendation is based on those checks, not visual novelty alone.

## Recommendation

Use **Daily Workbench** as the desktop direction. Its persistent role and section navigation supports the expert calendar and client work, while the central Track card and meal log carry the current mobile visual language into a wider screen. The right rail makes the next action visible without moving the member's primary task. Guided Journey is useful for onboarding and first-use flows; Signal Index is a strong pattern for dense expert records.

## Training extension

The Daily Workbench preview adds member Train and expert Shared training sections. The member can create saved programs, activate one, choose exercises for each weekday, set target sets and reps, increment the reps completed today, and share a program after adding a clearly labelled sample booking. The expert view is read only. The exercise finder uses all 1,324 text records copied from FitCircle; the source's separately licensed images and GIFs are excluded. Program and booking state in the preview is in memory and resets on reload.

The production implementation uses the existing Vite/React stack. Its desktop member layout adopts the Workbench's plum navigation and roomy canvas; the phone layout keeps the established brand shell and adds Train as a sixth action. Training forms are intentionally still at rest, with immediate button feedback. This supports focused workout logging and reduced-motion preferences without a loader or decorative animation.

Open `index.html` through the local Vite server at `http://127.0.0.1:5173/Sample%20UI/index.html`, or open this file directly from the folder. Every concept link points to its `index.html`, and the previews use classic scripts so a local-file browser can load them without a module server. Captured desktop and mobile screens are in `output/`. These previews are design studies with in-memory actions; the React app has a separate persistent training implementation.
