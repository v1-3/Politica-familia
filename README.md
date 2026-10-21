# Family Atlas

Open **family-atlas.html** in a modern browser. It is a standalone, offline page: the charts, data, portraits, flags, party images, fonts and original PDF text are embedded. External source and book links require internet access.

Geometry, compatible matches and the group reading list each have their own person buttons and combination menu. Choose any individual, pair, trio or everyone independently in each section. The page-wide selection resets all three sections and controls the compass, axis comparison and original PDF columns. Clear shows an empty state; local controls remain usable. Books have their own matching method and minimum. “Download current selections” in Sources exports the selected groups as JSON. The source section separately offers the complete retained catalog and all precomputed combinations.

## Added to the supplied HTML

- A twelve-axis radar at the top of the page, with individual profiles, median and mean. Spokes use single question labels such as “Democratic?”.
- A two-dimensional geometric map of equal-weight RMS score distances, projection-quality disclosure and an exact distance matrix.
- Axis medians, means, raw MAD and ranges remain in the axis comparison. The separate family-statistics section and median explanation/demo have been removed as requested.
- Original PDF views for all four people: countries, 32 ranked figures, 12 books, parties, six eras each, ideology descriptions, distinctive axes and all 32 pages of extracted text. Source images are included; books use author portraits, as in the PDFs.
- The original compass, pairwise gap comparison, illustrated catalog matches and group reading lists are retained.
- Median-profile matching is the initial view. Shared matching remains available; its minimum-person rule is deliberately sensitive to the least compatible person and is not an outlier-resistant estimator.

## Evidence and limits

The 48 numeric values come exactly from the four user-supplied results URLs. PDF summaries are dated October 17, 2026, use rounded values and retain their original catalog wording. Matches describe the test's catalog similarity rather than definitive political identities or endorsements.

The supplied HTML includes a catalog snapshot dated October 18, 2026, pinned to repository commit `d66d8747950045077770a89dfa565d173bb60964`. Its source metadata states that results were recomputed from published catalog data when the live API was unavailable. This revision preserves that snapshot and its 15 sets of group results; it does not claim a fresh live ranking. Search operates within the retained top matches shown by the page, not every original catalog item. Original PDF results are displayed separately and can differ from recomputed catalog results. Osmar's original Catholic recommendation filter is preserved, without inferring a religious identity.

Median reduces the influence of one extreme score but does not make a group of four statistically representative. With two people, median equals mean. The geometric map can compress distances; its exact RMS matrix is authoritative. RMS emphasizes larger per-axis gaps; the existing pair comparison uses the mean absolute gap, so the two measures differ intentionally.

## Editable source

`build-family.py` reads the original Desktop HTML and `evidence/pdf_profiles.json`, injects `enhancement.html`, `reports-section.html`, `enhancement.css`, `enhancement.js`, `scoped-controls.js` and `statistics.js`, then writes `family-atlas.html` and `site/index.html`.

`statistics.test.js` validates statistical formulas, medoids, MDS and edge cases. `validate-family.cjs` verifies the 48 input scores, 15 precomputed selection medians, retained match minima, source completeness, script syntax and embedded images. Browser checks cover all 16 selection states and every original report tab.
