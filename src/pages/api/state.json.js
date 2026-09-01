import { getSnapshot } from '../../lib/source.mjs';
import { formatINR, formatShort, formatCount } from '../../lib/money.mjs';

export const prerender = false;

// The public read model. Anyone can poll it, embed it, or graph it — an
// open number is the whole point.
export async function GET() {
  const s = await getSnapshot();
  return new Response(JSON.stringify({
    cycle: s.cycle.label,
    cycleId: s.cycle.id,
    mode: s.mode,
    goal: { paise: s.goalPaise, display: formatINR(s.goalPaise) },
    raised: { paise: s.raisedPaise, display: formatINR(s.raisedPaise), short: formatShort(s.raisedPaise) },
    online: s.raisedOnlinePaise,
    offline: s.offlinePaise,
    shortfall: { paise: s.shortfallPaise, display: formatINR(s.shortfallPaise), short: formatShort(s.shortfallPaise) },
    percent: Math.round(s.percent * 10) / 10,
    supporters: s.supporters,
    supportersDisplay: formatCount(s.supporters),
    readersNeeded: s.readersNeeded,
    suggested: s.suggestedPaise,
    daysLeft: s.cycle.daysLeft,
    dayOfCycle: s.cycle.dayOfCycle,
    totalDays: s.cycle.totalDays,
    perDayNeeded: s.perDayNeededPaise,
    projected: s.projectedPaise,
    onTrack: s.onTrack,
    callToAction: s.callToAction,
    error: s.error,
    generatedAt: new Date(s.generatedAt).toISOString(),
  }, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30',
      'access-control-allow-origin': '*',
    },
  });
}
