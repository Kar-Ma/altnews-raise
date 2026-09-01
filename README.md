# Open Raise

A live monthly fundraising meter for reader-funded organisations in India.

One page that shows how much has come in this month, how far there is to go, and
what closes the gap — and that draws its own shareable poster from those numbers,
so nobody has to remake a graphic every time the total moves.

Built for anyone already collecting on Razorpay who currently publishes progress
by hand: newsrooms, legal aid and rights groups, community kitchens, shelters,
school and hospital funds.

## Why this exists

Newsrooms like Alt News run a monthly appeal and post a designed image with the
current total: raised, goal, shortfall, "another 1,200 readers at ₹500 closes
it." Someone updates that image by hand, so it is only ever right on the day it
was made, and the number on it can drift from the number in the books.

This does four things instead:

- **One page** with the current total, refreshed while you watch it.
- **A poster that renders itself** at `/poster.png` from the same figures.
  Post it, or post the page link — the link unfurls with its own live preview.
- **An admin screen** to set the goal, change it mid-month, and record money
  that arrived outside Razorpay.
- **A supporter card** at `/thanks` — something better to post than a
  screenshot of a payment receipt.

## Not a payment page

Open Raise never takes a payment, never creates one, and never stores a donor
record. The Donate button and the QR point at the organisation's existing
Razorpay page. All this does is read a total and draw it.

## Running it

```bash
npm install
npm run dev
```

It starts in **demo mode** on `http://localhost:4400` with generated numbers, so
you can see the whole thing before wiring anything up. Sign in at `/admin` with
the password in `ADMIN_PASSWORD` (`letmein` if you have not set one).

The admin opens on a four-step checklist, carries the Razorpay instructions
inline, and — while in demo mode — gives you two sliders for the day of the
month and how the month is going. Drag them and the figures and the poster
beside them redraw. Push the second past 100% to see what the page does when
the goal lands.

Two starting points are one press apart in the admin: the **Alt News example**,
filled in with real copy and invented numbers, and **Start from scratch** with
placeholder text for your own organisation. Contributions you entered by hand
survive either switch.

| Route | What it is |
| --- | --- |
| `/` | The public meter |
| `/poster` | Poster viewer with download and share |
| `/poster.png` | 1080×1350 poster, rendered live |
| `/og.png` | 1200×630 link-preview card |
| `/thanks` | Supporter card builder |
| `/supporter.png` | The card itself |
| `/about` | What it does and who it suits — for orgs deciding |
| `/admin` | Setup checklist, goal, copy, offline contributions, Razorpay |
| `/api/state.json` | The public read model, CORS-open |

## Going live

Set these and switch the source to **live** in `/admin`:

```
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
ADMIN_PASSWORD=something-long
SESSION_SALT=something-random
```

### About that key

Razorpay does not issue read-only keys. A key that can read payments can also
issue refunds, and `GET /v1/payments` returns every donor's email, phone, and —
if the page collects them for 80G — PAN and address.

So: **run this yourself.** Fork it, deploy it under your own domain, put your own
key in your own environment. Do not hand a Razorpay key to anyone, including
whoever showed you this.

Open Raise reads `amount`, `status`, and `amount_refunded`. It never writes donor
fields to disk and never sends them anywhere.

### What gets counted

Captured payments in the current calendar month, Asia/Kolkata, minus refunds,
plus whatever is entered by hand under offline contributions.

That last part matters. Most newsrooms also take cheques and bank transfers.
A page that silently counts only Razorpay will read lower than the organisation's
own figures, and a transparency page that contradicts the organisation is worse
than no page at all. Enter the other channels.

If the Razorpay call fails, the page shows zero online and says so. It will not
fall back to a plausible-looking number.

## Hosting it

Pick whichever of these describes you.

### The quick way — Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKar-Ma%2Fopen-raise&env=ADMIN_PASSWORD,SESSION_SALT&envDescription=A%20password%20for%20the%20admin%20screen%20and%20any%20random%20string%20for%20the%20session%20salt&project-name=open-raise&repository-name=open-raise)

That forks the repo into your account and deploys it. Two things to know:

1. **Set `ADMIN_PASSWORD` and `SESSION_SALT`** when it asks. Without a password
   the admin screen refuses to open at all, rather than falling back to a
   default anyone could read here.
