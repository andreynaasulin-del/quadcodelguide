/**
 * Shared media helpers for publish / migrate scripts.
 * Local paths (relative or /ui_views/...) → upload to Vercel Blob → public HTTPS URL.
 */

import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { basename, dirname, resolve, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { upload } from '@vercel/blob/client';

export const ROOT_MEDIA = ['video', 'poster', 'image', 'audio'];
export const STEP_MEDIA = ['result_image', 'result_video', 'result_poster'];

export const MIME = {
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif',
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, '../..');

export function isRemoteUrl(v) {
  return typeof v === 'string' && /^https?:\/\//i.test(v);
}

/** Map a media field value to an absolute file path on disk, or null. */
export function resolveLocalPath(value, baseDir = REPO_ROOT) {
  if (typeof value !== 'string' || !value) return null;
  if (isRemoteUrl(value)) return null;

  let candidate;
  if (value.startsWith('/ui_views/') || value.startsWith('/cars/')) {
    candidate = join(REPO_ROOT, value.replace(/^\//, ''));
  } else if (isAbsolute(value)) {
    candidate = value;
  } else {
    candidate = resolve(baseDir, value);
  }
  return candidate;
}

export function isUploadableLocal(value, baseDir = REPO_ROOT) {
  const p = resolveLocalPath(value, baseDir);
  return Boolean(p && existsSync(p) && statSync(p).isFile());
}

/**
 * If the file is missing locally (sparse checkout), materialize it via `git show`
 * (works even when the path is excluded from the sparse cone).
 * Returns absolute path if available, else null.
 */
export function ensureLocalFile(repoRelativePath) {
  const rel = repoRelativePath.replace(/^\//, '').replace(/\\/g, '/');
  const abs = join(REPO_ROOT, rel);
  if (existsSync(abs) && statSync(abs).isFile()) return abs;

  try {
    mkdirSync(dirname(abs), { recursive: true });
    const buf = execFileSync('git', ['show', `HEAD:${rel}`], {
      cwd: REPO_ROOT,
      maxBuffer: 250 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    writeFileSync(abs, buf);
  } catch (e) {
    console.warn(`  git show failed for ${rel}: ${e.message || e}`);
    return existsSync(abs) ? abs : null;
  }
  return existsSync(abs) && statSync(abs).isFile() ? abs : null;
}

export function repoRelFromAbs(absPath) {
  const norm = resolve(absPath);
  const root = REPO_ROOT + (REPO_ROOT.endsWith('\\') || REPO_ROOT.endsWith('/') ? '' : '\\');
  // normalize both to forward slashes for comparison
  const a = norm.replace(/\\/g, '/');
  const r = REPO_ROOT.replace(/\\/g, '/');
  if (a.startsWith(r + '/')) return a.slice(r.length + 1);
  return basename(absPath);
}

export async function uploadLocalFile({
  absPath,
  guideId,
  site,
  apiKey,
  dryRun = false,
}) {
  const name = basename(absPath);
  const ext = name.split('.').pop().toLowerCase();
  const sizeMb = (statSync(absPath).size / 1024 / 1024).toFixed(1);
  const pathname = `guides/${guideId || 'shared'}/${name}`;

  if (dryRun) {
    console.log(`  [dry-run] would upload ${name} (${sizeMb}MB) → ${pathname}`);
    return `https://blob.example/${pathname}`;
  }

  console.log(`  uploading ${name} (${sizeMb}MB)...`);
  const blob = await upload(pathname, readFileSync(absPath), {
    access: 'public',
    contentType: MIME[ext] || 'application/octet-stream',
    handleUploadUrl: `${site}/api/upload`,
    clientPayload: apiKey,
  });
  console.log(`  -> ${blob.url}`);
  return blob.url;
}

/**
 * Walk a guide object; upload every local media field; mutate in place.
 * Returns count of fields rewritten.
 */
export async function rewriteGuideMedia(guide, {
  site,
  apiKey,
  dryRun = false,
  baseDir = REPO_ROOT,
  fetchMissingFromGit = false,
  deleteAfterUpload = false,
  onlyExt = null, // e.g. new Set(['mp4']) — if set, only those extensions
} = {}) {
  let rewritten = 0;

  async function maybeRewrite(obj, key) {
    const val = obj[key];
    if (typeof val !== 'string' || !val || isRemoteUrl(val)) return;

    let abs = resolveLocalPath(val, baseDir);
    if (!abs || !existsSync(abs)) {
      if (fetchMissingFromGit && (val.startsWith('/ui_views/') || val.startsWith('/cars/'))) {
        abs = ensureLocalFile(val.replace(/^\//, ''));
      }
    }
    if (!abs || !existsSync(abs) || !statSync(abs).isFile()) {
      console.warn(`  skip missing: ${val}`);
      return;
    }

    const ext = basename(abs).split('.').pop().toLowerCase();
    if (onlyExt && !onlyExt.has(ext)) return;

    obj[key] = await uploadLocalFile({
      absPath: abs,
      guideId: guide.id,
      site,
      apiKey,
      dryRun,
    });
    rewritten++;

    if (deleteAfterUpload && !dryRun) {
      try { unlinkSync(abs); } catch { /* ignore */ }
    }
  }

  for (const f of ROOT_MEDIA) await maybeRewrite(guide, f);
  for (const step of guide.steps || []) {
    for (const f of STEP_MEDIA) await maybeRewrite(step, f);
  }
  return rewritten;
}

export function collectLocalMediaRefs(guides, { onlyExt = null } = {}) {
  const refs = new Map(); // path -> [{guideId, field}]
  function add(guideId, field, val) {
    if (typeof val !== 'string' || !val || isRemoteUrl(val)) return;
    if (!(val.startsWith('/ui_views/') || val.startsWith('/cars/') || !val.includes('://'))) return;
    const ext = val.split('.').pop().toLowerCase();
    if (onlyExt && !onlyExt.has(ext)) return;
    if (!refs.has(val)) refs.set(val, []);
    refs.get(val).push({ guideId, field });
  }
  for (const g of guides) {
    for (const f of ROOT_MEDIA) add(g.id, f, g[f]);
    (g.steps || []).forEach((s, i) => {
      for (const f of STEP_MEDIA) add(g.id, `steps[${i}].${f}`, s[f]);
    });
  }
  return refs;
}

export function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
