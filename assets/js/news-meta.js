(function () {
  const mdCache = new Map();

  function stripQuotes(value) {
    const s = (value || "").toString().trim();
    if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s;
  }

  function parseValue(raw) {
    const s = (raw || "").toString().trim();
    if (!s) return "";
    if (s.startsWith("[") && s.endsWith("]")) {
      const inner = s.slice(1, -1);
      return inner
        .split(",")
        .map((v) => stripQuotes(v))
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return stripQuotes(s);
  }

  function parseMetaLines(lines) {
    const meta = {};
    let currentKey = null;

    lines.forEach((line) => {
      const raw = (line || "").trim();
      if (!raw) return;

      const m = raw.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (m) {
        currentKey = m[1].toLowerCase();
        meta[currentKey] = parseValue(m[2] || "");
        return;
      }

      if (currentKey && raw.startsWith("-")) {
        const item = raw.replace(/^-+/, "").trim();
        if (!item) return;
        if (!Array.isArray(meta[currentKey])) {
          meta[currentKey] = meta[currentKey] ? [meta[currentKey]] : [];
        }
        meta[currentKey].push(stripQuotes(item));
      }
    });

    return meta;
  }

  function parseFrontMatter(mdText) {
    const text = (mdText || "").toString();
    const lines = text.split(/\r?\n/);
    if (!lines.length || lines[0].trim() !== "---") {
      return { meta: {}, body: text };
    }

    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      return { meta: {}, body: text };
    }

    const meta = parseMetaLines(lines.slice(1, endIndex));
    const body = lines.slice(endIndex + 1).join("\n");
    return { meta, body };
  }

  function normalizeTags(value) {
    if (Array.isArray(value)) {
      return value.flatMap((v) => normalizeTags(v));
    }
    if (value === null || value === undefined) return [];
    const text = value.toString().trim();
    if (!text) return [];
    return text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t.slice(1).trim() : t))
      .filter(Boolean);
  }

  function normalizeDate(value) {
    const s = (value || "").toString().trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return s;
  }

  function formatDateDisplay(value) {
    const s = (value || "").toString().trim();
    if (!s) return "";
    const iso = normalizeDate(s);
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    return s;
  }

  function dateSortKey(value) {
    const s = (value || "").toString().trim();
    if (!s) return 0;
    const iso = normalizeDate(s);
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
  }

  function toPlainText(mdText) {
    const text = (mdText || "").toString();
    return text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]*`/g, " ")
      .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/[#>*_~]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildExcerpt(mdText, limit = 180) {
    const plain = toPlainText(mdText);
    if (!plain) return "";
    if (plain.length <= limit) return plain;
    const cut = plain.slice(0, limit);
    return cut.replace(/\s+\S*$/, "").trim() + "...";
  }

  function mergePostMeta(base, meta, body) {
    const out = { ...(base || {}) };
    const m = meta || {};

    const title = (m.title || "").toString().trim();
    const date = normalizeDate(m.date || "");
    const tags = normalizeTags(m.tags);
    const excerpt = (m.excerpt || "").toString().trim();

    if (title) out.title = title;
    if (date) out.date = date;
    if (tags.length) out.tags = tags;
    if (excerpt) out.excerpt = excerpt;

    out.tags = normalizeTags(out.tags);
    out.date = normalizeDate(out.date || "");
    out.dateDisplay = formatDateDisplay(out.date);
    out._dateSort = dateSortKey(out.date);

    if (!out.excerpt && body) out.excerpt = buildExcerpt(body);

    return out;
  }

  async function fetchText(url) {
    if (!url) return "";
    if (mdCache.has(url)) return mdCache.get(url);
    const p = fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "");
    mdCache.set(url, p);
    return p;
  }

  async function hydratePosts(posts) {
    const list = Array.isArray(posts) ? posts : [];
    const hydrated = await Promise.all(
      list.map(async (item) => {
        if (!item || !item.file) return mergePostMeta(item || {}, {}, "");
        const md = await fetchText(item.file);
        if (!md) return mergePostMeta(item, {}, "");
        const parsed = parseFrontMatter(md);
        return mergePostMeta(item, parsed.meta, parsed.body);
      })
    );
    return hydrated;
  }

  window.NewsMeta = {
    parseFrontMatter,
    normalizeTags,
    normalizeDate,
    formatDateDisplay,
    dateSortKey,
    mergePostMeta,
    hydratePosts,
  };
})();
