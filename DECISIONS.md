# Decisions and things learned

Why this is shaped the way it is, and what cost time to find out. Written on
2 September 2026, at the point the pages were sent to Alt News.

The short version of the whole project: it started as a tool for Alt News,
drifted into a generic product for any nonprofit, and was rebuilt back into a
tool for Alt News. The middle version was worse than either end.

---

## The shape of it

### It is built for one organisation on purpose

There was a version of this that had presets, a blank template, a `/about` page
selling the idea, and a name of its own. It served nobody. Alt News had to read
past a product pitch before reaching anything of theirs, and anyone else landed
in a demo full of somebody else's newsroom.

Generalising later is close to free. Generalising first cost the pitch. If Alt
News adopts this, "the thing Alt News uses" is better evidence than any feature
list, and a generic fork is an afternoon's work at that point.

### The figures are typed in, not read from an API

This is the decision everything else follows from, and it was arrived at
backwards. The first build read Razorpay's payments API and derived the total.

Research killed it. Alt News collects through **Razorpay**, through
**Danamojo** (including recurring "Monthly ₹250/₹500/₹1,000 for Alt News"), and
by **cheque and DD** to their Ahmedabad address. No single account knows the
real total, so a number read automatically off one of them is wrong by
construction, and they would spot it in a minute.

Typing it in is therefore *more* accurate, not less. It also means:

- No API key, no token, no integration, nothing to leak or revoke.
- The app never sees a donor's name, email, PAN or address, because it never
  sees a donation.
- The scariest paragraph disappears from the pitch. Razorpay issues no
  read-only keys, so asking for one means asking for refund powers and a donor
  PII feed. An unsolicited offer that begins there reads like phishing.

### The page is a triage point, not a status board

Alt News currently shares the Razorpay link directly. That link is a form. It
does not say what the money is for, how the month is going, that monthly giving
exists, that 80G applies, or that they cannot accept foreign money.

So the page carries every route on one screen, with monthly given the same
weight as one-off, and the legal notes where a donor needs them rather than
buried. The Razorpay link is the last step, not the first.

### A hand-kept number has to carry its own timestamp

Because a person types it, the page says when: "Figure updated 2 hours ago, by
Alt News." After seven days it starts telling readers the figure may be behind.

The cost of not updating is therefore visible rather than silent, which is the
right way round for a page whose subject is transparency.

### The supporter count is optional and hidden when unset

Alt News does not publish a supporter count, so the deployed preview leaves it
blank rather than inventing one for a page carrying their name. Every line that
quotes it has a version that reads properly without it. This was botched first
time: a share card went out reading "one of **0** readers funding September".

### What was deliberately left out

- **A history view.** "Funded 47 months running" is the strongest line a
  reader-funded organisation has, and the data is already archived. It is the
  first thing to build if this gets adopted.
- **An amount on the supporter card.** Razorpay's redirect sends a payment id
  and a signature, never the amount. Reading it would need the API key we refuse
  to hold, and asking donors to type it would put an unverifiable number on a
  fact-checker's card.
- **Anything that writes.** No refunds, no payments, no donor records.

---

## Design

### Typography took four attempts

1. **Inter + Lora.** The default. A design linter flagged Inter by name as an
   AI-generated-UI tell, and it was right.
2. **Zilla Slab + IBM Plex Sans.** Closer to the voice of their printed appeals.
   Good, but my read of their brand rather than theirs.
3. **Bodoni Moda + Inter**, matching a font identification of their own poster.
   A mistake. A Didone survives a poster headline and nothing else; at the sizes
   the *figures* need, the hairlines drop out and the numerals stop being
   readable. Fatal for a page whose entire job is a number.
4. **Source Serif 4 + Inter.** Six newspaper serifs set at real sizes and
   compared side by side: Source Serif 4, Literata, PT Serif, Frank Ruhl Libre,
   Domine, Merriweather. Source Serif 4 at 800 won on the numerals, which are
   the thing that matters here. Literata was the runner-up if a warmer,
   chunkier alternative is ever wanted.

Lesson: render the real headline and the real figures at the real sizes and
look. Choosing a typeface from memory produced two wrong answers in a row.

The Didone is also why section headings sit in the serif again. Source Serif is
a text face and holds up at heading sizes; Bodoni did not, so headings had been
pushed into the sans as a workaround.

### The palette is newsprint, crimson and marigold

Warm newsprint rather than the safe off-white, because their own printed appeals
sit in that register. Crimson carries the ask; marigold carries the thank-you.
A linter flags cream backgrounds as an AI default. Waived deliberately, with the
reason recorded in `.impeccable/config.json`.

### Cards should not repeat the sentence above them

