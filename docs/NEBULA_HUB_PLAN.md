# Buddy Line: Nebula Hub - Project Context

This document outlines the architecture, domain terminology, and state management for "Buddy Line," a Next.js multiplayer application platform. The MVP focuses on building one of its core sub-apps, "Nebula Hub," which currently features a text-chat social deduction game called "Deep Space Sabotage." Use this as the primary context for all code generation and file structuring.

## 1. Tech Stack & Environment

- **Framework:** Next.js (App Router, TypeScript).
- **Styling:** Tailwind CSS.
- **UI Components:** shadcn/ui.
- **Icons:** Lucide React.
- **Theme:** Dark mode by default, sleek sci-fi aesthetic.
- **Data & State (MVP):** 100% mocked client-side state with simulated Next.js Server Actions for bot responses. No live database or auth is required yet.

## 2. Platform Hierarchy & Domain Terminology

Adhere strictly to the following hierarchy and terminology in UI text, variable names, and components:

- **Buddy Line:** The top-level parent application/platform.
- **Nebula Hub:** An app/section within Buddy Line dedicated to multiplayer games.
- **Deep Space Sabotage:** The specific game currently playable inside Nebula Hub.
- **Loyal:** The standard human or AI crew members trying to fix the ship in the game.
- **Replicant:** The hidden enemy attempting to sabotage the ship. _Do not use the word "Saboteur" in the UI or codebase._
- **Turn:** A single player's opportunity to send a message in the chat.
- **Round:** A full cycle where all surviving players have taken their turns, culminating in a voting phase.

## 3. Core Architecture & Layout

The application is a single-page experience driven by a state machine, structured into three primary layout zones:

1.  **Buddy Line / Nebula Hub Shell (Global Layout):**
    - **Left Sidebar:** Displays the "Buddy Line" top-level branding, a navigation section for "Nebula Hub" (Games list highlighting Deep Space Sabotage), Active Sessions, and Friends List.
    - **Top Navbar:** User profile avatar, Room Code indicator (e.g., `#SPACE-8492`), and a "Dev Tools" toggle switch.
2.  **Lobby View (State: `lobby`):**
    - Match configuration sliders/selects (Host only): Bot Count (2-5), Replicant Count (1-2), Turn Limit per round (5-15).
    - List of joined players.
    - "Launch Mission" trigger.
3.  **Active Game View (State: `playing`):**
    - **Left (Player HUD):** Ship Status bars (Oxygen/Reactor), toggleable Role Reveal Card, and a Deduction Notepad (dropdowns for Safe/Suspicious/Replicant/Unknown and text inputs for notes on each crewmate).
    - **Center (Chat):** Scrollable chat with speech bubbles. Includes strict turn-based logic: input is only enabled when it is the local player's turn.
    - **Right (Dev Drawer):** Conditionally rendered when "Dev Tools" is enabled in the navbar. Displays true identities, bot system prompts, and JSON API payloads. Inline chat messages from bots also get Dev Tool hover-states revealing their prompts.

## 4. State Management

Game flow must be modeled as a single, strict state machine using `useReducer` or a typed union state (e.g., `GameState`). Do not use scattered boolean flags (e.g., `isVoting`, `isPlaying`).

- **State Machine Flow:** `lobby` -> `playing` -> `voting` -> `reveal` -> (return to lobby or restart).
- **Shared Types:** Maintain all game types (`Player`, `Role`, `Message`, `MatchSettings`, `GameState`) centrally to ensure consistency across components.
- **Turn Loop Trigger:** When a player submits a chat message, the state must sequence: append message -> disable input -> show "Waiting for [Bot Name]..." -> execute bot server action -> append bot message -> increment turn.

## 5. Voting & Reveal Constraints

- **Trigger:** The `voting` state engages automatically when the round's turn limit is reached.
- **Modal UI:** Renders a grid of portrait cards for surviving crew members. Requires explicit selection and a "Confirm Ejection" submission.
- **Reveal State:** Transitions to `reveal` showing the outcome (e.g., "Crewmate Alpha was ejected. They were a Replicant.") before resetting.

## 6. Server Action Stubs

To ensure a seamless transition to the Gemini API later, abstract the bot logic into isolated Next.js Server Actions (`actions.ts`).

- **`generateBotResponse(chatHistory, roleContext)`:** Write this as a mock asynchronous function. It must return a hardcoded string fitting the bot's persona.
- **Delay:** Implement an artificial 2-second `setTimeout` to simulate LLM network latency and verify the UI's loading states.
- **Future-Proofing:** Leave explicit `// TODO:` comments inside the server actions indicating where the actual LLM API call will execute, and where WebSockets/Firebase will handle multiplayer synchronization.
