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

## Testing

### Unit tests (no database required)

```bash
npm run test:unit
```

Tests pure logic: permission rules (`src/lib/permissions.ts`) and workshop status machine.

### Integration tests (real Postgres required)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/studio_test \
  npm run test:integration
```

Tests the service layer (`src/services/`) end-to-end against real Postgres: template CRUD, event creation + status transitions, booking capacity enforcement, payment status updates.

The service layer is designed to be injectable — the same functions are called from Next.js server actions and will also power future mobile API endpoints.

### E2E tests (Playwright)

```bash
npm run test:e2e                                     # against local dev server
PLAYWRIGHT_BASE_URL=https://example.vercel.app npm run test:e2e   # against deployment
```

### All vitest suites

```bash
npm test              # run all vitest tests
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — always deployable, protected |
| `feat/*`, `fix/*`, `chore/*` | Feature/fix branches — open PRs against `main` |

### Rules

- **`main` is protected** — direct pushes require CI to pass first.
- **All changes flow through pull requests.**
- **Required PR checks (before merging):**
  - Lint + TypeScript typecheck pass
  - Unit tests pass
  - Integration tests pass (Docker Postgres service container)
  - Build succeeds
- **On merge to `main`:** full test suite → Vercel production deploy → E2E smoke tests on live URL.

### Workflow

```
feat/your-feature  →  PR to main  →  CI checks  →  Code review  →  Merge  →  Auto-deploy
```

---

## CI/CD

Two GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Jobs |
|----------|---------|------|
| `ci.yml` | Push to any branch (non-main) | lint + typecheck + unit tests |
| `ci.yml` | PR to `main` | + integration tests + build |
| `deploy.yml` | Merge to `main` | full tests → Vercel deploy → E2E smoke |

Required GitHub Secrets for deploy:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## Deployment

Deploy to Vercel. Set all environment variables in the Vercel dashboard. Use Neon's pooled URL for `DATABASE_URL`.
