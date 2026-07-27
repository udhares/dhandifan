# Dhandifan — Farm to Buyer (starter)

A Next.js + MongoDB app. This is the first working slice: a public shop and a
farmer page to add products, both backed by a real database.

## What's in this starter

- **Public Shop** (`/products`) — reads real listings from the database, with search, category filter, sort, and sold-out marking.
- **Farmer page** (`/farmer/listings`) — add a listing and see all current listings.
- **API** (`/api/listings`) — `GET` active listings (public), `GET ?all=1` all listings, `POST` to create one.
- **Database models** — Farmer, Listing (used now) plus Crop and Order (ready for the next phase).

Everything runs in one codebase: the pages are the front-end, the `api` routes are the back-end.

---

## Step 1 — Install

Requires **Node.js 18.18 or newer**.

```bash
npm install
```

## Step 2 — Set up the database (MongoDB Atlas, free)

1. Create a free account at **mongodb.com/atlas**.
2. Create a free **M0** cluster.
3. **Database Access** → add a database user with a username and password.
4. **Network Access** → allow access (add `0.0.0.0/0` for now to keep it simple).
5. Click **Connect → Drivers** and copy the connection string.

## Step 3 — Add your connection string

```bash
cp .env.local.example .env.local
```

Open `.env.local` and paste your string, replacing `USERNAME` and `PASSWORD`
with your database user's details. This file stays private — it is already in
`.gitignore`, so it is never pushed to GitHub.

## Step 4 — Add sample data (optional)

```bash
npm run seed
```

This adds one farmer and a few example products so the shop isn't empty.

## Step 5 — Run it

```bash
npm run dev
```

Open **http://localhost:3000**. You land on the Shop page. Go to
**/farmer/listings** to add produce — new active listings appear on the Shop.

## Step 6 — Put it online (Vercel)

1. Push this project to a new **GitHub** repository.
2. Import the repo at **vercel.com**.
3. In the Vercel project → **Settings → Environment Variables**, add
   `MONGODB_URI` with your Atlas connection string.
4. Deploy. You get a live Dhandifan link.

---

## Planned next (later sessions)

- Cart, checkout, and orders (the **Sell** module)
- **Grow** module — crops, tasks, inputs, and yield
- **Delivery** zones and fees, and status tracking
- Buyer **accounts** and perks, with login
- **SMS + WhatsApp** notifications
- Bank-transfer **slip upload** and payment confirmation
- **Dhivehi (Thaana)** language
- **PWA** — installable app on phones
