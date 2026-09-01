// Synthetic donations that behave like the real thing: a burst on the 1st, a
// long flat middle, spikes on the days a campaign post goes out, and a scramble
// at month end. Deterministic, so the demo never contradicts itself on reload.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Rough shape of a reader-funded month, indexed by fraction of the month done.
function dayWeight(day, totalDays, rand) {
  const t = day / totalDays;
  const launch = 2.6 * Math.exp(-Math.pow(t / 0.09, 2));      // the announcement
  const push = 1.5 * Math.exp(-Math.pow((t - 0.55) / 0.07, 2)); // the mid-month reminder
  const closing = 1.9 * Math.exp(-Math.pow((t - 1) / 0.10, 2)); // the deadline
  const baseline = 0.55;
  return (baseline + launch + push + closing) * (0.78 + rand() * 0.44);
}

// A plausible ladder of Indian donation sizes: lots of ₹500, a few large ones.
const LADDER = [
  [10000, 0.06], [25000, 0.14], [50000, 0.38], [100000, 0.22],
  [200000, 0.10], [500000, 0.07], [1000000, 0.025], [2500000, 0.005],
];

function pickAmount(rand) {
  let r = rand();
  for (const [paise, weight] of LADDER) {
    if ((r -= weight) <= 0) return paise;
  }
  return 50000;
}

/**
 * Donations from the start of the cycle up to `throughDay`, scaled so a full
 * month lands near `targetPaise`. Returns the same shape as the Razorpay reader.
 */
export function demoCycleTotal({ cycle, seed = 1, throughDay = null, targetPaise = 90000000 }) {
  const rand = rng(seed + cycle.startMs / 86400000);
  const days = cycle.totalDays;
  const weights = [];
  for (let d = 1; d <= days; d++) weights.push(dayWeight(d, days, rand));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // How far into the month we are, in fractional days — this is what makes the
  // number tick upward while someone is watching the page.
  const exactDay = throughDay ?? Math.min(cycle.fractionElapsed * days, days);

  let raisedPaise = 0;
  let supporters = 0;
  for (let d = 1; d <= days; d++) {
    const portion = Math.min(Math.max(exactDay - (d - 1), 0), 1);
    if (portion <= 0) break;
    const dayTarget = (targetPaise * weights[d - 1]) / totalWeight;
    let banked = 0;
    // Walk real-sized donations until the day's share is used up.
    while (banked < dayTarget * portion) {
      const amount = pickAmount(rand);
      banked += amount;
      supporters += 1;
    }
    raisedPaise += banked;
  }
  return { raisedPaise, supporters, fetched: supporters, truncated: false, ok: true, demo: true };
}
