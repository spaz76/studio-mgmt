# Atnachta Studio Management

Hebrew RTL, mobile-first, multi-tenant SaaS for creative studios.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui**
- **Prisma v7** + **PostgreSQL** (Neon serverless)
- **NextAuth v5** (credentials provider, JWT sessions)

## Local Setup

### 1. Clone & install

```bash
git clone <repo>
cd studio-mgmt
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in the following in `.env.local`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled connection URL |
| `DIRECT_URL` | Neon PostgreSQL direct connection URL (for migrations) |
| `AUTH_SECRET` | Random 32+ char secret (`npx auth secret`) |
| `AUTH_URL` | App base URL (e.g. `http://localhost:3000`) |

### 3. Database

```bash
npx prisma migrate dev --name init
```

### 4. Seed (optional — creates first studio + owner)

```bash
npx tsx prisma/seed.ts
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
  app/
    (auth)/         # Login page (no admin chrome)
    (admin)/        # Protected admin area
      dashboard/
    api/
      auth/         # NextAuth route handler
  components/
    layout/         # AdminShell, Sidebar, TopBar
    ui/             # shadcn/ui components
  lib/
    auth.ts         # NextAuth config
    prisma.ts       # Prisma client singleton
    permissions.ts  # Role-based permission helpers
  types/
    next-auth.d.ts  # Session type extensions
  middleware.ts     # Auth middleware
prisma/
  schema.prisma     # Full data model
```

## Roles & Permissions

| Permission | OWNER | MANAGER | OPERATOR | VIEWER |
|---|:---:|:---:|:---:|:---:|
| createWorkshop | ✓ | ✓ | ✓ | |
| editWorkshop | ✓ | ✓ | ✓ | |
| deleteWorkshop | ✓ | ✓ | | |
| manageBookings | ✓ | ✓ | ✓ | |
| createProduct | ✓ | ✓ | | |
| editProduct | ✓ | ✓ | | |
| updateProductStock | ✓ | ✓ | ✓ | |
| createMaterial | ✓ | ✓ | ✓ | |
| consumeMaterial | ✓ | ✓ | ✓ | |
| updatePaymentStatus | ✓ | ✓ | | |
| viewReports | ✓ | ✓ | ✓ | ✓ |
| exportReports | ✓ | ✓ | | |
| manageUsers | ✓ | | | |
| changePlan | ✓ | | | |
| editStudioSettings | ✓ | | | |

Owners can grant/revoke individual permissions per user via `extraPermissions` / `revokedPermissions` on `StudioMember`.

## Deployment

Deploy to Vercel. Set all environment variables in the Vercel dashboard. Use Neon's pooled URL for `DATABASE_URL`.
