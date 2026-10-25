# Healthy Life landing page concept

## Brief and source

The approved public page introduces a responsive wellbeing platform to UK members/trainees and trainers, then sends each role to the correct live account form. The noindex files here remain the design source; a preparation script generates the public homepage at `/` and story at `/about`. `/member`, `/experts`, and `/admin` remain separate workspaces.

Research source: [the existing It's a Healthy Life website](https://www.itsahealthylife.co.uk/), reviewed on 25 October 2026. Its current positioning is a London-developed service for the UK that combines exercise, approachable food, expert mentorship and community. The new page paraphrases that positioning and describes capabilities already in the current web platform. It does not repeat the old site's price, app-store availability or unverified claims. None of the old site's restricted photographs or body copy were copied.

Assumption: “trainer” in marketing means the platform's `expert` role. A new trainer first creates an account and submits an application; an admin must approve it before the full expert workspace opens.

## Concept exploration

| Territory | Idea | Signature | Emotion | Screenshot | Anchor | O / Fit / Feasible / Portability* |
| --- | --- | --- | --- | --- | --- | --- |
| Daily rhythm | A day has movement, food, people and momentum as four selectable chapters. | Selecting a chapter changes its editorial photograph and story. | Capable, optimistic. | Hero running toward dawn followed by the four-part day. | The original site promises a whole-lifestyle approach, and the product has daily tracking plus weekly training. | 4 / 5 / 5 / 2 |
| London's morning | The site is a dawn journey through the city from first movement to a shared evening. | Sky colour changes with scroll. | Cinematic, local. | Runner against London at sunrise. | The brand was developed in London for the UK. | 4 / 4 / 3 / 3 |
| Coaching conversation | Every section is a back-and-forth between member and trainer. | Two editorial columns exchange short prompts. | Human, direct. | Split member/trainer cards. | The app connects members with booked experts. | 3 / 5 / 4 / 3 |

*Higher is better except portability, where lower means more specific to this product.

Selected: **Daily rhythm**, because the four-part system runs from hero to feature interaction to the two audience paths while staying clear about what visitors can do.

## Concept card

- **Idea:** A healthier life is built through the parts of an ordinary day.
- **Metaphor:** A day in motion, made of four approachable moments.
- **Signature:** The accessible Move / Nourish / Connect / Grow tabs pair four original editorial photographs with one changing content panel.
- **Emotion:** Energetic but unpressured in the first three seconds.
- **Motion verb:** Advance. Tabs, links and CTAs move a few pixels in one direction; chapter photos fade between scenes.
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

Display is Bricolage Grotesque 800 with tight tracking. Host Grotesk handles reading and UI. Both are locally served WOFF2s from Google Fonts under the Open Font License. Body copy is 16–18 px at comfortable line lengths. The grid uses generous outer gutters, a split hero, a tab list next to a photo and story panel, an image/text coaching spread, then equal member/trainer cards. Corners are mostly square.

The hero copy and account actions are visible from the first paint. GSAP drives an unobtrusive ticker; CSS fades the chapter photos. Reduced-motion mode disables continuous motion. There is no loader, WebGL or synthetic app screenshot.

## Imagery and implementation

- `assets/morning-movement.webp`: original generated hero photograph. Prompt: adult woman moving up broad London park stairs at dawn, deep plum activewear, lime detail, editorial realism, person on right with negative space for type, no logos or text.
- `assets/guided-training.webp`: original generated trainer/client photograph. Prompt: respectful mobility coaching in a warm contemporary studio, natural light, candid realistic people, no logos or text.
- `assets/approach-move.webp`, `approach-nourish.webp`, `approach-connect.webp`, and `approach-grow.webp`: four original generated editorial photographs of studio training, preparing lunch, a trainer conversation, and friends after a park workout. Each supports the corresponding tab and is optimized to WebP.
- `assets/story-walk.webp` and `story-table.webp`: original generated photographs for the Our story page. The split hero shows a morning walk in London; the story section shows friends sharing a meal. `story-walk-mobile.webp` is a smaller responsive version for phones. These replace the page's earlier text-only presentation without changing its factual copy or account paths.
- Source PNGs were generated with the built-in image tool and optimized to WebP for this page. `assets/og.png` is a 1200 × 630 capture of the finished hero made with the awwwards OG script.
- The supplied `Frame.png` is copied as `assets/brand-mark.png`. White brand text is set in HTML because the supplied full wordmark has dark lettering that disappears on plum.
- HTML/CSS/classic JavaScript and a local GSAP browser build keep the sample directly openable from disk. The repository's Vite build copies `Sample UI/` into `dist` for a production preview.

## Navigation and QA

The member card links to `/member?auth=signup` and `/member?auth=login`. The trainer card links to `/experts?auth=signup` and `/experts?auth=login`. On the local Vite host those stay local; when opened from disk they point to the deployed app. The connected Auth screen reads `auth=signup` to open the correct form. Returning users also find both login paths in the desktop header and phone menu. No sample form writes data.

Page set: `index.html`, `about.html`, and `404.html`. These source copies remain `noindex` for design review. The public copies have canonical `/` and `/about` URLs, omit review-only labels, and share the original imagery and interaction. The source site's factual inspiration is linked in the sample footer. The page does not present a subscription price because the current checkout is simulated.

The Our story page uses a split plum hero with a large photograph, followed by a charcoal editorial reading section with a second photograph and three concise pillars. Both photographs have descriptive alt text and responsive crops. The same member and trainer links remain in the header, mobile menu, and closing section.

The story revision was checked in the production build at 1440 and 390 CSS px: both photographs loaded, the phone loaded the smaller hero asset, links and the in-page story anchor worked, no horizontal overflow or console errors occurred, and an axe scan found no serious or critical violations. The Awwwards screenshot pass reported no failed requests, no hidden text in reduced-motion mode, no visible keyboard-focus failures, and zero serious accessibility violations. A static-build audit had zero failures; the robots and sitemap warnings are expected for this noindex preview.

QA at 1440 and 390 CSS px: two full awwwards browser passes before the photography revision; zero console or failed requests, zero horizontal overflow, zero serious axe violations, visible keyboard focus, reduced-motion content visible, no inert primary hover target, mobile LCP 2384 ms under a throttled connection and CLS 0. The audit had zero failures. The remaining robots/sitemap warnings are intentional because this is a noindex sample. Member and trainer registration/login links were followed in the live local app and opened the expected form. After the photography revision, browser checks confirmed that all four selected photos load, the desktop and phone layouts have no horizontal overflow, and no console errors occur.

Self-review from the captured frames: Design 8.4, Usability 8.2, Creativity 8.1, Content 8.2. A real commissioned brand campaign and final legal/commercial copy would improve the public site before a commerce release.
