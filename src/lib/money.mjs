// Money is handled in paise everywhere, exactly as Razorpay reports it.
// Never store rupees as floats.

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const toPaise = (rupees) => Math.round(Number(rupees) * 100);
export const toRupees = (paise) => Math.round(Number(paise)) / 100;

/** ₹5,00,000 — Indian digit grouping, no decimals. */
export function formatINR(paise) {
  return '₹' + inr.format(Math.round(toRupees(paise)));
}

/** ₹5 lakh, ₹6.2 lakh, ₹1.1 crore — the register Indian fundraising copy uses. */
export function formatShort(paise) {
  const r = toRupees(paise);
  const unit = (value, suffix) => {
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
    return '₹' + rounded + ' ' + suffix;
  };
  if (r >= 1e7) return unit(r / 1e7, 'crore');
  if (r >= 1e5) return unit(r / 1e5, 'lakh');
  if (r >= 1e3) return unit(r / 1e3, 'thousand');
  return formatINR(paise);
}

/** 1,200 — plain counts, Indian grouping. */
export const formatCount = (n) => inr.format(Math.round(n));
