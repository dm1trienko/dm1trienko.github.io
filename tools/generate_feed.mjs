#!/usr/bin/env node
/*
  Generates feed.xml (Atom) from content/news.json and content/site.json.

  Usage:
    node tools/generate_feed.mjs
*/

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const baseUrl = (site?.site?.url || 'https://dmitrienok.ru').replace(/\/+$/, '');
const newsRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/news.json'), 'utf8'));
const entries = Array.isArray(newsRaw) ? newsRaw : (newsRaw?.items || []);

function esc(s){
  return String(s||'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

function isoDate(d){
  // Expect YYYY-MM-DD
  const s = String(d||'').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00Z`;
  // fallback: now
  return new Date().toISOString();
}

const sorted = entries
  .slice()
  .filter(x=>x && x.id)
  .sort((a,b)=>(b.date||'').localeCompare(a.date||''));

const updated = sorted[0]?.date ? isoDate(sorted[0].date) : new Date().toISOString();

const out = [];
out.push('<?xml version="1.0" encoding="utf-8"?>');
out.push('<feed xmlns="http://www.w3.org/2005/Atom">');
out.push(`  <title>${esc('Новости — dmitrienok.ru')}</title>`);
out.push(`  <id>${esc(baseUrl + '/')}</id>`);
out.push(`  <link href="${esc(baseUrl + '/feed.xml')}" rel="self" />`);
out.push(`  <link href="${esc(baseUrl + '/')}" />`);
out.push(`  <updated>${esc(updated)}</updated>`);
out.push('');

for (const n of sorted.slice(0, 50)) {
  const link = `${baseUrl}/post.html?id=${encodeURIComponent(n.id)}`;
  const summary = n.excerpt || '';
  out.push('  <entry>');
  out.push(`    <title>${esc(n.title || 'Пост')}</title>`);
  out.push(`    <id>${esc(link)}</id>`);
  out.push(`    <link href="${esc(link)}" />`);
  out.push(`    <updated>${esc(isoDate(n.date))}</updated>`);
  if (summary) out.push(`    <summary>${esc(summary)}</summary>`);
  out.push('  </entry>');
  out.push('');
}

out.push('</feed>');

fs.writeFileSync(path.join(ROOT, 'feed.xml'), out.join('\n'));
console.log('Updated feed.xml');
