#!/usr/bin/env node
/*
  Generates sitemap.xml from catalogs.

  Usage:
    node tools/generate_sitemap.mjs
*/

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readJSON(p){
  return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
}

function trimTrailingSlashes(url){
  let u = String(url || '').trim();
  while (u.endsWith('/')) u = u.slice(0, -1);
  return u;
}

function escXml(s){
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

const site = readJSON('content/site.json');
const baseUrl = trimTrailingSlashes(site?.site?.url || 'https://dmitrienok.ru');

const urls = new Set();

// Main pages
urls.add(`${baseUrl}/`);
urls.add(`${baseUrl}/viewer.html`);
urls.add(`${baseUrl}/post.html`);

// News deep links
try {
  const newsRaw = readJSON('content/news.json');
  const news = Array.isArray(newsRaw) ? newsRaw : (newsRaw?.items || []);
  for (const n of news) {
    if (!n?.id) continue;
    urls.add(`${baseUrl}/post.html?id=${encodeURIComponent(n.id)}`);
  }
} catch {}

// Viewer deep links (materials/schedules/polls)
// NOTE: If you have a lot of items, this can make sitemap.xml large.
const catalogs = [
  ['content/resources.json', (x)=>x?.id],
  ['content/schedules.json', (x)=>x?.id],
  ['content/polls.json', (x)=>x?.id],
];

for (const [file, getId] of catalogs) {
  try {
    const raw = readJSON(file);
    const items = Array.isArray(raw) ? raw : (raw?.items || raw?.polls || []);
    for (const it of items) {
      const id = getId(it);
      if (!id) continue;
      urls.add(`${baseUrl}/viewer.html?id=${encodeURIComponent(id)}`);
    }
  } catch {}
}

// Calculator deep links (index.html?calc=ID)
try {
  const raw = readJSON('content/calculators/index.json');
  const items = Array.isArray(raw) ? raw : (raw?.items || raw?.calculators || []);
  for (const c of items) {
    if (!c?.id) continue;
    urls.add(`${baseUrl}/?calc=${encodeURIComponent(c.id)}`);
  }
} catch {}

const out = [];
out.push('<?xml version="1.0" encoding="UTF-8"?>');
out.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
for (const u of Array.from(urls).sort()) {
  out.push(`  <url><loc>${escXml(u)}</loc></url>`);
}
out.push('</urlset>');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), out.join('\n'));
console.log('Updated sitemap.xml');
