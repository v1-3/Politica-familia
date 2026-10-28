# Family Atlas

Open **family-atlas.html** in a modern browser. It is a standalone, offline page: the charts, data, portraits, flags, party images, fonts and original PDF text are embedded. External source and book links require internet access.

Geometry, compatible matches and the group reading list each have their own person buttons and combination menu. Choose any individual, group or everyone independently in each section. Jucimar and Lucca have no catalog scores yet (see below), so their buttons are disabled in the matches and reading-list sections. The page-wide selection resets all three sections and controls the compass, axis comparison and original PDF columns. Clear shows an empty state; local controls remain usable. Books have their own matching method and minimum. “Download current selections” in Sources exports the selected groups as JSON. The source section separately offers the complete retained catalog and all precomputed combinations.

## Added to the supplied HTML

- A twelve-axis radar at the top of the page, with individual profiles, median and mean. Spokes use short labels such as “Democratic”.
- A two-dimensional geometric map of equal-weight RMS score distances, projection-quality disclosure and an exact distance matrix.
- Axis medians, means, raw MAD and ranges remain in the axis comparison. The separate family-statistics section and median explanation/demo have been removed as requested.
- Original PDF views for all eight people: countries, 64 ranked figures, 24 books, parties, ideology descriptions, distinctive axes and all 64 pages of extracted text. The four earlier reports include six eras each; the four newer reports (Rafael, Miguel, Jucimar and Lucca) include six values instead. Source images are included; books use author portraits, as in the PDFs.
- The original compass, pairwise gap comparison, illustrated catalog matches and group reading lists are retained.
- Median-profile matching is the initial view. Shared matching remains available; its minimum-person rule is deliberately sensitive to the least compatible person and is not an outlier-resistant estimator.

## Evidence and limits

The 96 numeric values come exactly from the eight user-supplied results URLs. The first four PDF summaries are dated October 17, 2026; Rafael’s is dated October 26, 2026; Miguel’s, Jucimar’s and Lucca’s are dated October 27, 2026. They use rounded values and retain their original catalog wording. Matches describe the test's catalog similarity rather than definitive political identities or endorsements.

The supplied HTML includes a catalog snapshot dated October 18, 2026, pinned to repository commit `d66d8747950045077770a89dfa565d173bb60964`. Its source metadata states that results were recomputed from published catalog data when the live API was unavailable. This revision preserves the previous 31 sets of group results and calculates Miguel and the 32 additional combinations from that same pinned snapshot. It does not claim a fresh live ranking. Search operates within the retained top matches shown by the page, not every original catalog item. Original PDF results are displayed separately and can differ from recomputed catalog results. The original Catholic recommendation filters in the links of Osmar, Miguel, Jucimar and Lucca are preserved, without inferring a religious identity.

Median reduces the influence of one extreme score but does not make a small family group statistically representative. With two people, median equals mean. The geometric map can compress distances; its exact RMS matrix is authoritative. RMS emphasizes larger per-axis gaps; the existing pair comparison uses the mean absolute gap, so the two measures differ intentionally.

## Jucimar and Lucca: what is and is not included

Jucimar and Lucca were added from their results URLs and their PDF reports (`evidence/add_new_reports.py`, `evidence/add_new_people.py`, `evidence/add_new_translations.py`). Everything that needs only their twelve scores is complete: radar, distance map, compass, axis comparison, pair gaps, medians and means for all 255 combinations, and the English and Portuguese PDF report views.

Catalog matches and books are **not** calculated for them. Those need the pinned 12axes catalog files (`evidence/catalog-snapshot/`), which are downloaded by `extend-family-catalog.py` and could not be fetched when they were added. Combinations that include either person therefore have exact medians but `matches: null`, and the matches and reading-list sections leave them out with a visible note. Their own catalog results remain visible in their PDF reports. `extend-family-catalog.py` still names Miguel as the person it adds and must be generalized before it can fill these gaps in.

The two October 27 PDFs count 274 ideologies; the pinned snapshot has 271. The reports come from the live site, the snapshot from October 18, so the catalog has grown between them.

## Editable source

`build-family.py` reads `source-template.html`, `evidence/html-embedded-data.json` and `evidence/pdf_profiles.json`. It adds the section templates, `enhancement.css`, chart and selection scripts, `preferences.js`, `report-locale.js`, `report-view.js` and `statistics.js`, then writes `family-atlas.html`, `index.html` and `site/index.html`. Everything needed for the standard build is in this repository.

`extend-family-catalog.py` reproduces Miguel’s catalog matches using the pinned source inputs. It verifies all original scores and rankings before extending the data. Missing upstream inputs are downloaded to the ignored `evidence/catalog-snapshot/` cache; this cache is not a website output.

`statistics.test.js` validates statistical formulas, medoids, MDS and edge cases. `validate-family.cjs` verifies the 96 input scores, 255 selection medians, 63 catalog-match selections, retained match minima, source completeness, script syntax and embedded images. Browser checks cover every selection state and every original report tab.
