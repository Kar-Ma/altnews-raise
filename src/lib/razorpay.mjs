// Reads the one thing this app needs from Razorpay: captured payments in a
// window. Nothing here writes, refunds, or stores donor details — the payload
// carries email/phone/PAN and we deliberately drop all of it on the floor.

const API = 'https://api.razorpay.com/v1/payments';
const PAGE = 100;          // Razorpay's documented maximum
const MAX_PAGES = 400;     // 40,000 payments/month before we admit truncation

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function authHeader(keyId, keySecret) {
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

async function getPage({ keyId, keySecret, from, to, skip, fetchImpl }) {
  const url = `${API}?from=${from}&to=${to}&count=${PAGE}&skip=${skip}`;
  // Razorpay publishes no rate limit; back off on 429 rather than guessing one.
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await (fetchImpl ?? fetch)(url, {
      headers: { Authorization: authHeader(keyId, keySecret) },
    });
    if (res.status === 429) {
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Razorpay ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    return res.json();
  }
  throw new Error('Razorpay rate limit: gave up after 4 attempts');
}

/**
 * Total actually banked in the window, net of refunds, plus a supporter count.
 * `include` lets an org with several payment pages count only some of them.
 */
export async function fetchCycleTotal({ keyId, keySecret, from, to, include, fetchImpl }) {
  let raisedPaise = 0;
  let supporters = 0;
  let fetched = 0;
  let truncated = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await getPage({ keyId, keySecret, from, to, skip: page * PAGE, fetchImpl });
    const items = body.items ?? [];
    for (const p of items) {
      if (p.status !== 'captured') continue;
      if (include && !include(p)) continue;
      const net = p.amount - (p.amount_refunded ?? 0);
      if (net <= 0) continue;
      raisedPaise += net;
      supporters += 1;
    }
    fetched += items.length;
    if (items.length < PAGE) return { raisedPaise, supporters, fetched, truncated, ok: true };
    if (page === MAX_PAGES - 1) truncated = true;
  }
  return { raisedPaise, supporters, fetched, truncated, ok: true };
}

/** Matches payments that came through a specific Payment Page, by its title. */
export const byDescription = (needle) => (p) =>
  typeof p.description === 'string' && p.description.toLowerCase().includes(needle.toLowerCase());

/**
 * A single cheap request, so the admin screen can answer "are these keys any
 * good?" without pulling a month of payments.
 */
export async function pingRazorpay({ keyId, keySecret, fetchImpl }) {
  try {
    const res = await (fetchImpl ?? fetch)(`${API}?count=1`, {
      headers: { Authorization: authHeader(keyId, keySecret) },
    });
    if (res.status === 401) {
      return { ok: false, message: 'Razorpay rejected the key. Check the id and secret, and that both are from the same mode (test or live).' };
    }
    if (!res.ok) {
      return { ok: false, message: `Razorpay replied ${res.status}. ${(await res.text()).slice(0, 140)}` };
    }
    const body = await res.json();
    return {
      ok: true,
      message: `Connected. Razorpay reports ${body.count ?? 0} payment${body.count === 1 ? '' : 's'} on this account.`,
    };
  } catch (e) {
    return { ok: false, message: `Could not reach Razorpay: ${e.message}` };
  }
}
