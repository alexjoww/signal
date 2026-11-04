# Signal

Lightweight org feedback triage: anyone can submit feedback, feature requests, or bug reports (with an optional screenshot). Admins/managers assign status, tag by team or product area, and leave comments.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo personas

Use the persona switcher in the header:

- **Members** (Maya, Jordan) — submit signals
- **Admins** (Sam, Alex) — open **Triage**, update status / tags, comment

SQLite data lives in `data/signal.db` and reseeds automatically when empty. Screenshots go to `public/uploads/`.

```bash
npm run db:reset   # wipe local DB (reseeds on next request)
```

## Stack

Next.js App Router · React 19 · Tailwind CSS 4 · better-sqlite3