2. **Add a key-value store.** Serverless filesystems reset between requests, so
   settings would not survive. In your project, go to Storage, create an Upstash
   Redis (or Vercel KV) database, and connect it — it sets `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` for you. The admin screen tells you in red if this is
   missing.

Razorpay keys are optional at this point. It runs in demo mode until you add
them, which is a fine way to show colleagues what it looks like.

### The durable way — a box with a disk

Railway, Fly, Render with a persistent volume, or any VPS. No key-value store
needed: settings go in `data/state.json`, so give that directory a volume.

```bash
git clone https://github.com/Kar-Ma/open-raise && cd open-raise
npm install && npm run build
ADMIN_PASSWORD=… SESSION_SALT=… node dist/server/entry.mjs
```

The adapter picks itself: Vercel's build sets `VERCEL=1` and gets the serverless
adapter, everything else gets the Node server. Nobody edits `astro.config.mjs`.

### Environment

| Variable | Needed | What it does |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes, once deployed | Opens the admin screen. Without it a deployment locks the panel. |
| `SESSION_SALT` | Yes, once deployed | Any random string; salts the admin session cookie. |
| `RAZORPAY_KEY_ID` | For real numbers | Read access to your payments. |
| `RAZORPAY_KEY_SECRET` | For real numbers | The other half. |
| `KV_REST_API_URL` | On serverless | Upstash/Vercel KV, so settings persist. |
| `KV_REST_API_TOKEN` | On serverless | The token for it. |

`UPSTASH_REDIS_REST_URL` / `_TOKEN` work too — same protocol, different
integration naming.

### Keeping the admin private

- It is `noindex, nofollow`, and `robots.txt` disallows `/admin` and `/api/admin`.
- Nothing on the public page links to it.
- A deployment with no `ADMIN_PASSWORD` refuses to sign anyone in.
- Auth is still one shared password. It keeps the goal out of a stranger's
  hands; it is not a substitute for your own SSO if you have one.

## Making it yours

Everything an organisation needs to change is in `src/lib/defaults.mjs` and the
admin screen: name, tagline, donate URL, goal, suggested amount, headline,
sub-lines, footer note. The palette is the `THEME` object in the same file.

Type is **Source Serif 4** for display and **Inter** for everything else.
Source Serif is a transitional text face — sturdy stems, moderate contrast,
even numerals — so it reads as broadsheet rather than dashboard and holds up
from a 70px poster headline down to a section heading. A Didone was tried and
rejected: the hairlines vanish at the sizes the figures need.

To swap either face, drop the `.woff` into `public/fonts/` and change one line:
the renderers only know them as `Display` and `Text`.

**Use the full or `latin` subset, never `latin-ext` alone.** The `-ext` files
carry only accented characters, so ASCII renders as empty boxes — and satori
falls back to the next registered face without raising anything.

## Known limits

- **Admin auth is one shared password.** Enough to keep the goal out of a
  stranger's hands, not enough for anything else. Put it behind your own SSO.
  A deployment with no `ADMIN_PASSWORD` set refuses to open the panel at all.
- **`/supporter.png` renders a name from the query string.** It is stripped and
  capped at 32 characters, but anyone can generate a card with any name on it and
  share it as though it came from you. Turn the route off if that is not a trade
  you want.
- **No history yet.** Past months are archived in state but nothing displays them.
  "Funded 47 months running" is the strongest line a reader-funded organisation
  has, and it is still on the floor.
- **Numbers refresh at most once a minute**, cached in process, so a hundred
  people watching the page is still one Razorpay call.

## Tests

```bash
npm test
```

Covers the month boundary in IST (including the last minute of a month and the
December rollover), the derived figures, refunds and pagination in the Razorpay
reader, and the failure path.

## Questions

If you run a reader-funded organisation in India and want a hand getting this
going, write to **hello@karthikmahadevan.com**. Bug reports and pull requests
are welcome in the issues.

To be clear about what I am not asking for: I don't want access to your Razorpay
account, your dashboard, or your donor data. You deploy this yourself and the
key stays in your environment.

## Licence

MIT. Use it, fork it, run it for your own organisation.
