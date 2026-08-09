# FarmsKing Backend

NestJS + Prisma (PostgreSQL) API for FarmsKing — a farm management and farm accounting app for Indian farmers.

## Stack

- NestJS 11 (Express)
- Prisma 6 / PostgreSQL
- JWT auth (`@nestjs/jwt`, `passport-jwt`) with `argon2` password hashing
- Role-based access control (`FARMER`, `ADVISOR`, `ADMIN`)
- `@nestjs/throttler` for rate limiting, `helmet` for HTTP header hardening

## Setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and a real JWT_SECRET
npx prisma migrate dev
npm run db:seed        # seeds expense categories + common fertilizers
npm run start:dev
```

The API listens on `PORT` (default `4100`) under the `API_PREFIX` (default `/api/v1`).

## Current modules (Phase 1)

- **Auth** — `POST /auth/register`, `POST /auth/login`. Registration always creates a `FARMER` account; `ADVISOR`/`ADMIN` accounts are provisioned out-of-band (seed/admin tooling), never via self-registration.
- **Farms** — `/farms` CRUD, scoped to the authenticated farmer (or all farms for `ADMIN`).
- **Plots** — `/plots` CRUD, `/plots/farm/:farmId` to list a farm's plots. Ownership is verified through the parent farm.
- **Crops** — `/crops` CRUD (crop cycles), `/crops/plot/:plotId` to list a plot's crop cycles. Ownership is verified through plot → farm.

All list/detail/update/delete operations enforce farmer data isolation at the service layer: a farmer can only ever see/modify records reachable from farms they own. A record that exists but belongs to another farmer returns `404`, not `403`, so IDs can't be used to probe for other farmers' data.

## Database schema

`prisma/schema.prisma` also defines the full data model for later phases (expenses, sales, customers, payments, labour, fertilizer, spray, spray schedules, crop problems, harvest, inventory, machinery, irrigation, advisor assignment, market rates, notifications) so the schema doesn't need reworking as those modules are built — only Phase 1 (Farms/Plots/Crops) has application code so far.

## Scripts

- `npm run start:dev` — watch mode
- `npm run test` / `npm run test:e2e` — unit / e2e tests
- `npm run lint` — ESLint
- `npx prisma studio` — browse the database
- `npm run db:seed` — re-run the lookup-data seed (idempotent)
