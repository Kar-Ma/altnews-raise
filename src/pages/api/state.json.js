import { getRaise, updatedLabel } from '../../lib/raise.mjs';
import { formatINR, formatShort, formatCount } from '../../lib/money.mjs';

export const prerender = false;

// The same figures the page shows, as data. Open, because a page about
// transparency should be checkable by anyone who wants to graph it.
export async function GET() {
  const s = await getRaise();
  return new Response(JSON.stringify({
    org: s.org.name,
    cycle: s.cycle.label,
    cycleId: s.cycle.id,
    preview: s.preview,
    goal: { paise: s.goalPaise, display: formatINR(s.goalPaise) },
    raised: { paise: s.raisedPaise, display: formatINR(s.raisedPaise), short: formatShort(s.raisedPaise) },
    shortfall: { paise: s.shortfallPaise, display: formatINR(s.shortfallPaise), short: formatShort(s.shortfallPaise) },
    percent: Math.round(s.percent * 10) / 10,
    supporters: s.supporters || null,
    supportersDisplay: s.supporters ? formatCount(s.supporters) : null,
    readersNeeded: s.readersNeeded,
    suggested: s.suggestedPaise,
    daysLeft: s.cycle.daysLeft,
    dayOfCycle: s.cycle.dayOfCycle,
    totalDays: s.cycle.totalDays,
    met: s.met,
    callToAction: s.callToAction,
    // Entered by hand, so say when. A figure with no timestamp is a claim.
    updatedAt: s.updatedAt,
    updatedLabel: updatedLabel(s.updatedAt),
    source: 'entered by hand from Razorpay, Danamojo and directly banked gifts',
  }, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
      'access-control-allow-origin': '*',
    },
  });
}
