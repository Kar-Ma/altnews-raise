// Every number on the page is scoped to one calendar month in Asia/Kolkata.
// IST is a fixed UTC+5:30 with no DST, so the arithmetic stays honest without
// pulling in a timezone library.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Calendar parts of an instant, as seen in India. */
export function istParts(nowMs = Date.now()) {
  const d = new Date(nowMs + IST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(), // 0-indexed
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** Epoch ms of 00:00 IST on the 1st of the given month. */
export function istMonthStartMs(year, month) {
  return Date.UTC(year, month, 1, 0, 0, 0) - IST_OFFSET_MS;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * The current cycle: from the 1st of this month (IST) to the instant before
 * the 1st of the next. `offset` steps backwards for history (-1 = last month).
 */
export function currentCycle(nowMs = Date.now(), offset = 0) {
  const { year, month } = istParts(nowMs);
  const startMs = istMonthStartMs(year, month + offset);
  const endMs = istMonthStartMs(year, month + offset + 1);
  const start = new Date(startMs + IST_OFFSET_MS);
  const totalDays = Math.round((endMs - startMs) / 86400000);
  const elapsedMs = Math.min(Math.max(nowMs - startMs, 0), endMs - startMs);

  return {
    id: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
    label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
    monthName: MONTHS[start.getUTCMonth()],
    startMs,
    endMs,
    // Razorpay's from/to filters take UNIX seconds.
    from: Math.floor(startMs / 1000),
    to: Math.floor(endMs / 1000) - 1,
    totalDays,
    // Day 1 is the 1st itself, so a cycle is never "0 days in".
    dayOfCycle: Math.min(Math.floor(elapsedMs / 86400000) + 1, totalDays),
    daysLeft: Math.max(Math.ceil((endMs - nowMs) / 86400000), 0),
    fractionElapsed: elapsedMs / (endMs - startMs),
    isCurrent: offset === 0,
  };
}
