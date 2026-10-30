# Design system

## Intent

Colorful, playful editorial design with a premium, personal feel. Large intentional typography, open warm space, rounded color fields, orbital lettering, small ticket details, and a little visual surprise. No wedding serif, stock SaaS dashboard, or childish characters. The original orbital artwork is CSS, not a remotely loaded image.

| Token | Value | Use |
| --- | --- | --- |
| Ivory | `#F8F5EE` | Canvas |
| Ink | `#28243D` | Text and primary controls |
| Iris | `#6955E8` | Hero, focus, brand accent |
| Coral | `#FF7C68` | Warm editorial accent |
| Lime | `#D9EA78` | Action contrast, optimism |
| Sky | `#ABD9F7` | Supporting fields, tickets |

Tailwind theme tokens and CSS variables are in `src/app/globals.css`. Main reading text uses ink; small text on pale fields uses darker muted ink. Bright colors are accents, not low-contrast body text. Prefer shared `btn`, `field`, `paper-panel`, `eyebrow`, `notice`, and `pill` primitives.

## Typography

Sofia Sans Variable is the body font; Unbounded Variable is the expressive display font. Both are self-hosted through Fontsource packages with OFL licenses included in those packages. The Cyrillic subsets include U+0400–045F, covering the Bulgarian alphabet and `ѝ`; the Latin extended subsets cover `ū`. Binary glyph coverage was checked using fontTools against the actual installed WOFF2 files. Sofia Sans is designed around Bulgarian Cyrillic, and the document language plus `locl` font feature enables localized forms where provided. Do not replace these fonts without checking Bulgarian glyphs and localized forms again.

Display faces are reserved for brand/headings, with readable Sofia Sans labels, inputs, descriptions, and time values. Do not use dense all-display body content. Scale large headings down on narrow screens; preserve space around the primary action.

## Interaction and responsive rules

- Desktop has a light horizontal navigation; mobile has a bottom navigation with safe-area spacing. The future Plans and Our World entries are status text, not disabled-looking links to nonexistent screens.
- All working links have a real destination. Buttons submit an action, switch language, retry, copy, or sign out. Decorative art is hidden from assistive technology.
- Forms have visible labels, native email/date/time semantics, keyboard-operable radio groups, focus rings, explicit pending state, and alert/status feedback. A skip link targets the main content.
- Empty sessions explain how to start. Loading has an announced status. Missing configuration, auth failure, invitation failure, and save failure have separate friendly text. Refresh reads saved records again.
- Motion is limited to short hover/focus transitions and a loading indicator. `prefers-reduced-motion` removes animation and scrolling effects.

Use Bulgarian first and keep both typed dictionaries complete. A user's language cookie applies immediately and persists; profile setup can also save the preferred language. Dates use the selected language, and session times are always shown with their stored timezone. Test on narrow phones as well as desktop; check long Bulgarian words, overnight labels, and variable partner names.
