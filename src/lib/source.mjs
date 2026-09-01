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

  // A demo deployed on a read-only filesystem has no saved settings to read,
  // and a page sitting on day 1 of the month shows almost nothing. These let
  // the host park it somewhere more representative.
  const envDay = Number(process.env.DEMO_DAY);
  const envStrength = Number(process.env.DEMO_STRENGTH);
  const demoDay = state.demo.dayOverride ?? (Number.isFinite(envDay) && envDay > 0 ? envDay : null);
  const demoStrength = state.demo.strength
    ?? (Number.isFinite(envStrength) && envStrength > 0 ? envStrength : 0.82);
  const creds = credentials();
  const live = state.source.mode === 'live' && creds;

  const key = [cycle.id, live ? 'live' : 'demo', demoDay ?? 'now',
    demoStrength, state.campaign.goalPaise, state.offline.length].join(':');
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
      throughDay: demoDay,
      targetPaise: Math.round(state.campaign.goalPaise * demoStrength),
    });
  }

  const effectiveCycle = demoDay
    ? { ...cycle, dayOfCycle: Math.ceil(demoDay),
        daysLeft: Math.max(cycle.totalDays - Math.ceil(demoDay), 0),
        fractionElapsed: demoDay / cycle.totalDays }
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
