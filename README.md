# Tally

A live monthly fundraising meter for reader-funded newsrooms in India.

One page that shows how much has come in this month, how far there is to go, and
what closes the gap — and that draws its own shareable poster from those numbers,
so nobody has to remake a graphic every time the total moves.

Built for organisations that already collect on Razorpay and currently publish
progress by hand.

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

Tally never takes a payment, never creates one, and never stores a donor
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

Tally reads `amount`, `status`, and `amount_refunded`. It never writes donor
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

## Deploying

Node, on anything. For Vercel:

```bash
npm install @astrojs/vercel
```

then swap the adapter in `astro.config.mjs`, and include the fonts the poster
renderer reads at runtime:

```js
import vercel from '@astrojs/vercel';
export default defineConfig({
  output: 'server',
  adapter: vercel({ includeFiles: ['public/fonts/text-400.woff', /* …the other four… */] }),
});
```

State lives in `data/state.json`. That is fine for one newsroom on one box; for
anything else, replace the two functions in `src/lib/store.mjs` with your
database and nothing else changes.

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
- **`/supporter.png` renders a name from the query string.** It is stripped and
  capped at 32 characters, but anyone can generate a card with any name on it and
  share it as though it came from you. Turn the route off if that is not a trade
  you want.
- **No history yet.** Past months are archived in state but nothing displays them.
- **Numbers refresh at most once a minute**, cached in process, so a hundred
  people watching the page is still one Razorpay call.

## Tests

```bash
npm test
```

Covers the month boundary in IST (including the last minute of a month and the
December rollover), the derived figures, refunds and pagination in the Razorpay
reader, and the failure path.

## Licence

MIT. Use it, fork it, run it for your own organisation.
