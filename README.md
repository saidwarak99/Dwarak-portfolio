# Sai Dwarak — Personal Design & AI Portfolio Platform

Production portfolio website and digital experience for **Sai Dwarak** (UI/UX Designer & AI Product Builder).

---

## Architecture Overview

- **Frontend**: Next.js App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion.
- **Database**: [Neon](https://neon.tech) Serverless PostgreSQL.
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team) + Drizzle Kit.
- **Authentication**: [Clerk](https://clerk.com) (single-administrator allowlist via `PORTFOLIO_ADMIN_USER_ID`).
- **Media Storage**: [Cloudinary](https://cloudinary.com) with server-signed direct uploads and access modes.
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
Fill in your credentials from the Neon console, Clerk dashboard, and Cloudinary console.

*(Note: The public site operates safely with built-in fallbacks if database credentials are not yet configured).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Database Management (Drizzle ORM)

- **Generate Migrations**:
  ```bash
  npm run db:generate
  ```
- **Push Schema directly to Neon**:
  ```bash
  npm run db:push
  ```
- **Open Drizzle Studio (Visual DB Browser)**:
  ```bash
  npm run db:studio
  ```
- **Seed Initial Data** (seeds site settings & confirmed 13 workflow tools; zero projects or posts):
  ```bash
  npx tsx src/db/seed.ts
  ```

---

## Security Model

1. **Server-Only Database Credentials**: `DATABASE_URL` is never exposed to browser code.
2. **Server-Side Authorization Boundary**: All mutations pass through server-side handlers that verify the authenticated Clerk user against `PORTFOLIO_ADMIN_USER_ID`. Client flags, user-supplied roles, or hidden gestures are never treated as authorization.
3. **Cloudinary Signed Uploads**: Direct uploads from the browser use server-generated HMAC-SHA1 signatures. `CLOUDINARY_API_SECRET` is never sent to the client.
4. **Asset Access Strategy**:
   - **Public Delivery**: Standard Cloudinary CDN delivery for published project covers, case-study screenshots, and public character assets.
   - **Restricted/Authenticated Delivery**: Signed, time-limited URLs for draft projects and private resumes before public release.
