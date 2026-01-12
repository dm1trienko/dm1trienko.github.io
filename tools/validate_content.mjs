#!/usr/bin/env node
/*
  Content validator for the hub (runs in CI).
  Goal: catch broken JSON, duplicate IDs, missing local files and unsafe URLs.

  Usage:
    node tools/validate_content.mjs
*/

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STRICT_FILES = process.env.STRICT_FILES === '1';

function readText(p){
  return fs.readFileSync(path.join(ROOT, p), 'utf8');
}

function exists(p){
  return fs.existsSync(path.join(ROOT, p));
}

function readJSON(p){
  const txt = readText(p);
  try {
    return JSON.parse(txt);
  } catch (e) {
    throw new Error(`JSON parse error in ${p}: ${e.message}`);
  }
}

function isSafeUrl(u){
  if (!u) return true;
  const s = String(u).trim().toLowerCase();
  if (!s) return true;
  if (s.startsWith('javascript:') || s.startsWith('vbscript:') || s.startsWith('data:')) return false;
  return true;
}

function isRemote(u){
  const s = String(u || '').trim();
  return /^https?:\/\//i.test(s) || /^mailto:/i.test(s) || /^tel:/i.test(s);
}

function isLocalPath(u){
  const s = String(u || '').trim();
  if (!s) return false;
  if (isRemote(s)) return false;
  // hash-only links are fine
  if (s.startsWith('#')) return false;
  // normalize leading slash
  return true;
}

function normalizeLocal(u){
  const s = String(u || '').trim();
  return s.startsWith('/') ? s.slice(1) : s;
}

function checkIdUniq(items, label, errors){
  const seen = new Map();
  for (const it of items) {
    const id = it?.id;
    if (!id) continue;
    if (seen.has(id)) {
      errors.push(`[${label}] duplicate id: "${id}" (${seen.get(id)} and ${it.title || it.file || it.url || 'unknown'})`);
    } else {
      seen.set(id, it.title || it.file || it.url || 'unknown');
    }
  }
}

function checkRequired(it, fields, label, errors){
  for (const f of fields) {
    if (it?.[f] === undefined || it?.[f] === null || String(it?.[f]).trim() === '') {
      errors.push(`[${label}] missing field "${f}" in: ${JSON.stringify({ id: it?.id, title: it?.title }).slice(0, 200)}`);
    }
  }
}

function checkDateYYYYMMDD(dateStr, label, errors){
  if (!dateStr) return;
  const s = String(dateStr).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    errors.push(`[${label}] date must be YYYY-MM-DD, got: "${s}"`);
  }
}

function checkUrls(it, urlFields, label, errors, warnings){
  for (const f of urlFields) {
    const u = it?.[f];
    if (!u) continue;
    if (!isSafeUrl(u)) errors.push(`[${label}] unsafe URL in ${f}: "${u}" (id=${it?.id || '—'})`);
    if (isLocalPath(u)) {
      const local = normalizeLocal(u);
      if (!exists(local)) {
        const msg = `[${label}] local file not found for ${f}: "${u}" (expected ${local})`;
        (STRICT_FILES ? errors : (warnings || errors)).push(msg);
      }
    }
  }
}

function ensureArray(x){
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.items)) return x.items;
  if (x && Array.isArray(x.polls)) return x.polls;
  return [];
}

const errors = [];
const warnings = [];

try {
  // Core content files
  const site = readJSON('content/site.json');
  if (!site?.site?.title) warnings.push('[site] site.title is empty');
  if (!site?.founder?.name) warnings.push('[site] founder.name is empty');

  const resources = ensureArray(readJSON('content/resources.json'));
  checkIdUniq(resources, 'resources', errors);
  for (const r of resources) {
    checkRequired(r, ['id','title'], 'resources', errors);
    checkUrls(r, ['url','embedUrl'], 'resources', errors, warnings);
  }

  const schedules = ensureArray(readJSON('content/schedules.json'));
  checkIdUniq(schedules, 'schedules', errors);
  for (const s of schedules) {
    checkRequired(s, ['id','title'], 'schedules', errors);
    checkUrls(s, ['url','embedUrl'], 'schedules', errors, warnings);
  }

  const polls = ensureArray(readJSON('content/polls.json'));
  // Poll IDs can be auto-generated in runtime, so we only warn.
  for (const p of polls) {
    if (!p?.id) warnings.push(`[polls] missing id (runtime will generate): ${p?.title || 'unknown'}`);
    checkRequired(p, ['title'], 'polls', errors);
    checkUrls(p, ['url','embedUrl'], 'polls', errors, warnings);
  }

  // Calculators are stored as: content/calculators/index.json + one JSON file per calculator
  const calcsIndex = readJSON('content/calculators/index.json');
  const calcs = ensureArray(calcsIndex);
  checkIdUniq(calcs, 'calculators', errors);
  for (const c of calcs) {
    checkRequired(c, ['id','title','file'], 'calculators', errors);
    checkUrls(c, ['file'], 'calculators', errors, warnings);

    // Validate the referenced calculator file
    if (c?.file && exists(c.file)) {
      const cf = readJSON(c.file);
      if (cf?.id && String(cf.id) !== String(c.id)) {
        errors.push(`[calculators] id mismatch: index id="${c.id}" but file has id="${cf.id}" (${c.file})`);
      }
    }
  }

  const news = ensureArray(readJSON('content/news.json'));
  checkIdUniq(news, 'news', errors);
  for (const n of news) {
    checkRequired(n, ['id','title','date','file'], 'news', errors);
    checkDateYYYYMMDD(n?.date, 'news', errors);
    if (n?.file && !exists(n.file)) errors.push(`[news] post file missing: ${n.file} (id=${n.id})`);
  }

  const comm = ensureArray(readJSON('content/community.json'));
  for (const m of comm) {
    checkRequired(m, ['name'], 'community', errors);
    checkUrls(m, ['url','tg','github'], 'community', errors, warnings);
  }

  // Info is structured as sections → items
  const infoCfg = readJSON('content/info.json');
  const sections = Array.isArray(infoCfg?.sections) ? infoCfg.sections : [];
  for (const sec of sections) {
    const items = Array.isArray(sec?.items) ? sec.items : [];
    for (const it of items) {
      checkRequired(it, ['url'], 'info', errors);
      if (!it?.title) warnings.push(`[info] missing title: ${it?.url || 'unknown'}`);
      checkUrls(it, ['url'], 'info', errors, warnings);
    }
  }

  // Meta files should exist
  ['manifest.webmanifest','opensearch.xml','feed.xml','sitemap.xml','robots.txt','sw.js'].forEach((p) => {
    if (!exists(p)) errors.push(`[meta] missing file: ${p}`);
  });

} catch (e) {
  errors.push(String(e?.message || e));
}

if (warnings.length) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log('  -', w);
}

if (errors.length) {
  console.error('\nErrors:');
  for (const err of errors) console.error('  -', err);
  console.error(`\nFAILED: ${errors.length} error(s).`);
  process.exit(1);
}

console.log('OK: content validated.');
