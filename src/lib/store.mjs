import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DEFAULT_STATE } from './defaults.mjs';

// Settings are a few hundred bytes changed a few times a month, so the store is
// deliberately dull. Two backends:
//
//   file — a JSON file. Right for a VPS, Railway, Fly, or your laptop.
//   kv   — Upstash's REST API, which is also what Vercel KV speaks. Needed on
//          serverless hosts, where the filesystem is read-only and anything
//          written to /tmp is gone by the next request.
//
// Everything else in the app goes through readState/writeState and neither
// knows nor cares which one is in play.

const FILE = resolve(process.cwd(), 'data/state.json');
const KEY = 'open-raise:state';

function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

/** 'kv' | 'file' — the admin screen says which, so nobody is surprised later. */
export function storeKind() {
  return kvConfig() ? 'kv' : 'file';
}

/** True when saving will silently fail: a serverless host with no KV attached. */
export function storeIsEphemeral() {
  return storeKind() === 'file' && Boolean(process.env.VERCEL || process.env.NETLIFY);
}

let cache = null;

function merge(base, patch) {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(base[k] ?? {}, v) : v;
  }
  return out;
}

async function load() {
  const kv = kvConfig();
  if (!kv) return JSON.parse(await readFile(FILE, 'utf8'));

  const res = await fetch(`${kv.url}/get/${encodeURIComponent(KEY)}`, {
    headers: { Authorization: `Bearer ${kv.token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV read failed: ${res.status}`);
  const { result } = await res.json();
  if (!result) throw new Error('nothing saved yet');
  return typeof result === 'string' ? JSON.parse(result) : result;
}

async function save(state) {
  const kv = kvConfig();
  if (!kv) {
    await mkdir(dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(state, null, 2));
    return;
  }
  const res = await fetch(`${kv.url}/set/${encodeURIComponent(KEY)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${kv.token}` },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`KV write failed: ${res.status} ${await res.text()}`);
}

export async function readState() {
  if (cache) return cache;
  try {
    cache = merge(DEFAULT_STATE, await load());
  } catch {
    // Nothing saved yet, or the store is unreachable. Defaults are a safe
    // answer either way: they hold copy and a goal, never a money figure.
    cache = structuredClone(DEFAULT_STATE);
  }
  return cache;
}

export async function writeState(patch) {
  const next = merge(await readState(), patch);
  await save(next);
  cache = next;
  return next;
}

export async function resetState() {
  cache = structuredClone(DEFAULT_STATE);
  await save(cache);
  return cache;
}
