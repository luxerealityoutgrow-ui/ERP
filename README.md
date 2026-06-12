# Luxe Realty – Real‑Estate CRM & ERP

This repository implements a web‑based Real‑Estate CRM and Property Listing Management ERP.

## Project stack

* **Framework** – Next 13 with the App router and TypeScript
* **UI** – Tailwind CSS + Radix UI + custom component library (see `/components/`)
* **Charts** – Recharts
* **Calendar** – FullCalendar (React wrapper)
* **Backend** – Supabase (Auth, Database, Storage, Row‑Level Security)

## Getting started

```bash
# install dependencies
npm install

# copy env variables and edit the values
cp .env.example .env
# edit .env with your Supabase info

# run locally
npm run dev
```

## File overview

```
app/
  layout.tsx           # app shell with sidebar + header
  dashboard/
    page.tsx            # dashboard with stats and charts
  leads/
    page.tsx            # list view
    create/page.tsx     # create lead
    [id]/page.tsx       # lead details
    edit/page.tsx        # edit lead
  pipeline/page.tsx     # kanban view
  properties/
    ...
  ...

src/
  lib/
    supabaseClient.ts
    auth.ts
    protected-route.tsx
    queries.ts
  components/
    layout/
      AppShell.tsx
      SidebarNav.tsx
    /* all reused component primitives */
```

## Supabase schema

The full SQL schema (tables + RLS) is in `supabase/schema.sql`.  Run it in the Supabase dashboard.

## Deployment

Deploy to Vercel or any Node 18 runtime.  Remember to set the environment variables.

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Notes

* Every CRUD endpoint is implemented as a server action (See `src/lib/queries.ts`).
* Role‑based access is enforced on the frontend via the `ProtectedRoute` component and on the backend via row‑level‑security policies.
* Audit logs are written automatically on every write operation.

---

Feel free to inspect the `src/lib/` and `app/` folders for concrete implementation details.
