# Buddy Line Design System & Styling Tokens

Buddy Line features a **dark neumorphic** visual theme inspired by modern gaming UI, combining soft dark charcoal surfaces, sunken inset controls, and radiant teal (`#2dd4bf`) glow accents.

---

## 1. Palette & Design Tokens

### Color Tokens

| Token | Value | Tailwind Variable / Class | Purpose |
|---|---|---|---|
| **Background** | `#151920` | `bg-background` / `var(--background)` | Deep charcoal canvas background |
| **Surface** | `#1c2028` | `bg-surface` / `bg-card` | Standard card and modal body |
| **Surface Raised** | `#22272f` | `bg-surface-raised` | Elevated cards, spotlight sections |
| **Surface Sunken** | `#111419` | `bg-surface-sunken` | Inset backgrounds, canvas containers |
| **Primary / Teal** | `#2dd4bf` | `bg-primary` / `text-primary` | Main call-to-action & brand accent |
| **Border** | `rgba(255, 255, 255, 0.08)` | `border-border` | Subtle contrast borders |
| **Border Teal** | `rgba(45, 212, 191, 0.25)` | `border-teal-400/25` | Active / focused borders |

### Shadow & Neumorphism Tokens

- **Raised Surface Shadow:**  
  `6px 6px 16px rgba(0, 0, 0, 0.45), -4px -4px 12px rgba(255, 255, 255, 0.02)`
- **Sunken Inset Shadow:**  
  `inset 2px 2px 6px rgba(0, 0, 0, 0.4), inset -1px -1px 4px rgba(255, 255, 255, 0.01)`
- **Teal Glow:**  
  `0 0 24px rgba(45, 212, 191, 0.2)`
- **Teal Glow Bold:**  
  `0 0 35px rgba(45, 212, 191, 0.4)`

---

## 2. Reusable Utility Classes (`app/globals.css`)

You can directly apply these classes across JSX markup:

```html
<!-- Neumorphic Card with Hover Glow -->
<div class="neu-card neu-card-hover p-6">
  <!-- Content -->
</div>

<!-- Primary Teal Pill Button -->
<button class="btn-teal px-6 py-2.5 text-xs">
  Play Game
</button>

<!-- Secondary Teal Outline Pill -->
<button class="btn-outline-teal px-4 py-2 text-xs">
  Details
</button>
```

Available CSS classes:
- `.neu-card` — Standard rounded neumorphic surface with subtle border and raised shadow.
- `.neu-card-hover` — Adds smooth hover elevation, teal border transition, and subtle glow.
- `.neu-raised` — Raised surface background and shadow.
- `.neu-inset` — Sunken surface background with inset shadow (great for inputs, track pads).
- `.btn-teal` — Vibrant teal gradient pill button with glow.
- `.btn-outline-teal` — Transparent teal-bordered pill button.
- `.glow-teal` / `.glow-teal-bold` — Standalone glow box-shadows.

---

## 3. TypeScript Design Tokens (`lib/tokens.ts`)

For programmatic usage and centralized type-safe styling, import from `@/lib/tokens`:

```tsx
import { tokens, tokenClass, colors, shadows } from "@/lib/tokens";

export function CustomPanel() {
  return (
    <div className={tokenClass("card", "p-6 space-y-4")}>
      <h2 className="text-white font-bold">Panel Title</h2>
      <input className={tokens.input} placeholder="Search..." />
      <button className={tokens.buttonTeal}>Submit</button>
    </div>
  );
}
```

Predefined preset keys in `tokens`:
- `card` / `cardRaised` / `cardInteractive`
- `panel` / `modal`
- `input` / `inputRounded`
- `buttonTeal` / `buttonOutline` / `buttonMuted` / `buttonDestructive`
- `badgeTeal` / `badgeAmber` / `badgeMuted` / `badgeDestructive`
- `glowTeal` / `glowTealBold`

---

## 4. Reusable Shadcn-Style UI Components (`components/ui/`)

Components built with `class-variance-authority` (`cva`) and Tailwind CSS v4 variables:

### Button (`components/ui/button.tsx`)

```tsx
import { Button } from "@/components/ui/button";

// Primary Teal Pill (Default)
<Button>Launch Game</Button>

// Outline Pill
<Button variant="outline">Learn More</Button>

// Secondary / Muted
<Button variant="secondary">Cancel</Button>

// Destructive
<Button variant="destructive">Delete Game</Button>

// Custom Shapes & Sizes
<Button shape="rounded" size="sm">Small Rounded</Button>
```

### Card (`components/ui/card.tsx`)

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";

<Card interactive>
  <CardHeader>
    <CardTitle>Game Title</CardTitle>
    <CardDescription>Created by SpaceCadet</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Game details and preview...</p>
  </CardContent>
  <CardFooter>
    <Button size="sm">Play</Button>
  </CardFooter>
</Card>
```

### Badge (`components/ui/badge.tsx`)

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">HTML5</Badge>
<Badge variant="amber">Top Score</Badge>
<Badge variant="solid">Featured</Badge>
<Badge variant="secondary">Retro</Badge>
```

### Input (`components/ui/input.tsx`)

```tsx
import { Input } from "@/components/ui/input";

<Input shape="pill" placeholder="Search games, tags, or creators..." />
<Input shape="rounded" type="password" placeholder="Password" />
```

---

## 5. Guidelines for Future UI Additions

1. **Always default to pill radius for primary CTA buttons** (`rounded-full` or `<Button shape="pill">`).
2. **Use `#1c2028` for surfaces** and `#151920` for backgrounds or inset input slots.
3. **Keep borders delicate** (`border-white/[0.06]` to `border-white/[0.08]`) rather than solid bright lines.
4. **Accent with Teal (`#2dd4bf`)** for high-priority interactive elements, badges, and focal points.
