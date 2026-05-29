# Linen Design System

> Simple, clean, and quietly considered. A design system built on shades of white, soft neutrals, and just enough warmth to feel human.

Linen is a minimal design language for products that want to get out of the user's way. It uses cream, paper, bone, and ivory — variations of white that create depth without weight — paired with editorial serif display type and a tidy modern sans for body copy. There is almost no color in the strong sense; instead, hues are dusted, faded, slightly washed, like sun-bleached fabric.

## Sources

This system was created from a textual brief rather than an existing codebase or Figma file:

> "A clean and minimal design system, that uses the space availably in an intelligent way. It looks great on both mobile and PC. Colors are light and a bit faded (no strong colors). It varies shades of white (cream white, bright white e.t.c) to create depth in the design."

No external Figma links, GitHub repos, or attached design files were provided. Visual decisions in this system are interpretations of that brief — every choice should be considered a draft for review, not a translation of an existing brand.

## Index

| File / folder         | What's in it                                                           |
| --------------------- | ---------------------------------------------------------------------- |
| `README.md`           | This file. Brand voice, visual foundations, iconography.               |
| `colors_and_type.css` | All design tokens (CSS custom properties) and semantic element styles. |
| `SKILL.md`            | Skill manifest for downloading + using this system inside Claude Code. |
| `fonts/`              | Webfont references (currently loaded via Google Fonts CDN).            |
| `assets/`             | Logo, mark, brand imagery, icon notes.                                 |
| `preview/`            | Small HTML cards that populate the Design System tab.                  |
| `ui_kits/marketing/`  | Marketing-site UI kit — hero, nav, footer, pricing, etc.               |
| `ui_kits/app/`        | Product app UI kit — sidebar, list, detail, settings.                  |

---

## Content fundamentals

**Voice.** Plain, warm, unhurried. Linen is a brand that trusts the reader; it doesn't shout, doesn't pad. Sentences are short. Marketing copy reads more like a note than an announcement.

**Person.** Default to second person ("you") when speaking to the user. First-person plural ("we") is reserved for company statements — about, philosophy, pricing. Avoid first-person singular.

**Casing.** Sentence case everywhere — buttons, menu items, section titles, page titles. The only exceptions are the wordmark itself ("Linen") and proper nouns. No ALL CAPS for emphasis; use weight or italic.

**Punctuation.** Periods on every sentence in body copy. Buttons and labels are unpunctuated. Em dashes — with spaces around them, like this — are encouraged for asides. Oxford commas, always.

**Numbers.** Spell out one through nine in prose; numerals for 10+. Always numerals in UI (counts, settings, prices).

**Emoji.** Not used. The brand expresses tone through type and pacing, not pictographs. The single exception is in user-generated content (chat, notes), where emoji are passed through as the user wrote them.

**Examples — buttons and CTAs.**

- ✅ Save changes
- ✅ Continue
- ✅ Start a project
- ❌ Save Changes
- ❌ GET STARTED →
- ❌ Save 🎉

**Examples — empty states.**

- ✅ "Nothing here yet. Add your first note to begin."
- ❌ "You don't have any notes! 📝 Click the + button to create one."

**Examples — marketing headlines.**

- ✅ "A quieter way to plan your week."
- ✅ "Notes that stay out of the way."
- ❌ "Supercharge your productivity with AI-powered notes!"

**Examples — error messages.**

- ✅ "We couldn't save that. Check your connection and try again."
- ❌ "Oops! Something went wrong 😬"

**Vibe.** Editorial, careful, like a small independent magazine or a stationery shop. Never corporate, never cutesy. The brand has good taste and assumes you do too.

---

## Visual foundations

**Color.** The palette is built almost entirely from very light, near-neutral whites and warm grays — never yellow. The lightest backgrounds are nearly indistinguishable whites — Bright (`#FFFFFF`), Paper (`#FAFAF9`), Cream (`#F3F3F1`) — used in stacked pairs to create _hints_ of depth, not visible layers. The page should always read "white"; raised surfaces step up by half a tone, never more. Text sits on a warm-neutral gray ramp (Ink) rather than pure black. Accents (Sage, Clay, Sky, Blush) are deliberately desaturated and only ever used at low chroma. **Rule: no surface should look gray, and no color should be more vivid than a watercolor wash.**

**Type.** A single typeface across display and body — **Geist** — with differentiation by size, weight, and tracking. Headings sit at weight 500 with tight negative tracking (−0.02 to −0.04em); body text at 400 / 1.55 line height. Code is **Geist Mono**. No italic for emphasis: secondary parts of a headline use lighter weight (300) or a quieter color (Ink 3) instead.

**Spacing.** Built on a 4px base with a generous, breathy rhythm — `4, 8, 12, 16, 24, 32, 48, 64, 96`. Big jumps in larger sizes; the system encourages whitespace. Section padding on desktop is usually 96px; on mobile, 32px.

