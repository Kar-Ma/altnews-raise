import { randomUUID } from 'node:crypto';
import { readState, writeState, resetState } from '../../lib/store.mjs';
import { invalidate, credentials } from '../../lib/source.mjs';
import { toPaise } from '../../lib/money.mjs';
import { pingRazorpay } from '../../lib/razorpay.mjs';
import { PRESETS } from '../../lib/presets.mjs';
import { isAuthed, signIn, signOut } from '../../lib/auth.mjs';

export const prerender = false;

const back = (note) =>
  new Response(null, {
    status: 303,
    headers: { location: '/admin' + (note ? `?note=${encodeURIComponent(note)}` : '') },
  });

const num = (form, field) => {
  const value = Number(form.get(field));
  return Number.isFinite(value) ? value : null;
};

const str = (form, field, fallback, max) =>
  String(form.get(field) ?? fallback ?? '').slice(0, max);

export async function POST({ request, cookies }) {
  const form = await request.formData();
  const action = form.get('action');

  if (action === 'login') {
    return signIn(cookies, form.get('password')) ? back() : back('Wrong password.');
  }
  if (action === 'logout') {
    signOut(cookies);
    return back();
  }

  if (!isAuthed(cookies)) return new Response('Not signed in', { status: 401 });

  const state = await readState();

  switch (action) {
    case 'campaign': {
      const goal = num(form, 'goal');
      const suggested = num(form, 'suggested');
      if (!goal || goal <= 0) return back('Goal must be more than zero.');
      if (!suggested || suggested <= 0) return back('Suggested amount must be more than zero.');
      await writeState({
        org: {
          name: str(form, 'orgName', state.org.name, 60),
          tagline: str(form, 'tagline', state.org.tagline, 120),
          donateUrl: str(form, 'donateUrl', state.org.donateUrl, 300),
        },
        campaign: {
          goalPaise: toPaise(goal),
          suggestedPaise: toPaise(suggested),
          headline: str(form, 'headline', state.campaign.headline, 120),
          subhead: str(form, 'subhead', state.campaign.subhead, 300),
          note: str(form, 'note', state.campaign.note, 300),
        },
      });
      break;
    }

    case 'offline-add': {
      const amount = num(form, 'amount');
      if (!amount || amount <= 0) return back('Enter an amount above zero.');
      await writeState({
        offline: [...state.offline, {
          id: randomUUID(),
          label: str(form, 'label', 'Offline contribution', 80) || 'Offline contribution',
          amountPaise: toPaise(amount),
          dateISO: str(form, 'date', '', 10),
        }],
      });
      break;
    }

    case 'offline-remove':
      await writeState({ offline: state.offline.filter((e) => e.id !== form.get('id')) });
      break;

    case 'source':
      await writeState({ source: { mode: form.get('mode') === 'live' ? 'live' : 'demo' } });
      break;

    case 'demo': {
      const day = num(form, 'day');
      const strength = num(form, 'strength');
      await writeState({
        demo: {
          dayOverride: day && day > 0 ? day : null,
          strength: strength && strength > 0 ? Math.min(strength, 1.4) : state.demo.strength,
        },
      });
      break;
    }

    case 'test-razorpay': {
      const creds = credentials();
      const result = creds
        ? await pingRazorpay(creds)
        : { ok: false, message: 'No RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in this environment yet.' };
      await writeState({
        source: { lastTest: { ...result, atISO: new Date().toISOString() } },
      });
      break;
    }

    case 'preset': {
      const preset = PRESETS[form.get('preset')];
      if (!preset) return back('Unknown starting point.');
      // Offline entries belong to whoever typed them; a preset should not
      // silently delete money someone recorded by hand.
      await writeState({ ...preset.state, offline: state.offline });
      break;
    }

    case 'reset':
      await resetState();
      break;

    default:
      return back('Unknown action.');
  }

  invalidate();
  return back(NOTES[action]);
}

const NOTES = {
  campaign: 'Campaign saved. The page and the poster already show it.',
  'offline-add': 'Contribution added to the public total.',
  'offline-remove': 'Contribution removed.',
  source: 'Data source switched.',
  demo: 'Demo updated.',
  'test-razorpay': 'Connection tested.',
  preset: 'Starting point loaded.',
  reset: 'Everything reset to defaults.',
};
