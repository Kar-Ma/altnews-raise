// Two starting points. `altnews` is the worked example — a real organisation's
// real appeal, with invented numbers — because an empty form is a bad way to
// judge whether something is worth adopting. `blank` is what you switch to
// when you have decided it is.

export const PRESETS = {
  altnews: {
    label: 'Alt News example',
    hint: 'A worked example, filled in. Good for seeing what the page looks like with real copy.',
    state: {
      org: {
        name: 'Alt News',
        legalName: 'Pravda Media Foundation',
        tagline: 'Fact checking that matters.',
        donateUrl: 'https://pages.razorpay.com/altnews',
        qrCaption: 'Scan to donate',
        contact: 'donation@altnews.in',
      },
      campaign: {
        goalPaise: 110000000,
        suggestedPaise: 50000,
        headline: 'Independent journalism needs you.',
        subhead: 'No ads. No corporate money. No government money. Reader-funded.',
        note: 'We take no ads, grants or government money, so this depends entirely on you.',
      },
      offline: [],
    },
  },

  blank: {
    label: 'Start from scratch',
    hint: 'Placeholder copy for your own organisation. Everything here is editable below.',
    state: {
      org: {
        name: 'Your organisation',
        legalName: '',
        tagline: 'What you do, in five words.',
        donateUrl: 'https://pages.razorpay.com/your-page',
        qrCaption: 'Scan to donate',
        contact: '',
      },
      campaign: {
        goalPaise: 10000000,
        suggestedPaise: 50000,
        headline: 'This month, we need you.',
        subhead: 'Say who funds you. Say who does not. Make the last line the one that lands.',
        note: 'A line about why this depends on readers rather than advertisers or grants.',
      },
      offline: [],
    },
  },
};

/** Which preset the current state most resembles, for highlighting in the UI. */
export function activePreset(state) {
  return Object.entries(PRESETS)
    .find(([, preset]) => preset.state.org.name === state.org.name)?.[0] ?? null;
}
