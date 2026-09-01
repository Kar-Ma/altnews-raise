import { randomUUID } from 'node:crypto';
import { readState, writeState } from '../../lib/store.mjs';
import { invalidate } from '../../lib/source.mjs';
import { toPaise } from '../../lib/money.mjs';
import { isAuthed, signIn, signOut } from '../../lib/auth.mjs';

export const prerender = false;

const back = (url, note) =>
  new Response(null, {
    status: 303,
    headers: { location: '/admin' + (note ? `?note=${encodeURIComponent(note)}` : '') },
  });

const num = (form, field) => {
  const value = Number(form.get(field));
  return Number.isFinite(value) ? value : null;
};

export async function POST({ request, cookies, url }) {
  const form = await request.formData();
  const action = form.get('action');

  if (action === 'login') {
    return signIn(cookies, form.get('password'))
      ? back(url)
      : back(url, 'Wrong password.');
  }
  if (action === 'logout') {
    signOut(cookies);
    return back(url);
  }

  if (!isAuthed(cookies)) return new Response('Not signed in', { status: 401 });

  const state = await readState();

  if (action === 'campaign') {
    const goal = num(form, 'goal');
    const suggested = num(form, 'suggested');
    if (!goal || goal <= 0) return back(url, 'Goal must be a positive amount.');
    if (!suggested || suggested <= 0) return back(url, 'Suggested amount must be positive.');
    await writeState({
      org: {
        name: String(form.get('orgName') || state.org.name).slice(0, 60),
        tagline: String(form.get('tagline') || state.org.tagline).slice(0, 120),
        donateUrl: String(form.get('donateUrl') || state.org.donateUrl).slice(0, 300),
      },
      campaign: {
        goalPaise: toPaise(goal),
        suggestedPaise: toPaise(suggested),
        headline: String(form.get('headline') || state.campaign.headline).slice(0, 120),
        subhead: String(form.get('subhead') || state.campaign.subhead).slice(0, 300),
        note: String(form.get('note') || state.campaign.note).slice(0, 300),
      },
    });
    invalidate();
    return back(url, 'Campaign saved.');
  }

  if (action === 'offline-add') {
    const amount = num(form, 'amount');
    if (!amount || amount <= 0) return back(url, 'Enter an amount above zero.');
    await writeState({
      offline: [...state.offline, {
        id: randomUUID(),
        label: String(form.get('label') || 'Offline contribution').slice(0, 80),
        amountPaise: toPaise(amount),
        dateISO: String(form.get('date') || '').slice(0, 10),
      }],
    });
    invalidate();
    return back(url, 'Contribution added.');
  }

  if (action === 'offline-remove') {
    const id = form.get('id');
    await writeState({ offline: state.offline.filter((entry) => entry.id !== id) });
    invalidate();
    return back(url, 'Contribution removed.');
  }

  if (action === 'source') {
    await writeState({ source: { mode: form.get('mode') === 'live' ? 'live' : 'demo' } });
    invalidate();
    return back(url, 'Data source switched.');
  }

  if (action === 'demo-day') {
    const day = num(form, 'day');
    await writeState({ demo: { dayOverride: day && day > 0 ? day : null } });
    invalidate();
    return back(url, 'Demo day set.');
  }

  return back(url, 'Unknown action.');
}
