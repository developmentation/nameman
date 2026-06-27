# NAMEMAN — Numerology Name Analyzer

NAMEMAN turns a name into a full numerology profile: talents, elements, dimensions, a
centroid/soul-angle, and time-based charts, all drawn dynamically as SVG. It runs entirely in the
browser with no build step.

## Run it
Open **`index.html`** in any browser. No build, no server. It loads Vue 3 from a CDN and two local
scripts (`engine.js`, `charts.js`).

Open **`tests.html`** to run the test suite in the browser, or run it headless:

```
node test.js
```

## Files
| File | Purpose |
|------|---------|
| `index.html` | Vue 3 (CDN) UI |
| `engine.js`  | Pure, DOM-free math. Works in browser and Node. |
| `charts.js`  | Dynamic SVG renderers (soul star, ranks, bands, scales, pillars, life path, mandala, compass, music, pyramid) |
| `test.js`    | Node test suite (47 assertions) |
| `tests.html` | Same tests, in-browser |
| `vendor/`    | jsPDF + html2canvas (bundled locally) for one-click PDF export |

## The method

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
11. **Life Path.** The same 10 evolution strands shown as the shape of a life: Life Stream is a
    centered streamgraph where total thickness is all talents combined; Life Cable braids the same
    strands as shaded 3-D tubes (depth-sorted so they weave).
12. **Year Mandala.** The raw 365-digit ring as a calendar wheel, each day coloured by its digit,
    birthday starred. Makes the pyramid, ring, and talents pipeline tangible.
13. **Soul Compass.** The soul angle as a magnetic-direction dial with four quadrants.
14. **Pyramid Explainer.** The build in 4 steps (name, triangle, 3-D pyramid, counts and scores),
    with an isometric pyramid of colour layers.
15. **Compatibility.** Enter other names. Closeness is the Pearson correlation of the talent
    profiles, plus the soul-angle gap and shared dominant talents, with an overlaid talent radar.
16. **Written Reading.** A generated narrative covering your Soular System, Forces and Feelings,
    Loves and Powers, and magnetic direction.
17. **Music & Stars.** A *Piano Keys & the Seven Spinal Stars* wheel. The 7 keys sit on the colour
    ring, sized by your colour strengths (B and F are dual nature).

## How to read your chart
- **Your soul angle comes from your name.** The white sun is the balance point of all your talents,
  and its angle is set by your name alone. Your birth date does not move it; it only shapes the
  Future Development and Life Path charts over time.
- **The inner zone hides quiet talents.** Any talent scoring under 100 sits inside the dark inner
  zone of the Soul Star. These are inner or still-forming talents, not weaknesses.
- **Scales run 0 to 1000.** Every talent is scored as a share of the 365-day pattern, scaled to a
  1000 base, so the numbers read like clear proportions.
- **Music and chakras.** The Music & Stars wheel maps the seven musical keys to the colour ring as a
  creative overlay; the chakra names follow the traditional colour correspondence.

## Tests
The suite covers the letter cipher, the basing digital roots, the triangle/pyramid structure,
name-only soul angle, date-driven evolution, and a frozen regression on a neutral example name that
locks the engine's output. All 47 tests pass (`node test.js`, or open `tests.html`).
