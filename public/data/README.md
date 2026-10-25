# Exercise catalog provenance

The 1,324 exercise records in `exercises.json` were adapted from the local FitCircle repository's `public/data/exercises.json`, sourced from [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) at commit `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`.

The included text and data are licensed under MIT. See `exercises-LICENSE.txt`. This copy keeps the English name, taxonomy, equipment, target, secondary muscles, instructions, and steps. It removes translations, image and GIF paths, media IDs, and media attribution because the visual media has separate licensing and is not included here.

`Sample UI/shared/exercises.json` is the same catalog copied for the standalone Daily Workbench preview.

## Flow Exercise Dataset previews

[Flow Exercise Dataset](https://github.com/ozansozuozgit/flow-exercise-dataset) was imported at commit `961bb2739015da373daa43b960c28ee839fe93e6`. Its IDs and English names match all 1,324 local records. The `animation` field links 1,257 exercises to three SVG frames each (3,771 files). The other 67 have no animation and display instructions only. Both the React app and Daily Workbench concept use this catalog. The import can be reproduced with `node scripts/import-flow-exercises.mjs /path/to/flow-exercise-dataset`.

The copied source license, artwork dedication, notice, checksums, provenance, and import manifest live in `flow/`. The artwork is offered under a CC0 dedication to the extent of rights held. Its [NOTICE](https://github.com/ozansozuozgit/flow-exercise-dataset/blob/main/NOTICE.md) states most generation prompts are missing, third-party rights are not fully cleared, and exercise form has not been professionally reviewed. The UI labels the animation illustrative; motion speed is not training tempo. Review rights and form accuracy before relying on the artwork as coaching or releasing it publicly.

The original dataset's GIFs and thumbnails are credited to Gym Visual and are not covered by the text's MIT license. They were not copied from FitCircle.
