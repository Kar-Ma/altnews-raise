// Everything on the page comes from here or from the settings screen.
// Figures are entered by hand: Alt News collects on Razorpay, on Danamojo and
// by cheque, so no single API knows the real total. A number someone typed
// after looking at all three is more honest than one read off a third of them.

export const DEFAULT_STATE = {
  // While true the page carries a banner saying the figures are illustrative
  // and asks search engines to stay away. Turn it off in Settings on the day
  // real numbers go in.
  preview: true,

  org: {
    name: 'Alt News',
    legalName: 'Pravda Media Foundation',
    tagline: 'Fact checking that matters.',
    cin: 'U93030GJ2017NPL099435',
    contact: 'donation@altnews.in',
    siteUrl: 'https://www.altnews.in',
  },

  campaign: {
    goalPaise: 110000000,     // ₹11,00,000
    raisedPaise: 50000000,    // ₹5,00,000 — typed in, not read from anywhere
    supporters: 0,            // optional; the tile hides itself when zero
    suggestedPaise: 50000,    // ₹500, the unit "another N readers" counts in
    headline: 'Independent journalism needs you.',
    subhead: 'No ads. No corporate money. No government money. Reader-funded.',
    note: 'We take no ads, grants or government money, so this depends entirely on you.',
    updatedAt: null,
  },

  // The reason this page exists rather than a bare payment link: every route to
  // giving on one screen, with the monthly option treated as seriously as the
  // one-off one.
  ways: [
    {
      id: 'once',
      title: 'Give once',
      blurb: 'Card, UPI, net banking or wallet. Add your PAN on the form to get an 80G receipt.',
      cta: 'Donate now',
      url: 'https://pages.razorpay.com/altnews',
      // Razorpay Payment Pages fill the amount box from ?amount=<rupees>, so
      // the buttons below can land people on a form that is already filled in.
      // Verified against the live page: the documented /pl_xxx/view/ form 404s,
      // the vanity URL works.
      prefillAmount: true,
      primary: true,
    },
    {
      id: 'monthly',
      title: 'Give every month',
      blurb: '₹250, ₹500 or ₹1,000 a month. Recurring support is what makes a newsroom plannable.',
      cta: 'Set up monthly',
      url: 'https://pravda-media-foundation.danamojo.org/',
      prefillAmount: false,
      primary: false,
    },
    {
      id: 'cheque',
      title: 'Cheque or DD',
      blurb: "Made out to 'Pravda Media Foundation', posted to 1008-1009 Satyamev Elite, Near Vakil Bridge, Opposite BRTS Bus Stop, Ambli, Ahmedabad 380058.",
      cta: null,
      url: null,
      prefillAmount: false,
      primary: false,
    },
  ],

  // Both verified from altnews.in/donate.
  legal: {
    eightyG: 'Donations are exempt under 80G of the Income Tax Act. Share accurate details on the form to receive your receipt.',
    fcra: 'Alt News is not registered under FCRA and cannot accept foreign remittance. Please give from an Indian bank account.',
  },
};

export const THEME = {
  paper: '#F4EFE5',
  card: '#FBF7EF',
  track: '#EFE7D8',
  ink: '#16130E',
  muted: '#6A6153',
  rule: '#DFD6C4',
  accent: '#C0161C',
  accentOnDark: '#F0574B',
  marigold: '#E39A18',
  good: '#3F6B4A',
};
