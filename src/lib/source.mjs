import { currentCycle } from './cycle.mjs';
import { readState } from './store.mjs';
import { derive } from './compute.mjs';
import { fetchCycleTotal } from './razorpay.mjs';
import { demoCycleTotal } from './demo.mjs';

// One in-process cache so a page, its poster and the JSON endpoint all quote the
// same figure, and so a busy day can't turn into a Razorpay pagination storm.
const TTL_MS = 60_000;
let cached = { key: null, at: 0, value: null };

export function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? { keyId, keySecret } : null;
}

export async function getSnapshot({ force = false, nowMs = Date.now() } = {}) {
  const state = await readState();
  const cycle = currentCycle(nowMs);
  const creds = credentials();
  const live = state.source.mode === 'live' && creds;

  const key = [cycle.id, live ? 'live' : 'demo', state.demo.dayOverride ?? 'now',
    state.demo.strength, state.campaign.goalPaise, state.offline.length].join(':');
  if (!force && cached.key === key && Date.now() - cached.at < TTL_MS) {
    return { ...cached.value, cachedAt: cached.at };
  }

  let total;
  let error = null;
  if (live) {
    try {
      total = await fetchCycleTotal({ ...creds, from: cycle.from, to: cycle.to });
    } catch (e) {
      error = e.message;
      // Falling back to demo would publish a fiction. Show zero and say why.
      total = { raisedPaise: 0, supporters: 0, ok: false };
    }
  } else {
    total = demoCycleTotal({
      cycle,
      seed: state.demo.seed,
      throughDay: state.demo.dayOverride,
      targetPaise: Math.round(state.campaign.goalPaise * (state.demo.strength ?? 0.82)),
    });
  }

  const effectiveCycle = state.demo.dayOverride
    ? { ...cycle, dayOfCycle: Math.ceil(state.demo.dayOverride),
        daysLeft: Math.max(cycle.totalDays - Math.ceil(state.demo.dayOverride), 0),
        fractionElapsed: state.demo.dayOverride / cycle.totalDays }
    : cycle;

  const value = {
    ...derive({
      cycle: effectiveCycle,
      raisedOnlinePaise: total.raisedPaise,
      supporters: total.supporters,
      offline: state.offline,
      campaign: state.campaign,
    }),
    org: state.org,
    campaign: state.campaign,
    offline: state.offline,
    mode: live ? 'live' : 'demo',
    hasCredentials: Boolean(creds),
    truncated: Boolean(total.truncated),
    error,
    generatedAt: nowMs,
  };

  cached = { key, at: Date.now(), value };
  return value;
}

export function invalidate() {
  cached = { key: null, at: 0, value: null };
}
