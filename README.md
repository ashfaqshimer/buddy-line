# Buddy Line - Community Web Arcade

Buddy Line is a web arcade platform where anyone can play, build, and share custom HTML/CSS/JS games with the community.

## Features

- **Community Web Arcade:** Instant browser-playable HTML5, Canvas, and JavaScript games with zero setup required.
- **Creator Upload Studio:** Upload game code (HTML, CSS, JS), pick a custom game icon, write a description, and share with players in seconds.
- **Sandboxed Execution:** Secure `iframe` sandbox runner with fullscreen capability, responsive scaling, and play tracking.
- **Player Accounts & Moderation:** Built with Better Auth (Neon Postgres or SQLite fallback), supporting guest play, username/password logins, creator attribution, and admin/root role management.

## Design System & Styling

Buddy Line uses a dark neumorphic design system with glowing teal (`#2dd4bf`) accents and subtle dark charcoal surfaces:
- **Design Tokens & Guidelines:** Full documentation available in [`docs/STYLING.md`](docs/STYLING.md).
- **TypeScript Tokens:** Predefined token presets available via `import { tokens, colors } from "@/lib/tokens"`.
- **Reusable UI Components:** Shadcn-inspired primitives in `@/components/ui` (`Button`, `Card`, `Badge`, `Input`).

## Getting Started

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the arcade.
