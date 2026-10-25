# Healthy Life interface direction

This is a utility product with an established mobile kit. Daily Workbench is the chosen desktop direction; the member and expert Circle screens extend that system while the admin console keeps its navigation and visual language.

## Concept choices

| Direction | Signature moment | Fit | Decision |
| --- | --- | --- | --- |
| Daily Workbench | Topic rooms lead into a focused two-column conversation workspace | Familiar member navigation and a clear compose panel | Chosen |
| Guided Journey | A progressive, step-by-step social composer | Warm but slower for reading several posts | Saved as an alternative concept |
| Signal Index | Dense editorial feed with compact metadata | Strong scanability but less approachable for new members | Saved as an alternative concept |

## Circle concept card

- **Idea:** Better days are built in small conversations, grouped by the habits members are working on.
- **Metaphor:** A calm club room: a clear entrance, named rooms, and a quiet conversation table.
- **Signature:** The plum Circle hero opens to the three colored topic rooms; a room click narrows the feed and sets the composer’s destination.
- **Emotion:** Welcoming, focused, and safe.
- **Motion verb:** Settle. Room hover rises slightly; views change without theatrical animation.
- **Screenshot:** The Circle hero, room trio, feed, and composer visible together at desktop width.

## System

- **Palette:** plum `#52305c`, lime `#75d100`, lavender `#f3e8f9`, orange `#fff0dd`, warm white `#f7f4f8`, ink `#211725`. These extend the supplied logo and existing UI kit.
- **Type:** The app's existing sans-serif family. Headings use tighter tracking and a fluid scale; labels stay compact and readable.
- **Grid:** Three member rooms in a row, then a feed and composer at desktop width. On phones both areas stack in one column with full-width touch targets.
- **Shape:** Rounded cards and a more prominent rounded hero. Social content uses a restrained card rhythm so the writing remains primary.
- **Motion:** Short hover lift on rooms; no autoplay feed motion. Reduced-motion users retain the static layout without losing information.
- **Content:** Named rooms and seed posts are demo content. Live rooms and posts come from Supabase; no synthetic counts or invented public profiles are presented as real.

The Awwwards usability bar informed the scan order, mobile composition, accessible labels, and desktop/phone QA. This is a working product surface, so clarity takes precedence over spectacle.

## Daily tracking direction

The Track page serves members who want to record a meal or movement in seconds. Three layout ideas were considered: a detailed nutrition ledger, a step-by-step entry wizard, and a daily check-in with a visible quick form. The daily check-in was chosen because the primary action stays on screen with today's totals and log.

- **Idea:** One small entry updates the picture of today immediately.
- **Metaphor:** A personal day card with a short note area and a running record.
- **Signature:** The lime nutrition total and lavender movement total update beside a quick entry card; an existing entry can be repeated with one click.
- **Motion verb:** Settle. Tabs and controls respond quickly without adding scroll or autoplay animation.
- **Screenshot:** Two concise totals above a side-by-side quick entry and today's log on desktop.
- **Grid:** On desktop, a narrow quick entry card sits beside a wider log. On phones, quick entry comes first and optional macros stay collapsed.
- **Palette and type:** Existing plum, lime, lavender, warm white, and sans-serif kit. Large numeric totals carry emphasis; labels and action targets remain legible.
