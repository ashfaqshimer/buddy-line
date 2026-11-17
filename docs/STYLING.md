# Buddy Line Design System ("Gallery")

Buddy Line uses a restrained dark theme: neutral near-black surfaces, 1px hairline borders, small corner radii and no decorative glow. The games' covers are the main visual. Teal (`#2dd4bf`) is reserved for the primary action (play, upload) and focus rings.

---

## 1. Color tokens

Defined in `app/globals.css` (`:root` + `@theme inline`) and mirrored in `lib/tokens.ts`.

| Token | Value | Tailwind | Purpose |
|---|---|---|---|
| Background | `#0d0d0f` | `bg-background` | Page canvas, header, player HUD |
| Surface | `#141417` | `bg-surface` / `bg-card` | Modals, menus, panels |
| Surface raised | `#1b1b1f` | `bg-surface-raised` | Avatars, nested panels |
| Surface sunken | `#0a0a0c` | `bg-surface-sunken` | Inputs, iframe backdrop |
| Foreground | `#ededf0` | `text-foreground` | Primary text |
| Muted | `#9a9aa3` | `text-muted-foreground` | Secondary text, metadata |
| Subtle | `#66666f` | `text-subtle-foreground` | Labels, placeholders |
| Border | `rgba(255,255,255,.08)` | `border-border` | Default hairline |
| Border strong | `rgba(255,255,255,.14)` | `border-border-strong` | Outline buttons, hover, dashed empty states |
| Primary | `#2dd4bf` | `bg-primary` / `text-primary-foreground` | Play / upload / focus only |

Neutral greys use Tailwind's `zinc` scale (not `slate`, which is blue-tinted). Semantic colours: `rose` for destructive actions, `amber` for admin/root markers.

## 2. Type

- **Geist** (`font-sans`) for UI and body text.
- **Geist Mono** (`font-mono`) for metadata, counts, labels (`tokens.label`, `tokens.meta`). Use `tabular-nums` for numbers.
- **Archivo** (`font-display`, variable width) for headings and covers:
  - `.display-wide` for headings (wide, tight tracking).
  - `.display-condensed` for typographic game covers (condensed uppercase).

Weights stay between 500 and 800. Avoid `font-black`, ALL-CAPS button labels and text below 11px. Buttons use sentence case ("Upload a game", "Play").

## 3. Shape & elevation

- Radii: `rounded-md` (6px) small controls, `rounded-lg` (8px) buttons, inputs and covers, `rounded-xl` (12px) modals and menus. `rounded-full` is for avatars, dots and count badges only.
- No glows, gradient buttons, gradient text or neumorphic shadows. Separate things with borders and spacing. Use `shadow-2xl shadow-black/50` only for floating layers (modals, dropdowns).
- `backdrop-blur` only on sticky chrome (header, bottom nav) and overlay scrims.

## 4. Game covers

`components/game-cover.tsx` renders a 16:9 cover: the uploaded thumbnail if there is one, otherwise a typographic cover (the title in condensed caps) on a stable tone from `lib/game-colors.ts` (`getCoverTone(game.id)`). Use it anywhere a game is shown (grid, featured slot, list view, player HUD) instead of emoji tiles.

## 5. Presets (`lib/tokens.ts`)

```tsx
import { tokens, tokenClass } from "@/lib/tokens";

<div className={tokenClass("card", "p-6 space-y-4")}>
  <p className={tokens.label}>Section</p>
  <input className={tokens.input} placeholder="Search games" />
  <button className={tokens.buttonTeal}>Upload a game</button>
  <button className={tokens.buttonOutline}>Cancel</button>
</div>
```

Keys: `card`, `cardRaised`, `cardInteractive`, `panel`, `modal`, `input`, `inputRounded`, `buttonTeal`, `buttonOutline`, `buttonMuted`, `buttonDestructive`, `badgeTeal`, `badgeAmber`, `badgeMuted`, `badgeDestructive`, `label`, `meta`.

Shadcn-style primitives in `components/ui` (`Button`, `Card`, `Badge`, `Input`) follow the same rules. Use `cn()` from `lib/utils.ts` to merge classes.

## 6. Guidelines

1. Use teal for at most one or two actions per view. Everything else is neutral.
2. Prefer tokens (`bg-surface`, `text-muted-foreground`) over hex literals.
3. Lay out content without boxes where possible: a game tile is a cover plus text, not a card.
4. Keep phone widths working: 16px+ input font size, 44px touch targets, bottom nav clearance (`pb-24` on `main`).
