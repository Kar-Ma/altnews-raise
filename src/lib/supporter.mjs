import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { h, text, serifLine, fonts, qrDataUri, EYEBROW } from './poster.mjs';
import { formatINR, formatCount } from './money.mjs';
import { THEME } from './defaults.mjs';

// People already screenshot the Razorpay receipt and post it. A receipt is a
// bad share: it shows a transaction rather than a stance, and it leaks the
// amount. This gives them something worth posting instead — and it carries the
// month's shortfall along with it, so the share does fundraising work too.

/** Whatever a stranger types gets rendered on the org's own domain. Keep it dull. */
export function cleanName(raw) {
  return String(raw ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
}

export async function supporterSvg(s, { name, width = 1080, height = 1080 } = {}) {
  const qr = await qrDataUri(s.donateUrl);
  const who = cleanName(name);
  const shortUrl = s.donateUrl.replace(/^https?:\/\//, '');

  const tree = h({
    width, height, flexDirection: 'column', backgroundColor: THEME.ink,
    padding: 64, fontFamily: 'Text', color: THEME.paper,
  }, [
    h({ alignItems: 'baseline', justifyContent: 'space-between' }, [
      text({ fontFamily: 'Display', fontWeight: 800, fontSize: 32, color: THEME.paper }, s.org.name),
      text({ fontSize: 22, color: '#9A9285' }, s.cycle.label),
    ]),

    h({ flexDirection: 'column', marginTop: 'auto' }, [
      serifLine('I fund independent journalism.', {
        size: 76, weight: 800, color: THEME.paper, accent: THEME.accentOnDark, emphasisFrom: 2,
        lineHeight: 1.14, maxWidth: 900, tracking: -0.6,
      }),
      text({ fontSize: 30, fontWeight: 600, color: '#C9C0B1', marginTop: 26 },
        who ? `— ${who}` : `— a reader in ${s.cycle.monthName}`),
      // Social proof, not a receipt: the number that matters is how many, and
      // only once there is one — "one of 0 readers" helps nobody. The amount is
      // deliberately absent: Razorpay's redirect never sends it, so anything
      // shown here would be a number the donor typed about themselves.
      s.supporters > 0
        ? text({ fontSize: 24, fontWeight: 600, color: THEME.marigold, marginTop: 14 },
          `one of ${formatCount(s.supporters)} readers funding ${s.cycle.monthName}`)
        : null,
    ].filter(Boolean)),

    h({ flexDirection: 'column', marginTop: 44, paddingTop: 34, borderTop: '1px solid #332F29' }, [
      h({ justifyContent: 'space-between', alignItems: 'baseline' }, [
        text({ fontSize: 24, color: '#C9C0B1' },
          `${formatINR(s.raisedPaise)} of ${formatINR(s.goalPaise)} raised this month`),
        text({ fontSize: 24, fontWeight: 600, color: THEME.paper }, `${Math.round(s.percent)}%`),
      ]),
      h({ marginTop: 16, height: 14, borderRadius: 999, backgroundColor: '#2A2723', overflow: 'hidden' }, [
        h({ width: `${Math.max(s.percentClamped, 1)}%`, height: '100%', borderRadius: 999, backgroundColor: '#E0483A' }),
      ]),
    ]),

    h({ marginTop: 40, alignItems: 'flex-end', justifyContent: 'space-between' }, [
      h({ flexDirection: 'column' }, [
        text({ ...EYEBROW, color: '#9A9285' }, s.met ? 'Funded by readers' : 'Join in'),
        text({ fontSize: 28, fontWeight: 600, color: THEME.paper, marginTop: 10 }, shortUrl),
      ]),
      h({ padding: 10, backgroundColor: '#FFFFFF', borderRadius: 10 },
        [{ type: 'img', props: { src: qr, width: 128, height: 128 } }]),
    ]),
  ]);

  return satori(tree, { width, height, fonts: await fonts() });
}

export async function supporterPng(s, opts = {}) {
  const svg = await supporterSvg(s, opts);
  return new Resvg(svg, { fitTo: { mode: 'width', value: opts.width ?? 1080 } }).render().asPng();
}