The first version of the stat row said the shortfall, then the shortfall again
in digits, then the reader count that the line above it had already given. They
now carry only what that line does not: how many days are left and what that
means per day.

### Naming went Tally → Open Appeal → Raise Meter → Open Raise → altnews-raise

**Tally** was the worst possible name for a fundraising tool aimed at Indian
nonprofits: it is the accounting software half the country runs on. Worth
checking a name against the market it is for, not the market you know.

---

## Things that cost time

Mostly written down so the next person does not pay for them twice.

### satori (the image renderer)

- **An undefined value anywhere in a style object throws deep inside its CSS
  parser**, with a stack pointing nowhere near the caller. The node helper now
  strips undefined values before they reach it.
- **`latin-ext` font subsets contain only accented characters, not ASCII.**
  Text renders as empty boxes and satori silently falls back to the next
  registered face, so the poster looks fine and is simply in the wrong font.
  Use the full or `latin` subset. This burned two typeface evaluations.
- **A box whose text needed a fallback font loses its margin**, so words weld
  together: "₹6.5lakh". Serif lines are laid out word by word for this reason,
  with the ₹ in a box of its own.
- **There is no baseline alignment.** `alignItems: 'baseline'` silently
  misaligns; use `flex-end` and nudge.
- **Yoga shrinks children by default**, which quietly collapses stacked blocks.
  `flexShrink: 0` on everything.

### Astro

- **A local `.env` reaches `import.meta.env`, not `process.env`.** Setting
  `ADMIN_PASSWORD` in `.env` did nothing in development, and an old session
  cookie stayed valid. One helper (`src/lib/env.mjs`) now reads both and is the
  only place in the app that touches `process.env`.
- **The built-in CSRF check breaks behind a proxy.** It compares the `Origin`
  header against the host it believes it is serving; on Vercel those differ, so
  every settings save returned "Cross-site POST form submissions are forbidden".
  It worked locally and was broken only in production. Disabled, which is safe
  here because the session cookie is `SameSite=Lax` and browsers will not send
  it on a cross-site POST at all.
- **`Astro.url` carries the internal hostname behind a proxy**, so `og:image`
  went out as `https://localhost/og.png` on the live site and no link preview
  worked anywhere. `src/lib/url.mjs` reads the forwarded headers instead.

### Vercel

- **`.gitignore` does not govern what the CLI uploads; `.vercelignore` does.**
  The first deploy carried `data/state.json` up with it and the public page
  showed whatever was in one laptop's settings.
- **Blob is not a settings store.** It is first-party and can be created from
  the CLI with no marketplace terms, which makes it look like the obvious
  answer. It is object storage behind a cache and it is eventually consistent:
  overwriting a pathname returned the previous value four times in five, and
  writing a fresh pathname and finding it through `list()` still missed twice in
  six, because `list()` lags too. Save the number, reload, see the old number.
  Upstash Redis, through the Vercel marketplace, is what works.
- **New projects can inherit SSO deployment protection**, which serves a Vercel
  login page instead of the site.

### Razorpay

- **Payment Pages take `?amount=<rupees>` and pre-fill the form**, but on the
  *vanity* URL. The `pages.razorpay.com/pl_xxx/view/?amount=500` form in their
  own documentation returns 404 on a live page.
- **The post-payment redirect sends `razorpay_payment_id`, a link status and a
  signature. Not the amount.**
- **There are no read-only API keys.** A key that reads payments can also issue
  refunds, and `GET /v1/payments` returns donor email, phone and, where an
  organisation collects them for 80G, PAN and address.

### About Alt News specifically

- They are **not registered under FCRA** and cannot accept foreign remittance,
  so the page says so before an overseas donor wastes a declined card.
- Their [transparency page](https://www.altnews.in/transparency-of-funding/)
  still publishes a single FY 2017-18 expense breakdown. Meanwhile the real
  monthly figures go out as images on X and scroll away within a day. That gap,
  rather than "save your designer twenty minutes", is the actual argument for
  this page.

---

## Where it stands

- Roughly 2,000 lines across 21 commits, built 1–2 September 2026.
- Live at `altnews-raise.vercel.app`, marked as a preview and hidden from
  search, seeded with Alt News's own published figures (₹5,00,000 of
  ₹11,00,000).
- Settings persist through Upstash Redis. Save, sign-in and rejection of a wrong
  password all verified against the deployed site, not just locally.
- 19 tests covering the month rollover in IST, the derived figures, the
  freshness wording, the donation links and the admin lock.
- Sent to Alt News on 2 September 2026. Nothing has been agreed with them; they
  did not ask for this and owe nothing for it.

If they want it, the repository can be transferred to them outright. If they do
not, the generic version is a fork away, and everything above still applies.
