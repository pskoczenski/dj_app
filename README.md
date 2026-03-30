## DJ Network — MVP

DJ Network is a grassroots networking platform for DJs — discover events, share mixes, follow artists, search the network, and message other users. **Browse** can follow your **active city**: events (list + calendar) and search (DJs + events) respect **`useLocation` / `activeCity`**; home and mixes are not city-filtered.

Built with **Next.js 16** (App Router), **Supabase** (Postgres, Auth, Storage), **Tailwind CSS v4**, and **shadcn/ui**.

---

## Installation & Setup

- **Node.js**
  - **Requirement**: Node.js **18+** (project dependencies are compatible with newer versions as well).

- **Package manager**
  - This repo uses **npm** scripts (`npm install`, `npm run dev`, etc.).

- **Supabase**
  - You can run against:
    - **Option A — Cloud project** (recommended for shared dev), or
    - **Option B — Local Supabase** via the Supabase CLI + Docker.

---

## Environment Configuration

Create a `.env.local` file in the project root (Next.js convention) with at least:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
```

Never commit real keys to git.

---

## Supabase Setup (migrations, auth, storage)

**Option A — Cloud project**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — Local Supabase with Docker**

```bash
supabase start
supabase db reset
```

### Storage buckets

Migrations create public storage buckets used by the app:
- `profile-images`
- `event-flyers` (supports draft uploads before the event exists)
- `mix-covers`

Apply via `supabase db push` (cloud) or `supabase db reset` (local).

---

## Project Setup, Scripts & Tests

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

- **Run tests**
  - This project uses **Jest** + **React Testing Library**.
  - Run the full suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Production build:

```bash
npm run build
npm start
```

---

## High-Level Architecture

- **Frontend**
  - Next.js App Router pages and layouts under `app/`.
  - Tailwind + `shadcn/ui` component primitives under `components/ui/`.
  - Client-side data hooks in `hooks/` (e.g. `useCurrentUser`, `useProfile`, messaging hooks).

- **Backend**
  - Supabase Postgres for persistence.
  - Row Level Security (RLS) is used extensively to enforce authorization.
  - A small number of `SECURITY DEFINER` database functions are used for safe privileged operations (e.g. DM creation).
  - Next.js Route Handlers are used where needed (e.g. `app/api/mix-oembed` to avoid CORS issues).

- **Database**
  - SQL migrations live in `supabase/migrations/`.
  - Types live in `types/` (`types/database.ts` is the hand-maintained generated contract).

---

## Repo / File Structure (high level)

```text
app/                    Next.js App Router pages & layouts
  (auth)/               login, signup
  (main)/               authenticated shell (home, events, mixes, search, dj profiles, messages)
  api/                  route handlers (e.g. oEmbed proxy)
components/
  ui/                   shadcn/ui primitives
  shared/               reusable UI (EmptyState, LoadingSpinner, etc.)
  layout/               navbar, mobile bars, dropdowns
  events/               EventCard, EventForm, LineupBuilder, etc.
  mixes/                MixEmbed, MixCard, MixForm, etc.
  messages/             inbox/conversation UI, quick-message dialog
  profile/              ProfileHeader, FollowButton, SocialLinks
  forms/                GenreTagInput, ImageUpload
hooks/                  client-side data hooks
lib/
  auth/                 route helpers, session middleware helpers
  db/                   schema constants
  location/             active-city cookie, LocationProvider, types (browse/search filtering)
  services/             supabase-backed services (profiles, events, mixes, cities, follows, search, messaging, …)
  supabase/             client/server helpers
  utils/                formatting + URL helpers
types/                  shared types and Supabase Database typings
supabase/migrations/    SQL migrations (apply with `supabase db push`)
__tests__/              Jest tests mirroring the source tree
docs/                   design + tech specs (agent-step workflow)
```

---

## Core User Flows (happy paths)

- **1. Sign up / Log in**
  - Create an account and bootstrap a profile.
  - Update profile details and upload a profile image.

- **2. Discover DJs**
  - Visit DJ profiles (`/dj/[slug]`).
  - Follow/unfollow DJs to curate your home dashboard.

- **3. Browse and share mixes**
  - Add a mix URL; title/thumbnail can auto-fill via oEmbed for supported platforms.
  - View mixes on DJ profiles and the mixes browse page.
  - Like mixes (heart + count).

- **4. Create and discover events**
  - Create events with flyer uploads (including draft flyer support).
  - Add a lineup and publish events.
  - Pick an **active city** in the nav; the events **list** and **calendar** show published events in that city. Search can stay **in city** or switch to **all cities** for DJs/events (mixes are always global).

- **5. Message other users**
  - From a DJ profile, open a quick compose dialog and send a DM.
  - View inbox at `/messages` and open threads at `/messages/[conversationId]`.
  - Event group threads exist for events (where enabled by lineup membership/creator rules).

---

## Development Workflow (Step-by-Step)

This repo is built iteratively using agent-sized steps:
- Tech steps live in `docs/tech_specs/`
- Design references live in `docs/design_specs/`
- Progress tracking lives in `docs/README.md` (separate from this project README)

Start here:
- `docs/tech_specs/00-INDEX.md`

---

## External Services Summary

- **Supabase (Postgres + Auth + Storage)**
  - Stores profiles, events, mixes, follows, and messages.
  - Enforces authorization via RLS.
  - Hosts storage buckets for images (profile images, event flyers, mix covers).

- **Next.js**
  - App Router UI + a small number of API route handlers (e.g. oEmbed proxy).
