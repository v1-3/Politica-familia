# Family Atlas

Nine people, 108 exact URL scores, 511 nonempty combinations. Portuguese/English and light/dark themes. One compact floating person bar controls every section. It uses one row on wide screens and two rows before horizontal scrolling on narrower screens. Preset combinations are removed. The axes section uses only original bars. Liquid glass surfaces support both themes and a solid-color fallback. Axes, matches, books and reports use at least two visible columns. Wider screens add columns automatically with a 280px preferred minimum card width, without card carousels or internal report scrolling. Images fill their frames. Repeated explanations are removed and historical descriptions expand on demand. The pair-comparison section and axis-detail box are removed.

## Results and provenance

Catalog pinned to `44417356172d18f98c0597c191a3b225211380c6` (October 28, 2026), recalculated October 29: 274 ideologies, 314 countries/historical states, 655 personalities, 203 parties. Input scores are unchanged. Every selected recommendation filter must allow a candidate.

Median-profile matching uses rounded axis-wise medians. Shared matching ranks minimum individual fit, then median, mean and canonical English name. Translation changes display names, not order. Personality areas use occupation groups and all twelve axes; country/party dimensions use source subsets. Featured and earlier area winners are excluded. Descriptive context retains tied axes.

Twelve group books remain available. For one selected person a separate disclosure shows the source's three-book selection from top eight personalities and category winners. Percentages measure author profiles, not book contents.

Nine original PDF reports are available (72 pages, 27 books), including Julia's October 30 report. Earlier reports remain unchanged. Julia's 22 displayed compatibility scores match source calculations at commit `eec01a457e8d677ca9588ac6db0e1c562272d4ee` after rounding. Report results retain their own dates; group comparisons continue to use the shared October 28 catalog.

The interactive map displays rotatable 3D classical MDS of equal-weight RMS gaps; its exact distance matrix is authoritative. All nine people retain 70.2% of squared-distance variation in 2D and 81.2% in 3D. Each selection recalculates this quality. Drag or use keyboard arrows to rotate; pinch, wheel or keyboard plus/minus zoom; double-click or Home resets. Visible rotation, zoom, reset and 2D/3D buttons have been removed. Controls support touch, keyboard and both languages. Rotation uses an orthographic view with equal axis scales, without changing the underlying distances. No person is automatically excluded.

The political compass uses the same gesture-based 3D interaction. X and Y keep the original economic-right and authority formulas. Depth is traditionalism, `100 − mor`: progressive at 0, traditional at 100. Religion has no influence on compass coordinates. All compass axes keep a fixed 0–100 scale. The median marker projects the axis-wise median input profile. Every person's 3D marker carries their first initial; colors, names and tooltips distinguish shared initials. Both cubes rotate independently. Graph text cannot be selected while dragging. Compass poles use descriptive labels outside the cube. Smooth rear-wall colors interpolate the original eight-region palette; the progressive–traditional axis adds a 24% maximum pink-to-ochre tint without introducing new ideology classifications.

## Build

Run `python build-family.py`. It generates self-contained `family-atlas.html` and `index.html`, then `publish-online.py` creates `site/index.html`, versioned assets in `site/assets/`, and `site/family-atlas-offline.html`. Images load as needed online; the standalone download embeds them. GitHub Actions publishes `site/` with repository-relative paths.

Editable sources: `source-template.html`, `enhancement.*`, `scoped-controls.js`, `glass.css`, `compact.css`, `compact-ui.js`, `geometry-3d.js`, `preferences.js`, `catalog-ui.js`, `report-view.js`, `report-locale.js`, `statistics.js`, and JSON in `evidence/`.

Run `python extend-family-catalog.py --refresh` for an explicit complete catalog refresh; ordinary runs preserve existing results. Inputs use the ignored commit-specific cache. Run `python finalize-catalog.py` before building for localized individual-book metadata.

## Validation

`node geometry-3d.test.cjs`: drag, pinch, pointer cleanup, wheel, double-click, keyboard and selection prevention.

`node statistics.test.js`: summaries, distances, MDS, all 512 selection states.
`node validate-family.cjs`: 108 scores, 511 groups, matches, embedded images and script syntax.
`node validate-reports.cjs`: historical report metadata.
`python validate-refresh.py`: independent full-catalog dimension, ranking, filter and localization checks.

`python validate-delivery.py`: online/offline data and image parity, asset paths, unchanged URL scores and PDF evidence.

Browser verification covers languages, themes, global selection, empty states, search, source books and responsive layout.
