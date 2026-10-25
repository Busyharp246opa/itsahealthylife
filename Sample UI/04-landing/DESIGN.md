# Healthy Life landing page concept

## Brief and source

The public page introduces a responsive wellbeing platform to UK members/trainees and trainers, then sends each role to the correct live account form. It is a standalone design sample, not a replacement for `/member`, `/experts`, or `/admin`.

Research source: [the existing It's a Healthy Life website](https://www.itsahealthylife.co.uk/), reviewed on 25 October 2026. Its current positioning is a London-developed service for the UK that combines exercise, approachable food, expert mentorship and community. The new page paraphrases that positioning and describes capabilities already in the current web platform. It does not repeat the old site's price, app-store availability or unverified claims. None of the old site's restricted photographs or body copy were copied.

Assumption: “trainer” in marketing means the platform's `expert` role. A new trainer first creates an account and submits an application; an admin must approve it before the full expert workspace opens.

## Concept exploration

| Territory | Idea | Signature | Emotion | Screenshot | Anchor | O / Fit / Feasible / Portability* |
| --- | --- | --- | --- | --- | --- | --- |
| Daily rhythm | A day is an orbit with movement, food, people and momentum as four selectable points. | Selecting a chapter moves the orbit marker and changes the story. | Capable, optimistic. | Hero running toward dawn followed by the four-part day. | The original site promises a whole-lifestyle approach, and the product has daily tracking plus weekly training. | 4 / 5 / 5 / 2 |
| London's morning | The site is a dawn journey through the city from first movement to a shared evening. | Sky colour changes with scroll. | Cinematic, local. | Runner against London at sunrise. | The brand was developed in London for the UK. | 4 / 4 / 3 / 3 |
| Coaching conversation | Every section is a back-and-forth between member and trainer. | Two editorial columns exchange short prompts. | Human, direct. | Split member/trainer cards. | The app connects members with booked experts. | 3 / 5 / 4 / 3 |

*Higher is better except portability, where lower means more specific to this product.

Selected: **Daily rhythm**, because the four-part system runs from hero to feature interaction to the two audience paths while staying clear about what visitors can do.

## Concept card

- **Idea:** A healthier life is built through the parts of an ordinary day.
- **Metaphor:** A day in motion; a simple orbit instead of a perfect linear plan.
- **Signature:** The accessible Move / Nourish / Connect / Grow tabs drive one rotating orbit marker and one editorial content panel.
- **Emotion:** Energetic but unpressured in the first three seconds.
- **Motion verb:** Advance. Tabs, links and CTAs move a few pixels in one direction; the orbit turns slowly at rest.
- **Screenshot:** Plum editorial hero, lime “today,” original morning runner photograph and paired member/trainer actions.

## Visual system

| Role | Token |
| --- | --- |
| Plum ground | `#45254f` |
| Deep curtain | `#301938` |
| Action lime | `#8de000` |
| Warm paper | `#f5f3ee` |
| Lavender panel | `#e9dbef` |
| Ink | `#23192a` |

Display is Bricolage Grotesque 800 with tight tracking. Host Grotesk handles reading and UI. Both are locally served WOFF2s from Google Fonts under the Open Font License. Body copy is 16–18 px at comfortable line lengths. The grid uses generous outer gutters, a split hero, a tab list next to the orbit, an image/text coaching spread, then equal member/trainer cards. Corners are mostly square; only orbit and small navigation controls are circular.

The page is mostly static at rest. GSAP drives a short hero entrance, an unobtrusive ticker and the orbit. Reduced-motion mode keeps all content visible and disables continuous motion. There is no loader, WebGL or synthetic app screenshot.

## Imagery and implementation

- `assets/morning-movement.webp`: original generated hero photograph. Prompt: adult woman moving up broad London park stairs at dawn, deep plum activewear, lime detail, editorial realism, person on right with negative space for type, no logos or text.
- `assets/guided-training.webp`: original generated trainer/client photograph. Prompt: respectful mobility coaching in a warm contemporary studio, natural light, candid realistic people, no logos or text.
- Both source PNGs were generated with the built-in image tool and optimized to WebP for this page. `assets/og.png` is a 1200 × 630 capture of the finished hero made with the awwwards OG script.
- The supplied `Frame.png` is copied as `assets/brand-mark.png`. White brand text is set in HTML because the supplied full wordmark has dark lettering that disappears on plum.
- HTML/CSS/classic JavaScript and a local GSAP browser build keep the sample directly openable from disk. The repository's Vite build copies `Sample UI/` into `dist` for a production preview.

## Navigation and QA

The member card links to `/member?auth=signup` and `/member?auth=login`. The trainer card links to `/experts?auth=signup` and `/experts?auth=login`. On the local Vite host those stay local; when opened from disk they point to the deployed app. The connected Auth screen reads `auth=signup` to open the correct form. Returning users also find both login paths in the desktop header and phone menu. No sample form writes data.

Page set: `index.html`, `about.html`, and `404.html`. The sample is `noindex` until chosen as the production landing page. The source site's factual inspiration is linked in the footer. The page does not present a subscription price because the current checkout is simulated.

QA at 1440 and 390 CSS px: two full awwwards browser passes; zero console or failed requests, zero horizontal overflow, zero serious axe violations, visible keyboard focus, reduced-motion content visible, no inert primary hover target, mobile LCP 2384 ms under a throttled connection and CLS 0. The audit has zero failures. The remaining robots/sitemap warnings are intentional because this is a noindex sample. Member and trainer registration/login links were followed in the live local app and opened the expected form. The orbit tab and arrow-key control work.

Self-review from the captured frames: Design 8.4, Usability 8.2, Creativity 8.1, Content 8.2. A real commissioned brand campaign and final legal/commercial copy would improve it before replacing the public root.
