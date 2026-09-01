import { formatShort, formatINR, formatCount } from './money.mjs';

/**
 * Turns a raw total into every number the page, the poster and the admin
 * screen quote. One place, so the poster can never disagree with the page.
 */
export function derive({ cycle, raisedOnlinePaise, supporters, offline, campaign }) {
  const offlinePaise = (offline ?? []).reduce((sum, e) => sum + (e.amountPaise || 0), 0);
  const raisedPaise = raisedOnlinePaise + offlinePaise;
  const goalPaise = campaign.goalPaise;
  const suggestedPaise = campaign.suggestedPaise || 50000;

  const shortfallPaise = Math.max(goalPaise - raisedPaise, 0);
  const percent = goalPaise > 0 ? (raisedPaise / goalPaise) * 100 : 0;
  const readersNeeded = Math.ceil(shortfallPaise / suggestedPaise);

  // Pace: where the month lands if the rest of it looks like the part we've seen.
  const projectedPaise = cycle.fractionElapsed > 0.15
    ? Math.round(raisedPaise / cycle.fractionElapsed)
    : null;
  const expectedByNowPaise = Math.round(goalPaise * cycle.fractionElapsed);

  return {
    cycle,
    goalPaise,
    raisedPaise,
    raisedOnlinePaise,
    offlinePaise,
    shortfallPaise,
    percent,
    percentClamped: Math.min(percent, 100),
    supporters,
    averagePaise: supporters > 0 ? Math.round(raisedOnlinePaise / supporters) : 0,
    suggestedPaise,
    readersNeeded,
    perDayNeededPaise: cycle.daysLeft > 0 ? Math.round(shortfallPaise / cycle.daysLeft) : shortfallPaise,
    projectedPaise,
    expectedByNowPaise,
    onTrack: projectedPaise !== null && projectedPaise >= goalPaise,
    met: raisedPaise >= goalPaise,
    // The line that does the actual persuading.
    callToAction: shortfallPaise <= 0
      ? `Funded. ${formatCount(supporters)} readers got us there.`
      : `${formatShort(shortfallPaise)} short — another ${formatCount(readersNeeded)} readers at ${formatINR(suggestedPaise)} closes it.`,
  };
}
