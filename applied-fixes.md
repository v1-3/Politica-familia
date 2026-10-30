# Applied review — October 29, 2026

Implemented the approved catalog, recommendation, translation, readability and delivery fixes. Changes are local; GitHub has not been updated.

- Refreshed all nine individual summaries and all 511 nonempty combinations together against upstream commit `44417356172d18f98c0597c191a3b225211380c6`.
- Personality areas now use all twelve axes, the source occupation groups, and exclusions for featured and earlier winners. Country/party areas retain their source axis subsets with those exclusions.
- Descriptive context uses one-decimal source rounding and shows all tied axes. Language changes do not change ranking order.
- Catalog names, categories, descriptions, roles, periods and book titles have Portuguese/English metadata. Search recognizes either language. Descriptions are available in expandable cards.
- Preserved the expanded twelve-book list; single-person selections also expose the source's separate three-book selection. Historical PDF recommendations remain distinct.
- Clarified minimum individual fit versus fit to the group median, rare combinations, and all selected recommendation filters. Preserved the group eligibility intersection.
- Increased small attribution/navigation text. Measured visible text contrast in both themes, checked mobile width 320px and desktop width 1280px, and verified section controls and empty states.
- Online HTML is now about 73 KB, with separate versioned data, fonts and image assets. This is an HTML size measurement, not total download size or a load-time benchmark. The complete offline edition remains about 70.3 MB. Data and images are identical across editions.
- Updated documentation and test counts. Original 108 URL scores and all eight historical PDF reports are unchanged.

Validation passed: 826,591 independent numeric checks, 9,198 area recommendations, all 511 catalog combinations, all 512 selection states, 976 unique extracted media assets, and report completeness. Targeted browser checks included Jucimar + Lucca, Julia's books, empty selections, both languages, both themes, cross-language search and loaded images. No browser errors were captured. This is not exhaustive certification of every device or accessibility requirement.

## 3D question

For all nine people, classical MDS retains 70.225% of squared-distance variation in two dimensions and 81.242% in three. Normalized distance error falls from 0.2612 to 0.1807. These figures describe the projection of the supplied scores, not the scientific validity of the test. Selected subsets will have different figures.

A true third MDS coordinate is now implemented after approval. The default 3D cube supports drag, touch, keyboard arrows, zoom and reset; a 2D toggle and the exact distance table remain available. Each selected group gets its own three-dimensional calculation and quality figure. Both languages and themes are supported. Orthographic rotation and uniform axis scaling preserve the calculated geometry. The matrix remains unchanged when rotating or switching views. Tests cover all 512 selection states, including a tetrahedron that is exact in 3D and compressed in 2D. GitHub has not been updated.

Method reference: [R classical multidimensional scaling documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cmdscale.html).

## Additional approved compass view

Added a separate 3D compass with original economic-right, authority and traditionalism coordinates. As requested, depth is now progressive–traditional only (`100 − mor`), with no religion component. All axes use fixed 0–100 scales. Median display, shared selection, 2D switching, bilingual text and dark mode remain available. Both 3D graphs display each person's first initial inside their point, with colors and full names to distinguish repeated initials.

## Unified glass interface and cube controls

Replaced all separate person pickers and preset-combination menus with one floating, horizontally scrollable bar. Every graph, recommendation, book and historical-report section follows its selection. Original bars are the only axis viewer. Added glass surfaces with high-contrast text and opaque fallbacks. Both 3D views support wheel zoom and non-selectable labels. The compass shows full pole names outside the cube and smoothly colored walls based on the existing eight-region palette, with a separately explained progressive–traditional tint. No input scores, matches or distance calculations changed.

The revised compass tests explicitly vary religion from 0 to 100 for every family member and verify that all three compass coordinates stay unchanged.

## Compact controls and mobile columns

Removed the visible 2D/3D toggle and all rotation, zoom and reset buttons from both cubes. Drag, wheel and keyboard interaction remain; pinch zoom and double-click reset were added. The global selector uses up to two rows before horizontal scrolling. Mode selectors, highlighted values and inset panels use the same glass surfaces.

## Two-column revision — October 30, 2026

Replaced mobile card rails with two simultaneously visible columns for axes, matches, books and reports. Removed internal report scrolling. Match cards are approximately half their previous height. Images fill the image area; flags stretch to its edges. Reduced padding, line spacing and repeated text while retaining scores, source links and expandable descriptions. Historical descriptions and summaries are collapsed initially. Replaced filter sliders with compact percentage inputs. Removed the entire pair-comparison section and axis-detail box. Fixed the joined median label and removed redundant mobile axis numbering.

Verified two-column layouts at 320px without card or score overflow, plus English/light and Portuguese/dark views at 390px. Fixed selection-triggered scroll jumps by preserving the visible section's position across redraws; toggling a person kept the section within one pixel of its prior position. Delivery validation confirms all 108 original scores, historical PDFs and 976 media assets are unchanged. All 511 combinations and generated script syntax pass validation. Changes remain local.

## Adaptive desktop columns

The two-column layout is now a minimum, not a desktop limit. Wider content areas automatically fit additional 280px-or-wider cards. Verified axes, matches, books and reports at 320/768px (two columns), 1024px (three), 1280px (four) and 1920px (six), with no clipped scores or horizontal overflow. Mobile retains two columns. Rebuilt online and offline editions.
