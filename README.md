# Oscar Ballot 98

A production-ready Oscars pick'em web app for the **98th Academy Awards**. Users create accounts, pick winners across 16 categories grouped into 6 prestige clusters, wager on a Final 10 bonus pick, and compete on a live leaderboard.

**Max score: 200 points.**

---

## Features

- **Dark cinematic UI** – gold glows, film grain, animated accents, cluster color-coding
- **6 prestige clusters** with sweep bonuses (see scoring below)
- **Final 10 bonus** – pick one Crown category + nominee for +10 pts
- **Ballot locking** – auto-locks at close time; users can commit early
- **Live leaderboard** – deterministic tiebreakers, per-user breakdown
- **Admin dashboard** – winner staging, publish, CRUD, audit log, bulk import/export
- **RSS news ticker** – fetches Oscar headlines into a rotating sidebar
- **Oscar trivia cards** – rotating fun facts sidebar panel
- **Role-based access** – `admin`, `editor`, `user`

---

## Scoring

| Cluster | Categories | Base | Sweep Bonus | Max |
|---------|-----------|------|-------------|-----|
| 👑 The Crown | Picture · Director · Actor · Actress | 10 pts each | +20 (all 4) | **60** |
| 🎭 The Performers | Supp. Actor · Supp. Actress | 8 pts each | +10 (both) | **26** |
| ✍️ The Authors | Orig. Screenplay · Adapted Screenplay | 8 pts each | +12 (both) | **28** |
| 🌍 Global & Animated | International · Animated Feature | 7 pts each | +10 (both) | **24** |
| 🎵 Soundtrack | Orig. Score · Orig. Song | 6 pts each | +8 (both) | **20** |
| 🎬 The Crafts | Cin · Prod. Design · Costume · Editing | 5 pts each | +5 (3/4) or +12 (4/4) | **32** |
| 🎯 Final 10 | One Crown pick | — | — | **10** |
| | | | **Total** | **200** |

### Tiebreakers (in order)
1. Highest total score
2. Highest Crown cluster points
3. Most total correct picks
4. Earlier ballot commit timestamp
5. Alphabetical by display name

---

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4**
- **Prisma 6** + SQLite (local) / Postgres (production)
- **NextAuth v5** (credentials provider)
- **Vitest** (unit + E2E scoring tests)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and configure
cp .env.example .env
# Edit .env — defaults work for local SQLite dev

# 3. Push schema to SQLite
npm run db:push

# 4. Seed with 98th Academy Awards data
npm run db:seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Seeded credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@oscars98.com | changeme123 |
| User | alice@demo.com | demo1234 |
| User | bob@demo.com | demo1234 |
| User | charlie@demo.com | demo1234 |

---

## Environment Variables

```env
# Required
DATABASE_URL="file:./dev.db"            # SQLite local; use postgres:// for prod
AUTH_SECRET="<openssl rand -base64 32>" # NextAuth secret
AUTH_URL="http://localhost:3000"

# App identity
NEXT_PUBLIC_APP_NAME="Oscar Ballot 98"
NEXT_PUBLIC_AWARDS_YEAR="98th"
NEXT_PUBLIC_AWARDS_YEAR_NUM="2026"

# RSS ticker feeds (comma-separated URLs)
TICKER_RSS_FEEDS="https://www.hollywoodreporter.com/feed/"
TICKER_FETCH_INTERVAL_MINUTES="30"

# Seed credentials (only used during db:seed)
ADMIN_EMAIL="admin@oscars98.com"
ADMIN_PASSWORD="changeme123"
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run all 23 unit + E2E tests |
| `npm run db:push` | Sync Prisma schema to DB |
| `npm run db:seed` | Seed DB with Oscar 98 data |
| `npm run db:reset` | Reset + reseed DB |
| `npm run db:studio` | Open Prisma Studio |
| `npm run ticker:fetch` | Manually fetch RSS news |

---

## Project Structure

```
oscar-ballot-98/
├── prisma/
│   ├── schema.prisma          # Full data model
│   └── seed.ts                # Seed script (clusters, nominees, trivia)
├── scripts/
│   └── fetch-ticker.ts        # Standalone RSS fetcher (cron-friendly)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── auth/              # Sign in / Register
│   │   ├── ballot/            # Ballot page + client component
│   │   ├── leaderboard/       # Leaderboard + breakdown
│   │   ├── admin/             # Admin dashboard (tabbed)
│   │   └── api/
│   │       ├── auth/          # NextAuth route handler
│   │       ├── ticker/        # Ticker GET + POST fetch
│   │       └── admin/         # Export, Import, Template routes
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Providers.tsx      # SessionProvider wrapper
│   │   ├── TickerSidebar.tsx  # News + trivia sidebar
│   │   └── CountdownTimer.tsx # Live ballot countdown
│   ├── lib/
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── actions.ts         # Server actions (picks, admin, etc.)
│   │   ├── scoring.ts         # Deterministic scoring engine
│   │   ├── scoring.test.ts    # Unit tests (20 tests)
│   │   ├── scoring.e2e.test.ts# E2E test: publish → leaderboard (3 tests)
│   │   ├── ticker-fetcher.ts  # RSS fetch + DB cache
│   │   └── constants.ts       # Cluster colors, icons, config
│   ├── middleware.ts           # Auth protection + role guards
│   └── types/
│       └── next-auth.d.ts     # Session type extensions
└── public/
    └── placeholders/          # SVG placeholder nominee images (10)
```

---

## Admin Workflow

1. **Set ballot window** — Admin > Ballot Window tab (opens/closes date + timezone)
2. **Add nominees** — Admin > Nominees tab, or bulk import JSON
3. **Add insights** — Admin > Import/Export (import insights JSON with metrics per category/nominee)
4. **Manage ticker** — Admin > Ticker tab (manual items or trigger RSS fetch)
5. **Enter draft winners** — Admin > Winners tab (select per category; doesn't affect leaderboard yet)
6. **Publish winners** — Click "Publish Winners" button → scores recompute for all users instantly
7. **Recompute scores** — Admin > Overview > "Recompute All Scores" if needed
8. **Audit log** — Admin > Audit Log tab (all admin/editor actions with before/after JSON)

---

## Nominee Images

Placeholder SVG images live in `/public/placeholders/nominee-1.jpg` through `nominee-10.jpg`.

To replace with real images:
1. Drop photos (JPG/PNG) into `/public/placeholders/`
2. Update `nominee.imageUrl` in DB via Admin > Nominees or the import JSON
3. Recommended: 300×400px, 3:4 aspect ratio

---

## Production Deployment (Vercel)

1. Switch `DATABASE_URL` to a Postgres connection string (e.g. Neon or Supabase)
2. Set all env vars in Vercel dashboard
3. Add `prisma generate && prisma db push` to your build command
4. Schedule `npm run ticker:fetch` via Vercel Cron:

```json
// vercel.json
{
  "crons": [
    { "path": "/api/ticker/fetch", "schedule": "0 */2 * * *" }
  ]
}
```

---

## Testing

```bash
npm test           # 23 tests total
npm run test:watch # Watch mode
```

Tests cover:
- All 6 cluster sweep conditions
- Crafts partial (3/4 = +5) vs full (4/4 = +12) bonus
- Final 10 hit/miss
- Max score = 200
- All 5 tiebreaker levels
- E2E: publish winners → correct per-user scores → sorted leaderboard
