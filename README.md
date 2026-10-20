# Sai Dwarak — Personal Design & AI Portfolio Platform

Production personal portfolio website and digital experience for **Sai Dwarak** (UI/UX Designer & AI Product Builder).

---

## Architecture Overview

- **Frontend**: Next.js App Router (16.4.2), React 19, TypeScript, Tailwind CSS v4, Framer Motion.
- **Backend & Database**: [Supabase](https://supabase.com) PostgreSQL with Row Level Security (RLS) on all exposed tables.
- **Authentication**: Supabase Auth with cookie-based session management (`@supabase/ssr`) and server-side admin allowlist in `public.admin_users`.
- **Storage**: Supabase Storage with dedicated buckets:
  - `portfolio-public`: Publicly deliverable published project covers, case-study screenshots, and character assets.
  - `portfolio-private`: Restricted draft documents and pre-release resumes accessible only by the verified administrator.
- **Hosting**: Vercel.

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Duplicate `.env.example` as `.env.local`:
```bash
cp .env.example .env.local
```
Configure your credentials from your Supabase Dashboard (**Project Settings -> API**):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

*(Note: The public website operates safely with built-in fallbacks if database credentials are not yet configured).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Database & Storage Setup

1. **Apply Migrations**:
   In the Supabase SQL Editor, run:
   ```sql
   -- Found in supabase/migrations/20261021000001_initial_schema.sql
   ```
   This creates:
   - `admin_users` table with hardened `public.is_admin()` function
   - `site_settings` singleton
   - `projects` with flexible categories, tools, tags, and links
   - `case_study_blocks` with cascade deletion
   - `tool_categories` & `tools` (seeded with 13 confirmed workflow tools)
   - `posts` (seeded with 0 posts)
   - `media_assets` metadata table
   - `portfolio-public` & `portfolio-private` storage buckets with object-level RLS policies

2. **Provision the First Administrator**:
   - In Supabase Dashboard -> **Authentication** -> **Users**, create your user.
   - Run the one-time registration query in SQL Editor:
     ```sql
     INSERT INTO public.admin_users (user_id, role, notes)
     VALUES ('<your-user-uuid-from-auth-users>', 'super_admin', 'Portfolio Owner');
     ```

3. **Verify Security Boundaries**:
   ```bash
   npm run db:verify
   ```

---

## Security Model

1. **Row Level Security (RLS)**: Enforced across 100% of exposed tables.
2. **Anonymous Isolation**: Unauthenticated visitors can only read published projects, published posts, visible tools, and public settings. Drafts and administrative tables return 0 rows.
3. **No Client-Side Escalation**: Normal authenticated users cannot grant themselves admin rights. Role verification is enforced server-side via `public.is_admin()` and `assertServerAdmin()`.
4. **Physical Storage Promotion**: When an asset is published, it is moved from `portfolio-private` to `portfolio-public` via the Storage API, ensuring private files are not exposed simply by flipping a database flag.
