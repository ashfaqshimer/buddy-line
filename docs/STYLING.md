# Buddy Line Design System ("Night Arcade")

The palette comes straight from the logo: a deep indigo-night background, **cyan** (the left fist) for playing, **violet** (the right fist) for everything social, and the cyan → violet logo gradient for brand moments. Games are the colourful part of the page; the chrome around them stays dark and calm.

---

## 1. Colour roles

Tokens live in `app/globals.css` (`:root` + `@theme inline`) and are mirrored in `lib/tokens.ts`.

| Role | Token / Tailwind | Value | Use for |
|---|---|---|---|
| Background | `bg-background` | `#090a14` | Page canvas, player HUD |
| Surface | `bg-surface` | `#11132a` | Cards, modals, chat panel |
| Surface raised | `bg-surface-raised` | `#191c3a` | Avatars, menus, other people's chat bubbles |
| Surface sunken | `bg-surface-sunken` | `#06070f` | Inputs, drop zones |
| Text | `text-foreground` / `text-muted-foreground` / `text-subtle-foreground` | `#eef0ff` / `#a3a7c9` / `#6d7199` | Primary / secondary / hints |
| Border | `border-border` / `border-border-strong` | indigo at 10% / 20% | Hairlines, hover |
| **Play** | `bg-primary`, `text-primary`, `btn-primary` | `#38bdf8` | Play, browse, save, sign in: the main action of a view |
| **Social** | `bg-social`, `text-social`, `btn-social` | `#a78bfa` | Friends, chat, message bubbles, unread badges |
| **Brand** | `btn-brand`, `.text-gradient`, `var(--brand-gradient)` | cyan → indigo → violet | Upload / publish, one hero word. Never body text |
| Admin | `tag-admin`, `text-admin` | `#fbbf24` | Admin / root markers |
| Danger | `btn-danger`, `btn-danger-soft` | rose | Delete, remove |

Rules of thumb: one cyan button per view, violet only for social features, and the gradient only for creating and sharing games.

## 2. Type

- **Unbounded** (`font-display`) for headings, the wordmark and typographic game covers. Weights 700–800.
- **Plus Jakarta Sans** (`font-sans`, the default) for UI and body text.
- **Geist Mono** (`font-mono`) only for codes (reset codes, file sizes). Use `tabular-nums` for counts.
- Sentence case everywhere ("Upload game", "Play now"). The `.eyebrow` class is the only uppercase label style.

## 3. Shape

- Pills (`rounded-full`) for buttons, chips, search fields and badges.
- `rounded-xl` for inputs and covers, `rounded-2xl` for cards and list rows, `rounded-[24px]`–`[28px]` for big sections and modals (`.panel`).
- Floating layers use `--shadow-float`. Sticky chrome uses `.glass` (blurred background).

### Page backdrop

`body::before` in `app/globals.css` is a fixed, blurred arcade-hall photo under a night scrim (fading to solid `--background`) plus the cyan/violet haze. Files: `public/backgrounds/arcade-hall.webp` (2000px) and `arcade-hall-sm.webp` (900px, used ≤640px). Photo: "Arcade game station" by Carl Raw, [Unsplash](https://unsplash.com/photos/arcade-game-station-8Gdayy2Lhi0), Unsplash License (free, no attribution required). Keep the scrim strong enough that body text stays readable; content surfaces (`card`, `panel`) stay opaque.

## 4. Component classes (`app/globals.css`)

| Class | What it is |
|---|---|
| `btn` + `btn-primary` / `btn-brand` / `btn-social` / `btn-secondary` / `btn-ghost` / `btn-danger` / `btn-danger-soft`, sizes `btn-sm` / `btn-lg` | Buttons |
| `icon-btn` | Round icon-only button |
| `field`, `field-label` | Text inputs and textareas (16px on phones to avoid iOS zoom) |
| `scrim` + `panel` | Modal overlay and dialog box |
| `menu`, `menu-item` | Dropdown menus |
| `chip` (`aria-selected`) | Filter pills |
| `segmented` (children with `aria-selected` / `aria-pressed`) | Tabs / toggles |
| `count-badge` | Unread / request counts (violet) |
| `tag` + `tag-admin` / `tag-muted` / `tag-play` / `tag-social` | Small status labels |
| `alert` + `alert-error` / `alert-success` | Inline feedback |
| `card`, `game-card` | Surfaces; `game-card` lifts on hover and glows with `--glow` |
| `kbd`, `eyebrow`, `text-gradient`, `glass` | Misc |
| `anim-fade`, `anim-pop`, `anim-rise`, `anim-sheet` | Entrance animations (Tailwind utilities, so `sm:anim-pop` works) |

Tailwind utilities override these classes (they live in `@layer components`), so `className="btn btn-primary w-full"` works as expected.

## 5. Game covers

`components/game-cover.tsx` renders a 16:9 cover: the uploaded thumbnail if there is one, otherwise a neon "cartridge" with the game's emoji `icon`, a faint grid and the title in Unbounded, on a stable tone from `lib/game-colors.ts` (`getCoverTone(game.id)`, `coverBackground(tone)`). Each tone also has a `glow` colour; set it as `--glow` on a `game-card` to tint the hover shadow. Use `GameCover` anywhere a game appears.

## 6. Guidelines

1. Prefer the component classes and tokens over hex literals or raw Tailwind palette colours.
2. Don't add UI for features that don't exist.
3. Keep phone widths working: 44px touch targets, bottom-nav clearance (the footer has `pb-28` on mobile), no horizontal scroll.
