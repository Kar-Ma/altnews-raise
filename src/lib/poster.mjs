import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { formatINR, formatShort, formatCount } from './money.mjs';
import { qrSvg } from './qr.mjs';
import { THEME } from './defaults.mjs';

// The poster and the web page are never hand-synced: the page embeds this PNG.
// One renderer, one set of numbers, nothing to forget to update.

const FONT_DIR = resolve(process.cwd(), 'public/fonts');
let fontCache = null;

export async function fonts() {
  if (fontCache) return fontCache;
  const load = async (file) => new Uint8Array(await readFile(resolve(FONT_DIR, file)));
  fontCache = [
    { name: 'Text', data: await load('text-400.woff'), weight: 400, style: 'normal' },
    { name: 'Text', data: await load('text-600.woff'), weight: 600, style: 'normal' },
    { name: 'Text', data: await load('text-700.woff'), weight: 700, style: 'normal' },
    { name: 'Display', data: await load('display-600.woff'), weight: 600, style: 'normal' },
    { name: 'Display', data: await load('display-700.woff'), weight: 700, style: 'normal' },
    { name: 'Display', data: await load('display-800.woff'), weight: 800, style: 'normal' },
  ];
  return fontCache;
}

/**
 * Satori wants React-ish nodes; this keeps the tree readable without JSX.
 * Undefined style values are dropped — satori throws deep inside its CSS
 * parser on them, with a stack that points nowhere near the caller.
 */
export const h = (style, children) => ({
  type: 'div',
  props: {
    style: Object.fromEntries(
      Object.entries({ display: 'flex', flexShrink: 0, ...style })
        .filter(([, v]) => v !== undefined && v !== null),
    ),
    children: Array.isArray(children) ? children : children ?? '',
  },
});

export const text = (style, content) => h({ ...style }, content);

export const EYEBROW = {
  fontFamily: 'Text', fontSize: 20, fontWeight: 600, letterSpacing: 2.6,
  textTransform: 'uppercase', color: THEME.muted,
};

/**
 * Serif lines are laid out word by word. Two reasons: a single word can be
 * coloured without inline-span guesswork, and the display face's space glyph renders
 * zero-width under satori, which silently welds words together.
 */
export function serifLine(str, { size, weight = 700, color = THEME.ink, accent = THEME.accent, emphasisFrom = Infinity, maxWidth, lineHeight = 1.06, tracking = 0 }) {
  return h({ flexWrap: 'wrap', maxWidth }, str.split(' ').map((word, i) => {
    const glyphs = {
      fontFamily: 'Display', fontWeight: weight, fontSize: size, lineHeight,
      letterSpacing: tracking, color: i >= emphasisFrom ? accent : color,
    };
    // ₹ sits in a different face when the display cut lacks it, and satori drops the margin of any box whose text
    // needed a fallback font. Giving the symbol its own box keeps the space.
    if (word.includes('₹')) {
      const parts = word.split('₹').flatMap((p, j) => (j === 0 ? [p] : ['₹', p])).filter(Boolean);
      return h({ marginRight: size * 0.24 }, parts.map((p) => text(glyphs, p)));
    }
    return text({ ...glyphs, marginRight: size * 0.24 }, word);
  }));
}

