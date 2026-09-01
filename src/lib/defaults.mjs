// Everything an organisation needs to change lives here or in the admin panel.
// Fork the repo, edit this file once, and the rest of the app follows.

export const DEFAULT_STATE = {
  org: {
    name: 'Alt News',
    legalName: 'Pravda Media Foundation',
    tagline: 'Fact checking that matters.',
    // The existing Razorpay page keeps taking the money. This app never touches it.
    donateUrl: 'https://pages.razorpay.com/altnews',
    qrCaption: 'Scan to donate',
    contact: 'donation@altnews.in',
  },
  campaign: {
    goalPaise: 110000000,      // ₹11,00,000
    suggestedPaise: 50000,     // ₹500 — the "another N readers at ₹500" unit
    headline: 'Independent journalism needs you.',
    subhead: 'No ads. No corporate money. No government money. Reader-funded.',
    note: 'We take no ads, grants or government money, so this depends entirely on you.',
  },
  // Money that arrived outside Razorpay: cheques, NEFT, foreign transfers.
  // Without this the public number silently undercounts and contradicts the org.
  offline: [],
  source: {
    mode: 'demo',              // 'demo' | 'live'
    lastSyncedAt: null,
    // Result of the last "test connection" press, so the panel can say
    // something more useful than "not configured".
    lastTest: null,
  },
  demo: {
    // Lets you scrub to any day of the month when showing the thing to people.
    dayOverride: null,
    // How the month is going, as a fraction of goal a full month would reach.
    strength: 0.82,
    seed: 20260901,
  },
  history: {},
};

export const THEME = {
  paper: '#F6F2EA',
  card: '#FFFCF7',
  track: '#EFE7D8',
  ink: '#14120F',
  muted: '#6B6459',
  rule: '#DDD5C7',
  accent: '#C0161C',
  // The print red goes muddy on near-black; the card uses this instead.
  accentOnDark: '#F0574B',
  marigold: '#E39A18',
  good: '#3F6B4A',
};
