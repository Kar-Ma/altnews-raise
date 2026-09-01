# Alt News Raise

The page for Alt News's monthly fundraising raise. It shows what has come in,
what is still needed, and every way to give — and it draws its own poster from
those numbers, so nobody has to remake a graphic when the total moves.

**Live preview:** https://altnews-raise-karma-lab.vercel.app

It was built unprompted, as a gift, by [Karthik Mahadevan](mailto:hello@karthikmahadevan.com).
Nobody at Alt News asked for it and nobody owes anything for it. If it is useful,
take it; the repository can be transferred to your GitHub account and you will
never need to hear from me again. If it is not, no reply is needed.

## What it is for

Right now the monthly raise goes out as an image on X with the running total on
it. Someone remakes that image by hand, it is only right on the day it is posted,
and it scrolls away within a day. Meanwhile
[altnews.in/transparency-of-funding](https://www.altnews.in/transparency-of-funding/)
still shows figures from FY 2017-18.

This is a permanent address for the same information. Send people here instead of
straight to the Razorpay link and they see where the month stands, all the ways to
give — including the monthly option, which a bare payment link never surfaces —
and the 80G and FCRA notes, before they decide.

## It does not touch your money

- It never takes a payment. Razorpay and Danamojo keep doing that; the buttons
  point at them.
- **It has no access to any of your accounts.** There is no API key, no
  integration, no token. Nothing to leak and nothing to revoke.
- It never sees a donor's name, email, PAN or address, because it never sees a
  donation. It knows one number, and only because someone typed it in.

That last part is deliberate. Your money arrives through Razorpay, through
Danamojo, and by cheque. No single account knows the real total, so a number read
automatically off one of them would be wrong. A number a person works out from all
three is not.

## Running the raise

Everything is at **/settings**, behind one password.

Most weeks the whole job is: add up what has come in, type it in one box, press
save. The page, the poster, the link preview and the share card all redraw from
that figure immediately. The page also stamps itself with when it was last
updated, and starts telling readers the figure may be behind if a week goes by.

You can also change the headline and the wording under it, the goal (it can move
mid-month), the suggested donation the "another N readers at ₹500" line counts in,
and the three ways to give.

See **[RUNBOOK.md](RUNBOOK.md)** for the month-to-month routine, and
**[DECISIONS.md](DECISIONS.md)** for why it is built the way it is.

## Sending donors back afterwards

Razorpay can send people to a page of your choosing once they have paid, instead
of its own receipt screen. Point it at `/thanks` and they get a card worth
posting — "I fund independent journalism", with their name and the month's
shortfall on it — instead of screenshotting a receipt, which is what they do now.

Razorpay Dashboard → your Payment Page → Edit → Page Settings → **Redirect to your
website**. Nothing else about how you take money changes.

## Hosting it

It is a small Astro site. It runs anywhere Node runs, and deploys to Vercel
without configuration.

```bash
npm install
npm run dev        # http://localhost:4400
```

Two environment variables matter:

| Variable | What it does |
| --- | --- |
| `ADMIN_PASSWORD` | Opens /settings. **Without it a deployment refuses to open the settings screen at all**, rather than falling back to a default published here. |
| `SESSION_SALT` | Any random string. Salts the settings cookie. |

On a serverless host (Vercel, Netlify) you also need a key-value store, or saved
settings will not survive — the filesystem resets between requests. In Vercel:
Storage → create an Upstash Redis database → connect it. That sets
`KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. The settings screen says in red
if this is missing. On anything with a disk, no store is needed: settings live in
`data/state.json`.

## Preview and published

While **Preview** is on, the page carries a banner saying the figures are
illustrative and asks search engines to stay away. Untick it in Settings when the
numbers are real. That is the only switch between "someone's proposal" and "your
page".

## Reading the code

It is about a thousand lines. The parts worth checking:

- `src/lib/raise.mjs` — every figure the page quotes, derived in one place.
- `src/lib/cycle.mjs` — the month boundary, in Asia/Kolkata.
- `src/lib/store.mjs` — the only thing that reads or writes saved settings.
- `src/pages/index.astro` — the public page.

```bash
npm test
```

Covers the month rollover in IST, the derived figures, the freshness wording, and
the donation links.

## Licence

MIT. It is yours to change, fork, or throw away.