export async function qrDataUri(url) {
  const svg = await qrSvg(url, { margin: 0 });
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

export async function posterTree(s, { width = 1080, height = 1350 } = {}) {
  const qr = await qrDataUri(s.org.donateUrl);
  const words = s.campaign.headline.trim().split(' ');
  const subLines = s.campaign.subhead.split('.').map((l) => l.trim()).filter(Boolean);
  const shortUrl = s.org.donateUrl.replace(/^https?:\/\//, '');

  const tree = h({
    width, height, flexDirection: 'column', backgroundColor: THEME.paper,
    padding: 64, fontFamily: 'Text', color: THEME.ink,
  }, [
    // Masthead
    h({ alignItems: 'baseline', justifyContent: 'space-between' }, [
      text({ fontFamily: 'Display', fontWeight: 800, fontSize: 38 }, s.org.name),
      text({ fontFamily: 'Text', fontSize: 24, color: THEME.muted }, s.org.tagline),
    ]),
    h({ height: 1, backgroundColor: THEME.rule, marginTop: 22, marginBottom: 40 }),

    serifLine(s.campaign.headline, { size: 70, weight: 800, maxWidth: 900, emphasisFrom: words.length - 1, lineHeight: 1.1, tracking: -0.6 }),

    h({ flexDirection: 'column', marginTop: 30 }, subLines.map((line, i) => text({
      fontFamily: 'Text', fontSize: 26, lineHeight: 1.42,
      fontWeight: i === subLines.length - 1 ? 600 : 400,
      color: i === subLines.length - 1 ? THEME.accent : THEME.muted,
    }, line + '.'))),

    // Progress card
    h({
      flexDirection: 'column', marginTop: 38, padding: 34, borderRadius: 18,
      backgroundColor: THEME.card, border: `1px solid ${THEME.rule}`,
    }, [
      h({ justifyContent: 'space-between', alignItems: 'baseline' }, [
        text(EYEBROW, `Raised in ${s.cycle.label}`),
        text(EYEBROW, 'Goal'),
      ]),
      h({ justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }, [
        serifLine(formatINR(s.raisedPaise), { size: 72, weight: 800, lineHeight: 1.05, tracking: -0.8 }),
        serifLine(formatINR(s.goalPaise), { size: 36, weight: 600, color: THEME.muted, lineHeight: 1.05 }),
      ]),
      h({
        marginTop: 24, height: 24, borderRadius: 999, backgroundColor: THEME.track,
        border: `1px solid ${THEME.rule}`, overflow: 'hidden',
      }, [
        h({
          width: `${Math.max(s.percentClamped, 1)}%`, height: '100%', borderRadius: 999,
          backgroundImage: 'linear-gradient(90deg, #C0161C, #E0483A)',
        }),
      ]),
      h({ marginTop: 16, alignItems: 'baseline' }, [
        text({ fontSize: 26, fontWeight: 600 }, `${Math.round(s.percent)}%`),
        text({ fontSize: 26, color: THEME.muted, marginLeft: 12 },
          `· ${formatCount(s.supporters)} supporters · day ${s.cycle.dayOfCycle} of ${s.cycle.totalDays}`),
      ]),
    ]),

    // The ask
    h({ flexDirection: 'column', marginTop: 38 }, [
      serifLine(s.met ? 'Goal met.' : `${formatShort(s.shortfallPaise)} short`,
        { size: 58, weight: 800, color: THEME.accent, emphasisFrom: 0, lineHeight: 1.1, tracking: -0.5 }),
      text({ fontFamily: 'Text', fontSize: 30, fontWeight: 600, marginTop: 8 },
        s.met
          ? `${formatCount(s.supporters)} readers funded ${s.cycle.monthName}.`
          : `≈ ${formatCount(s.readersNeeded)} more readers at ${formatINR(s.suggestedPaise)}`),
    ]),

    // Donate + QR, pinned to the bottom
    h({ marginTop: 'auto', height: 1, backgroundColor: THEME.rule, marginBottom: 30 }),
    h({ alignItems: 'flex-end', justifyContent: 'space-between' }, [
      h({ flexDirection: 'column', maxWidth: 640 }, [
        text(EYEBROW, 'Donate now'),
        h({
          marginTop: 12, paddingLeft: 26, paddingRight: 26, paddingTop: 14, paddingBottom: 14,
          borderRadius: 10, backgroundColor: THEME.accent,
        }, [text({ fontSize: 28, fontWeight: 600, color: '#FFFFFF' }, shortUrl)]),
        text({ fontSize: 21, color: THEME.muted, marginTop: 16, lineHeight: 1.4 }, s.campaign.note),
      ]),
      h({ flexDirection: 'column', alignItems: 'center' }, [
        h({
          padding: 12, backgroundColor: '#FFFFFF', borderRadius: 12,
          border: `1px solid ${THEME.rule}`,
        }, [{ type: 'img', props: { src: qr, width: 176, height: 176 } }]),
        text({ ...EYEBROW, fontSize: 17, marginTop: 10 }, s.org.qrCaption),
      ]),
    ]),
  ]);

  return tree;
}

export async function posterSvg(s, opts = {}) {
  const { width = 1080, height = 1350 } = opts;
  return satori(await posterTree(s, opts), { width, height, fonts: await fonts() });
}

export async function posterPng(s, opts) {
  const svg = await posterSvg(s, opts);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: opts?.width ?? 1080 } })
    .render()
    .asPng();
  return png;
}
