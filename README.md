# LinkedIn Power Post

An AI-powered LinkedIn post generator SaaS built with Next.js 16, Claude AI (Anthropic), Google Gemini, and Supabase.

## Features

- **AI Post Generation** — Generate single posts, carousels, and polls using Claude (Anthropic)
- **AI Image Generation** — Generate images for posts using Google Gemini
- **Brand Profile** — Set your tone, industry, and style for personalized posts
- **Post History** — Save and revisit previously generated posts
- **Conversational Q&A** — Refine posts via back-and-forth chat with AI
- **Supabase Auth** — Email/password authentication with protected routes

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth & DB | Supabase |
| AI (posts) | Anthropic Claude API |
| AI (images) | Google Gemini API |

---

## Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Edit `.env.local` with your real values:

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini API
GEMINI_API_KEY=AIza...

# Supabase (from your project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Set up Supabase database

Run the following SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Posts table
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  post_type text not null default 'single',
  topic text,
  image_url text,
  created_at timestamptz default now()
);

-- Brand profiles table
create table if not exists brand_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text,
  industry text,
  tone text default 'professional',
  target_audience text,
  key_topics text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table posts enable row level security;
alter table brand_profiles enable row level security;

-- RLS policies for posts
create policy "Users can view own posts"
  on posts for select using (auth.uid() = user_id);

create policy "Users can insert own posts"
  on posts for insert with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on posts for delete using (auth.uid() = user_id);

-- RLS policies for brand_profiles
create policy "Users can view own brand profile"
  on brand_profiles for select using (auth.uid() = user_id);

create policy "Users can insert own brand profile"
  on brand_profiles for insert with check (auth.uid() = user_id);

create policy "Users can update own brand profile"
  on brand_profiles for update using (auth.uid() = user_id);
```

### 5. Configure Supabase Auth

In your Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `http://localhost:3000` (dev) or your production URL
- **Redirect URLs**: Add `http://localhost:3000/**`

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### 7. Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```
app/
├── api/
│   ├── brand-profile/    # GET/POST brand settings
│   ├── chat/             # Conversational post refinement
│   ├── generate-image/   # Gemini image generation
│   ├── generate-post/    # Claude post generation
│   ├── posts/            # Post CRUD
│   └── suggest-slides/   # Carousel slide suggestions
├── create/               # Post creation page
├── dashboard/            # Main dashboard
├── history/              # Saved posts
├── login/                # Auth login page
├── register/             # Auth register page
└── settings/             # Brand profile settings
lib/
├── supabase/
│   ├── client.ts         # Browser Supabase client
│   ├── server.ts         # Server Supabase client
│   └── middleware.ts     # Session refresh helper
components/
├── layout/
│   └── Sidebar.tsx       # App navigation sidebar
└── ui/                   # shadcn/ui components
proxy.ts                  # Next.js route protection middleware
```

---

## Notes

- **Placeholder credentials**: `.env.local` ships with valid-format placeholder values so the build succeeds without real keys. Replace them with real credentials before using the app.
- **Email confirmation**: Supabase sends a confirmation email on sign-up by default. You can disable this in Supabase Dashboard → Authentication → Settings.
