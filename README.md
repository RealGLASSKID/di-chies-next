# DI CHIES Marketplace (Next.js)

Converted from TanStack Start / Vite to **Next.js App Router**.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- TanStack React Query
- Supabase
- shadcn/ui components

## Getting started

```bash
npm install
cp .env.local.example .env.local   # or use the included .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_PROJECT_ID=
```

Optional (server-only admin operations):

```
SUPABASE_SERVICE_ROLE_KEY=
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

## Project structure

```
src/
  app/                 # Next.js App Router pages
  components/          # UI, layout, products, shop
  hooks/               # useAuth, useCart, use-mobile
  integrations/        # Supabase client
  lib/                 # queries, theme, utils, format
  types/               # catalog types
```

UI/UX matches the original Lovable design.
