import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { h, text, serifLine, fonts, qrDataUri, EYEBROW } from './poster.mjs';
import { formatINR, formatShort, formatCount } from './money.mjs';
import { THEME } from './defaults.mjs';

// The link-unfurl card. When someone drops the page URL into X or WhatsApp,
// the preview should already carry the ask — most people never click through.

export async function summarySvg(s, { width = 1200, height = 630 } = {}) {
  const qr = await qrDataUri(s.org.donateUrl);

  const tree = h({
    width, height, flexDirection: 'column', backgroundColor: THEME.paper,
    padding: 56, fontFamily: 'Text', color: THEME.ink,
  }, [
    h({ alignItems: 'baseline', justifyContent: 'space-between' }, [
      text({ fontFamily: 'Display', fontWeight: 800, fontSize: 30 }, s.org.name),
      text({ fontSize: 22, color: THEME.muted }, `${s.cycle.label} · day ${s.cycle.dayOfCycle} of ${s.cycle.totalDays}`),
    ]),
    h({ height: 1, backgroundColor: THEME.rule, marginTop: 18, marginBottom: 26 }),

    serifLine(s.campaign.headline, { size: 44, weight: 800, maxWidth: 960, lineHeight: 1.12, tracking: -0.4,
      emphasisFrom: s.campaign.headline.trim().split(' ').length - 1 }),
    h({ height: 26 }),

    h({ alignItems: 'flex-end' }, [
      // serifLine, not text: a box whose content falls back to another font for
      // ₹ measures short in satori, and the next element overlaps it.
      serifLine(formatINR(s.raisedPaise), { size: 78, weight: 800, lineHeight: 1.05, tracking: -0.8 }),
      text({ fontSize: 26, color: THEME.muted, marginLeft: 18, marginBottom: 16 }, `of ${formatINR(s.goalPaise)}`),
    ]),

    h({
      marginTop: 22, height: 22, borderRadius: 999, backgroundColor: THEME.track,
      border: `1px solid ${THEME.rule}`, overflow: 'hidden',
    }, [
      h({
        width: `${Math.max(s.percentClamped, 1)}%`, height: '100%', borderRadius: 999,
        backgroundImage: 'linear-gradient(90deg, #C0161C, #E0483A)',
      }),
    ]),
    h({ marginTop: 14 }, [
      text({ fontSize: 24, fontWeight: 600 }, `${Math.round(s.percent)}%`),
      text({ fontSize: 24, color: THEME.muted, marginLeft: 12 },
        `· ${formatCount(s.supporters)} supporters · ${s.cycle.daysLeft} days left`),
    ]),

    h({ marginTop: 'auto', alignItems: 'flex-end', justifyContent: 'space-between' }, [
      h({ flexDirection: 'column', maxWidth: 780 }, [
        serifLine(s.met ? 'Goal met.' : `${formatShort(s.shortfallPaise)} short`,
          { size: 50, weight: 800, color: THEME.accent, emphasisFrom: 0, lineHeight: 1.1, tracking: -0.5 }),
        text({ fontSize: 26, fontWeight: 600, marginTop: 8 },
          s.met
            ? `${formatCount(s.supporters)} readers funded ${s.cycle.monthName}.`
            : `≈ ${formatCount(s.readersNeeded)} more readers at ${formatINR(s.suggestedPaise)}`),
      ]),
      h({ flexDirection: 'column', alignItems: 'center' }, [
        h({ padding: 8, backgroundColor: '#FFFFFF', borderRadius: 8, border: `1px solid ${THEME.rule}` },
          [{ type: 'img', props: { src: qr, width: 104, height: 104 } }]),
        text({ ...EYEBROW, fontSize: 15, marginTop: 8 }, s.org.qrCaption),
      ]),
    ]),
  ]);

  return satori(tree, { width, height, fonts: await fonts() });
}

export async function summaryPng(s, opts = {}) {
  const svg = await summarySvg(s, opts);
  return new Resvg(svg, { fitTo: { mode: 'width', value: opts.width ?? 1200 } }).render().asPng();
}
