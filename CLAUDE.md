@AGENTS.md
# DJ Network — Project Context

> **Purpose of this file:** This is the single source of truth for AI-assisted development.
> Both Cursor and Claude Code read this file automatically. Keep it updated as the project evolves.
> Last updated: 2026-03-29

## What This Is

DJ Network is a grassroots networking platform for DJs — discover events, share mixes, and connect with the community. Think of it as a niche social platform where the content is events and mixes, not posts.

**Target users:** DJs (bedroom to professional), promoters, and electronic music fans in local scenes.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | ⚠️ Breaking changes from v14/15 — always check `node_modules/next/dist/docs/` |
| Database | Supabase (Postgres + Auth + Storage) | RLS policies on all tables |
| Styling | Tailwind CSS v4 | v4 syntax differs from v3 |
| Components | shadcn/ui | Primitives in `components/ui/` |
| Testing | Jest + React Testing Library | Tests in `__tests__/` mirror source tree |
| Hosting | TODO: fill in (Vercel?) | |

## Project Structure

```
app/
  (auth)/               # Login, signup (unauthenticated)
  (main)/               # Authenticated shell — home, events, mixes, search, dj profiles
components/
  ui/                   # shadcn/ui primitives (don't edit directly)
  shared/               # Reusable: EmptyState, LoadingSpinner, etc.
  layout/               # Navbar, mobile bars, avatar dropdown
  events/               # EventCard, EventForm, LineupBuilder, etc.
  mixes/                # MixEmbed, MixCard
  profile/              # ProfileHeader, FollowButton, SocialLinks
  forms/                # GenreTagInput, ImageUpload
hooks/                  # Client-side data hooks (useCurrentUser, useProfile, etc.)
lib/
  auth/                 # Route helpers, session
  db/                   # Schema constants
  services/             # Business logic: profiles, events, mixes, follows, search, storage
  supabase/             # Client / server / middleware helpers
  utils/                # Embed URL transform, slug generation
types/                  # Generated Supabase types (regenerate with `supabase gen types`)
supabase/migrations/    # SQL migrations (apply with `supabase db push`)
```

## Data Model

<!-- TODO: Fill in your actual table names and key columns from Supabase -->

**Core tables:**
- `profiles` — DJ profiles (display_name, slug, bio, avatar_url, genres, social_links, ...)
- `events` — Events (title, description, date, venue, flyer_url, created_by, ...)
- `event_lineups` — Many-to-many: which DJs are on which event
- `mixes` — Mix uploads/embeds (title, url, cover_url, platform, created_by, ...)
- `follows` — follower_id → following_id
- `genres` — Genre tags (or is this a text array on profiles?)

**Storage buckets:**
- `profile-images` — Avatar uploads
- `event-flyers` — Event flyer images (supports draft uploads before event exists)
- `mix-covers` — Mix cover art

**Auth:** Supabase Auth with email/password. Middleware in `middleware.ts` protects `(main)` routes.

## Conventions & Patterns

**Server vs Client components:** Default to server components. Use client components (`'use client'`) only when you need hooks, event handlers, or browser APIs.

**Services layer:** All database calls go through `lib/services/`. Components and hooks call services, never Supabase directly.

**Hooks pattern:** Client-side data fetching hooks live in `hooks/`. They wrap service calls and manage loading/error state.

**Naming:**
- Files: kebab-case (`event-card.tsx`)
- Components: PascalCase (`EventCard`)
- Services: `lib/services/{domain}.ts` (e.g., `profiles.ts`, `events.ts`)

**Testing:** Tests mirror the source tree in `__tests__/`. Run with `npm test`.

## Current State (as of 2026-03-29)

**Working:**
- Auth (login, signup, session management)
- DJ profiles (create, edit, view, avatar upload)
- Events (create, edit, view, flyer upload, lineup builder)
- Mixes (create, embed from external platforms, cover art)
- Follow system
- Search
- Mobile-responsive layout

**Known issues / tech debt:**
<!-- TODO: List any known bugs, performance issues, or shortcuts you took -->
- [ ] ...

## Upcoming Features

See `docs/ROADMAP.md` for detailed feature plans.

**Next up:**
1. Community features (crews/groups, forums/discussions)
2. Discovery improvements (recommendations, map view, enhanced search)

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server at localhost:3000
npm test                 # Run tests
npm run test:watch       # Tests in watch mode
npm run build            # Production build
supabase db push         # Apply migrations
supabase gen types typescript --local > types/supabase.ts  # Regenerate types
```

## Notes for AI Assistants

- **Next.js 16 has breaking changes.** Read `node_modules/next/dist/docs/` before writing Next.js code. Don't assume v14/v15 patterns work.
- **Tailwind v4** uses a different config format than v3. Check existing usage before adding classes.
- **Always use the services layer** (`lib/services/`) for data access. Don't write raw Supabase queries in components.
- **RLS is on.** Every new table needs Row Level Security policies. Check existing migrations for patterns.
- **Regenerate types** after any migration: `supabase gen types typescript --local > types/supabase.ts`
- When creating new features, follow the existing pattern: migration → service → hook → component → page.
