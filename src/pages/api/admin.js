import { readState, writeState } from '../../lib/store.mjs';
import { toPaise } from '../../lib/money.mjs';
import { isAuthed, signIn, signOut } from '../../lib/auth.mjs';

export const prerender = false;

const back = (note) =>
  new Response(null, {
    status: 303,
    headers: { location: '/settings' + (note ? `?note=${encodeURIComponent(note)}` : '') },
  });

// People paste "5,00,000" out of a spreadsheet. Take it.
const num = (form, field) => {
  const raw = String(form.get(field) ?? '').replace(/[,\s₹]/g, '');
  const value = Number(raw);
  return raw !== '' && Number.isFinite(value) ? value : null;
};

const str = (form, field, fallback, max) =>
  String(form.get(field) ?? fallback ?? '').slice(0, max);

export async function POST({ request, cookies }) {
  const form = await request.formData();
  const action = form.get('action');

  if (action === 'login') {
    return signIn(cookies, form.get('password')) ? back() : back('That password did not match.');
  }
  if (action === 'logout') {
    signOut(cookies);
    return back();
  }
  if (!isAuthed(cookies)) return new Response('Not signed in', { status: 401 });

  const state = await readState();

  switch (action) {
    // The one they will use most: type today's total, press save.
    case 'figures': {
      const raised = num(form, 'raised');
      const goal = num(form, 'goal');
      const supporters = num(form, 'supporters');
      if (raised === null || raised < 0) return back('Enter the amount raised as a number.');
      if (!goal || goal <= 0) return back('The goal has to be more than zero.');
      await writeState({
        campaign: {
          raisedPaise: toPaise(raised),
          goalPaise: toPaise(goal),
          supporters: supporters && supporters > 0 ? Math.round(supporters) : 0,
          // Every save re-stamps the page: the timestamp is the only thing
          // telling a reader whether to believe the number.
          updatedAt: new Date().toISOString(),
        },
      });
      return back('Saved. The page and the poster already show it.');
    }

    case 'wording': {
      const suggested = num(form, 'suggested');
      if (!suggested || suggested <= 0) return back('The suggested amount has to be more than zero.');
      await writeState({
        campaign: {
          headline: str(form, 'headline', state.campaign.headline, 120),
          subhead: str(form, 'subhead', state.campaign.subhead, 300),
          note: str(form, 'note', state.campaign.note, 300),
          suggestedPaise: toPaise(suggested),
        },
      });
      return back('Wording saved.');
    }

    case 'ways': {
      const ways = state.ways.map((way, i) => ({
        ...way,
        title: str(form, `title-${i}`, way.title, 60),
        blurb: str(form, `blurb-${i}`, way.blurb, 300),
        url: str(form, `url-${i}`, way.url ?? '', 300) || null,
        cta: str(form, `cta-${i}`, way.cta ?? '', 40) || null,
      }));
      await writeState({ ways });
      return back('Ways to give saved.');
    }

    case 'publish': {
      const preview = form.get('preview') === 'on';
      await writeState({ preview });
      return back(preview
        ? 'Back to preview. The page is hidden from search again.'
        : 'Published. The preview banner is gone and search engines are allowed in.');
    }

    default:
      return back('That button did something unexpected. Nothing was changed.');
  }
}
