# DJ Network

A grassroots networking platform for DJs — discover events, share mixes, and connect with the community.

Built with **Next.js 16** (App Router), **Supabase** (Postgres, Auth, Storage), **Tailwind CSS v4**, and **shadcn/ui**.

## Prerequisites

- Node.js 18+
- npm 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development or migrations)
- A Supabase project (cloud or local)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and fill in your Supabase credentials
cp .env.local.example .env.local
```

Edit `.env.local` with your project's values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Supabase setup

**Option A — Cloud project:**

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push        # applies all migrations
```

**Option B — Local with Docker:**

```bash
supabase start          # spins up local Postgres, Auth, Storage
supabase db reset       # applies migrations from scratch
```

### Storage buckets

Migrations `00003_storage_buckets_and_policies.sql` and `00004_event_flyer_draft_storage_policies.sql` create three public storage buckets (`profile-images`, `event-flyers`, `mix-covers`) with RLS policies, including flyer uploads **before** an event exists (draft path under the user id). Apply with `supabase db push` or `supabase db reset`.

## Development

```bash
npm run dev             # starts Next.js at http://localhost:3000
```

## Testing

```bash
npm test                # runs Jest + React Testing Library
npm run test:watch      # re-runs on file changes
```

## Production build

```bash
npm run build           # type-checks and builds for production
npm start               # serves the production build
```

## Project structure

```
app/                    # Next.js App Router pages & layouts
  (auth)/               #   login, signup
  (main)/               #   authenticated shell (home, events, mixes, search, dj profiles)
components/
  ui/                   #   shadcn/ui primitives
  shared/               #   reusable (EmptyState, LoadingSpinner, etc.)
  layout/               #   navbar, mobile bars, avatar dropdown
  events/               #   EventCard, EventForm, LineupBuilder, etc.
  mixes/                #   MixEmbed, MixCard
  profile/              #   ProfileHeader, FollowButton, SocialLinks
  forms/                #   GenreTagInput, ImageUpload
hooks/                  # Client-side data hooks (useCurrentUser, useProfile, etc.)
lib/
  auth/                 #   route helpers, session
  db/                   #   schema constants
  services/             #   profiles, events, mixes, follows, search, storage
  supabase/             #   client / server / middleware helpers
  utils/                #   embed URL transform, slug generation
types/                  # Generated Supabase types
supabase/migrations/    # SQL migrations (push with `supabase db push`)
__tests__/              # Jest tests mirroring the source tree
```
