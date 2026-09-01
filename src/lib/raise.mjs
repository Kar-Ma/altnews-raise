import { currentCycle } from './cycle.mjs';
import { readState } from './store.mjs';
import { formatShort, formatINR, formatCount } from './money.mjs';

// One derivation, used by the page, the poster, the link card and the settings
// screen. If they ever disagree it will be because someone stopped reading from
// here, not because two of them rounded differently.

export function derive(state, nowMs = Date.now()) {
  const cycle = currentCycle(nowMs);
  const { goalPaise, raisedPaise, suggestedPaise, supporters } = state.campaign;

  const primary = (state.ways ?? []).find((w) => w.primary) ?? state.ways?.[0] ?? null;
  const shortfallPaise = Math.max(goalPaise - raisedPaise, 0);
  const percent = goalPaise > 0 ? (raisedPaise / goalPaise) * 100 : 0;
  const readersNeeded = Math.ceil(shortfallPaise / (suggestedPaise || 50000));
  const met = raisedPaise >= goalPaise && goalPaise > 0;

  return {
    cycle,
    goalPaise,
    raisedPaise,
    shortfallPaise,
    suggestedPaise,
    supporters,
    percent,
    percentClamped: Math.min(percent, 100),
    readersNeeded,
    met,
    perDayNeededPaise: cycle.daysLeft > 0
      ? Math.round(shortfallPaise / cycle.daysLeft)
      : shortfallPaise,

    // The line that does the persuading, in one place so the poster and the
    // page cannot phrase it differently.
    callToAction: met
      ? (supporters > 0
        ? `Funded. ${formatCount(supporters)} readers got us there.`
        : 'Funded, with thanks to everyone who gave.')
      : `${formatShort(shortfallPaise)} short — another ${formatCount(readersNeeded)} readers at ${formatINR(suggestedPaise)} closes it.`,

    // Where the button and every QR code point.
    donateUrl: primary?.url ?? state.org.siteUrl,
    qrCaption: 'Scan to donate',
    primaryWay: primary,

    updatedAt: state.campaign.updatedAt,
    org: state.org,
    campaign: state.campaign,
    ways: state.ways,
    legal: state.legal,
    preview: state.preview,
  };
}

export async function getRaise(nowMs = Date.now()) {
  return derive(await readState(), nowMs);
}

/** "Updated 2 hours ago" — the page's own answer to "can I trust this figure?" */
export function updatedLabel(updatedAt, nowMs = Date.now()) {
  if (!updatedAt) return 'not updated yet';
  const ms = nowMs - new Date(updatedAt).getTime();
  if (Number.isNaN(ms)) return 'not updated yet';

  const minutes = Math.round(ms / 60000);
  if (minutes < 2) return 'updated just now';
  if (minutes < 60) return `updated ${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `updated ${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'updated yesterday';
  if (days < 30) return `updated ${days} days ago`;
  return 'updated over a month ago';
}

/** Past a week the figure is stale enough that the page should admit it. */
export function isStale(updatedAt, nowMs = Date.now()) {
  if (!updatedAt) return true;
  const ms = nowMs - new Date(updatedAt).getTime();
  return Number.isNaN(ms) ? true : ms > 7 * 86400000;
}

/**
 * Razorpay takes ?amount=<rupees> and pre-fills its form. Only the ways that
 * declare it get the parameter — appending it to Danamojo would do nothing, and
 * to a cheque would do less.
 */
export function giveUrl(way, amountPaise) {
  if (!way?.url) return null;
  if (!amountPaise || !way.prefillAmount) return way.url;
  const rupees = Math.round(amountPaise / 100);
  return `${way.url}${way.url.includes('?') ? '&' : '?'}amount=${rupees}`;
}
