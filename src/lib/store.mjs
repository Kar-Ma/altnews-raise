import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DEFAULT_STATE } from './defaults.mjs';

// A JSON file is the right store for a demo and for a single small newsroom.
// Swap these two functions for Postgres/KV and nothing else in the app changes.
const FILE = resolve(process.cwd(), 'data/state.json');

let cache = null;

function merge(base, patch) {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(base[k] ?? {}, v) : v;
  }
  return out;
}

export async function readState() {
  if (cache) return cache;
  try {
    cache = merge(DEFAULT_STATE, JSON.parse(await readFile(FILE, 'utf8')));
  } catch {
    cache = structuredClone(DEFAULT_STATE);
  }
  return cache;
}

export async function writeState(patch) {
  const next = merge(await readState(), patch);
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(next, null, 2));
  cache = next;
  return next;
}

export async function resetState() {
  cache = structuredClone(DEFAULT_STATE);
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(cache, null, 2));
  return cache;
}
