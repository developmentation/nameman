# NAMEMAN Numerology Name Analyzer (web rebuild)

A standalone, modern rebuild of the original Visual Basic *"Your Soular System / Nameman"*
numerology analyzer (`NUM-92.FRM`). It turns a name into the same talents, elements,
dimensions, centroid (soul angle) and evolution charts the VB app produced, generated
dynamically as SVG (no bitmaps).

## Run it
Open **`index.html`** in any browser. No build, no server. It loads Vue 3 from a CDN and
two local scripts (`engine.js`, `charts.js`).

Open **`tests.html`** to run the eval suite in the browser, or run it headless:

```
node test.js
```

## Files
| File | Purpose |
|------|---------|
| `index.html` | Vue 3 (CDN) UI |
| `engine.js`  | Pure, DOM-free math. A faithful port of the VB logic. Works in browser and Node. |
| `charts.js`  | Dynamic SVG renderers (soul star, ranks, bands, scales, pillars, life path, mandala, compass, music, pyramid) |
| `test.js`    | Node eval suite (48 assertions) |
| `tests.html` | Same evals, in-browser, with side-by-side comparison tables |

## The algorithm (cross-checked: VB code, handwritten notes pages 1 to 9, and screenshots)

1. **Letter to number.** `A=01` through `Z=26` (ordinal), 2 digits each, concatenated. Non-letters skipped.
2. **Name number.** The concatenation, left-padded to at least 12 digits.
3. **BASING(s, n).** A generalised digital root. For each base from 1 to n, fold the last n
   digits onto the rest (added as numbers) until the length is n or less. Base 1 is the ordinary digital root.
4. **Numerology Triangle.** `B1` through `B12` of the name number, giving `1+2+...+12 = 78` digits.
5. **3-D Pyramid.** Each triangle row is itself triangulated, giving the sum of triangular
   numbers 1 to 12, which is 364 digits, plus one "birth zero" for 365 total (a digit per day of the year).
6. **Talents.** Count each digit 0 to 9 in the 365-digit pyramid. The score is `round(count * 1000 / 365)`,
   a parts-per-thousand value. Ranked descending gives Dominant down to Subordinant.
7. **Soul Star.** Twelve sectors of 30 degrees (half-angle 15). Digits 0 and 5 are mirrored to fill
   12 spokes. A circle's radius is set by its score, and its centre distance is `radius / sin15` so each
   circle touches the walls of its sector. The largest talent touches the outer ring, and the inner zone hides talents under 100.
8. **Centroid / White Sun.** The area-weighted (`pi * R^2`) balance point of the 12 talent circles,
   giving a soul angle from 0 to 360, then a quadrant ("projection pattern"). This is name-only (see notes).
9. **Bands.** Six colours, each over mirror-digit pairs, carrying two naming systems and trait words:

   | Colour | Digits | Dimension | Element | Loves | Powers |
   |---|---|---|---|---|---|
   | purple | 0 | Spiritual | Void | Peace, Contentment, Simplicity | Originality, Innovation, Wisdom |
   | blue | 1,9 | Intuitional | Space | Empathy, Insight, Understanding | Initiative, Motivation, Inspiration |
   | green | 2,8 | Intellectual | Air | Inquiry, Knowledge, Learning | Leadership, Analysis, Organization |
   | yellow | 3,7 | Sensual | Fire | Perceptiveness, Appreciation, Sensitivity | Creativity, Artistry, Business |
   | orange | 4,6 | Energetic | Water | Conquest, Challenge, Passion | Work, Energy, Action |
   | red | 5 | Physical | Earth | Desire, Fame, Prestige | Strength, Ambition, Domination |

10. **Evolution / Future Development.** A `1/distance` kernel (`A=1, B=0.349191862`) smooths the
    365-day ring. Read at every day, it gives each digit a curve. The shade shows the "karmic"
    relation to digits 0 and 5, and coloured caps show the birth profile. Two views: By Age (0 to 90,
    swept from the birth angle) and By Calendar (Jan to Dec). These are the only date-driven charts.
11. **Life Path** (additive). The same 10 evolution strands shown as the shape of a life:
    Life Stream is a centered streamgraph where total thickness is all talents combined; Life Cable
    braids the same strands as shaded 3-D tubes (depth-sorted so they weave).
12. **Year Mandala** (additive). The raw 365-digit ring as a calendar wheel, each day coloured by
    its digit, birthday starred. Makes the pyramid, ring, and talents pipeline tangible.
13. **Soul Compass** (additive). The soul angle as a magnetic-direction dial with four quadrants.
14. **Pyramid Explainer** (additive). The build in 4 steps (name, triangle, 3-D pyramid, counts and
    scores), with an isometric pyramid of colour layers.
15. **Compatibility** (additive). Enter other names. Closeness is the Pearson correlation of the
    talent profiles, plus the soul-angle gap and shared dominant talents, with an overlaid talent radar.
16. **Written Reading** (additive). A generated narrative in the original's vocabulary (Soular
    System, Forces and Feelings, Loves and Powers, magnetic direction).
17. **Music & Stars** (additive). Reproduces the *Piano Keys & the Seven Spinal Stars* diagram. The
    7 keys sit on the colour ring, sized by your colour strengths (B and F are dual nature).

### Narrative parity with the source
Captured from the printed reports and app screens: FEELINGS vs FORCES (the chart's receptive and
active halves), LOVES vs POWERS per colour, the NAMEMAN taglines, and the brand credit
(Where Names Come To Life, the Soular-System trademark) shown in the header and footer.

**Corrected from a closer image read:** page 9's compass shows example people at the cardinal points,
not zodiac or seasons, so quadrants are labelled neutrally (Quadrant I to IV by angle). The piano
diagram writes no chakra names. The names shown in the Music tab follow the traditional colour
correspondence, flagged as such.

## Validation

The engine was validated offline against the original application's two reference charts, reproducing
their talent scores, tie ordering, and centroid (soul) angles exactly. Those name-specific fixtures
are kept out of this public repo.

The repo's test suite covers the documented math and locks behaviour with a frozen regression on a
neutral example name:

- `name2num` cipher (A=01 to Z=26), spaces and punctuation skipped, left-pad to 12.
- BASING digital roots from notes pages 2 to 5 (for example, `B1(69873)=6`, `B1(47632)=4`).
- Structure: 78-digit triangle, 365-digit pyramid, scores summing near 1000.
- Soul angle is name-only (unchanged across birth dates); evolution curves are date-driven.
- A frozen regression on the example name (scores, base-12, soul angle, ranking).

All 47 tests pass (`node test.js`, or open `tests.html`).

## Gaps and interpretation notes
- **Soul angle is name-only.** In `SOUL_STAR` the kernel at the birth day cancels its own normaliser,
  so the centroid and angle depend only on the name. The birth date only changes the evolution
  curves. Confirmed by tracing the VB, and both screenshots agree (same surname and month, different
  angles driven by the given names).
- **"Scales"** is the 0 to 1000 talent gauge. The Music tab's chakra overlay is conceptual, not
  computed by any VB formula, and its chakra names follow the traditional colour correspondence.
- **Quadrant labels** use the page-9 cross at 0/90/180/270 for the projection pattern. That page
  carries no season or zodiac names, so quadrants are labelled neutrally.
- **Sun size** uses the VB's later formula `sqrt(total area)/4`. The author's own notes say its size
  has no real meaning, only its location and angle.
- The promised "famous names with similar characteristics" screen was not among the captured images,
  so that feature is not reconstructed. The Compatibility tab covers the "closest friends' names" half.