**Backgrounds.** No gradients, no patterns, no full-bleed photography. Depth is created by layering two or three shades of white against each other — a Paper page on a Cream body, with a Bright White card on top. Section transitions can be a single hairline (1px) of `--ink-5` or a shift to the next shade of white. Imagery, when present, is photographic, warm, and slightly muted; never illustration, never AI-art.

**Animation.** Minimal and slow. Default duration is 220ms; easing is `cubic-bezier(0.2, 0.0, 0.0, 1.0)` — a gentle ease-out. No bounces, no springs, no scroll-jacked reveals. Page transitions are crossfades. Hover and focus changes use `200ms ease-out`.

**Hover states.** Backgrounds darken by one warm step (e.g. Paper → Cream, Cream → Linen). Text links underline. Icon buttons add a 4–6px halo of the next-warmer shade. Never use opacity below 0.7 — fading text feels broken in this palette.

**Press states.** Background shifts one more warm step. No scale transforms; presses are felt through the color step only. Active links keep their underline at full weight.

**Borders.** Hairlines only. `1px solid var(--ink-5)` for separators; `1px solid var(--ink-4)` for input fields. Never thicker than 1px in body content; the only 2px borders appear as focus rings.

**Shadow system.** Two shadow levels only, both warm-neutral tinted:

- `--shadow-1`: `0 1px 2px rgba(40, 40, 38, 0.05), 0 1px 1px rgba(40, 40, 38, 0.03)` — for resting cards.
- `--shadow-2`: `0 8px 24px rgba(40, 40, 38, 0.07), 0 2px 6px rgba(40, 40, 38, 0.04)` — for menus and popovers.

No third level. If something feels like it needs shadow-3, it should probably be a full-screen sheet.

**Protection gradients vs capsules.** Sticky elements over scrolling content use a soft Paper-to-transparent gradient (`linear-gradient(to bottom, var(--paper) 0%, transparent 100%)`) about 32px tall — never a frosted-glass capsule. Capsules feel too app-y for this brand.

**Layout rules.** Container max-width is 1200px for marketing, 1440px for app. Content max-width (for prose) is 640px. Fixed elements: header (transparent until scroll, then Paper with hairline); footer (Cream); side panels in app contexts (Bone). Everything else flows.

**Transparency and blur.** Used rarely. Modal scrims are `rgba(30, 24, 18, 0.32)` — a warm semi-transparent ink. No backdrop-filter blur in marketing; in-app menus may use a subtle 8px blur over content but it's not required.

**Imagery tone.** Warm, natural-light, slight desaturation. Think: linen on a wooden table, paper in raking sunlight. Never cool, never high-saturation, never AI-generated or synthetic. Black & white acceptable for portraits; otherwise color, lightly washed.

**Corner radii.** Soft but not pillowy. `--radius-sm: 4px` for tags and small inputs; `--radius-md: 8px` for cards and most buttons; `--radius-lg: 16px` for large surfaces (modals, sheet headers); `--radius-pill: 999px` for status pills and avatars only.

**Cards.** Background `--bright`, 1px border in `--ink-5`, `--radius-md`, `--shadow-1` (rest) or `--shadow-2` (hover). Padding usually 24px on desktop, 16px on mobile. Cards do not have colored left borders or accent fills — they are quiet containers.

**Focus.** A 2px outline in `--clay` offset by 2px from the element. Never the browser default; never a thick blue ring.

---

## Iconography

There is no proprietary icon set. Linen uses **Lucide** (CDN) as its icon vocabulary — clean 1.5px-stroke line icons that match the brand's quiet, low-density feel. Icons are sized at 16px (inline with text), 20px (controls), or 24px (standalone). Color is inherited from text via `currentColor`; the default tone is `--ink-3`.

> Substitution note: Lucide is a stand-in selected to match the brand's stroke weight and visual register. If the user has a preferred icon family, swap the CDN reference in `ui_kits/*/index.html` and update this section.

**Rules.**

- Strokes only — no filled-glyph variants.
- Stroke weight: 1.5px at all sizes.
- Pair with text labels whenever possible. Icons alone are reserved for very tight UI (toolbars, table-row actions).
- Color: `--ink-3` resting, `--ink-1` active. Never a brand color on an icon unless it's an explicit semantic state (e.g. a `--sage` check on a success row).

**Logo / wordmark.** A simple lowercase sans wordmark — see `assets/logo.svg`. Set in Geist 500 with tight negative tracking (−0.045em). The wordmark may appear in `--ink-1` on any white shade, or in `--paper` on `--ink-1` for dark surfaces (rare).

**Emoji.** Not part of the system. Do not use as iconography, status indicators, or decoration.

**Unicode characters.** Used sparingly for typographic flourish — em dash (—), bullet (•), arrow (→) in body copy. Not used as functional icons.

---
