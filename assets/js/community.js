async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function safeUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u)) return u;
  return encodeURI(u);
}

function renderLinks(host, links) {
  if (!host) return;
  host.innerHTML = "";
  (links || []).forEach(l => {
    if (!l?.url) return;
    const a = document.createElement("a");
    a.className = "button ghost";
    a.href = safeUrl(l.url);
    a.target = /^mailto:/i.test(l.url) ? "_self" : "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = l.label || l.url;
    host.appendChild(a);
  });
}

function renderList(host, items, emptyHtml) {
  if (!host) return;
  host.innerHTML = "";
  if (!items || !items.length) {
    host.innerHTML = emptyHtml || `<div class="notice">Пока пусто.</div>`;
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "people";

  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "card person";

    const top = document.createElement("div");
    top.className = "person-top";

    const left = document.createElement("div");
    left.style.minWidth = "0";

    const title = document.createElement("strong");
    title.textContent = p.name || "Без имени";

    const role = document.createElement("div");
    role.className = "small";
    role.textContent = p.role || "";

    left.appendChild(title);
    if (p.role) left.appendChild(role);

    const right = document.createElement("div");
    if (p.badge) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = p.badge;
      right.appendChild(badge);
    }

    top.appendChild(left);
    top.appendChild(right);

    card.appendChild(top);

    if (p.about) {
      const about = document.createElement("div");
      about.className = "small";
      about.style.marginTop = "8px";
      about.textContent = p.about;
      card.appendChild(about);
    }

    if (p.links && p.links.length) {
      const links = document.createElement("div");
      links.className = "tools";
      links.style.marginTop = "10px";
      renderLinks(links, p.links);
      card.appendChild(links);
    }

    wrap.appendChild(card);
  });

  host.appendChild(wrap);
}

function renderRoles(host, roles) {
  if (!host) return;
  host.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "people";

  (roles || []).forEach(r => {
    const card = document.createElement("div");
    card.className = "card person";

    const top = document.createElement("div");
    top.className = "person-top";

    const left = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${r.badge ? r.badge + " " : ""}${r.title || "Роль"}`;

    const how = document.createElement("div");
    how.className = "small";
    how.textContent = r.how || "";

    left.appendChild(title);
    if (r.how) left.appendChild(how);

    top.appendChild(left);

    card.appendChild(top);

    if (r.rights && r.rights.length) {
      const ul = document.createElement("ul");
      ul.className = "clean";
      r.rights.forEach(x => {
        const li = document.createElement("li");
        li.className = "small";
        li.textContent = "• " + x;
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }

    wrap.appendChild(card);
  });

  host.appendChild(wrap);
}

function renderVerification(host, v, tiers) {
  if (!host) return;
  host.innerHTML = "";

  const policy = document.createElement("div");
  policy.className = "notice";
  policy.innerHTML = `<div><strong>Политика доступа:</strong></div><div class="small" style="margin-top:6px;">${v?.policy || ""}</div>`;
  host.appendChild(policy);

  if (v?.how?.length) {
    const box = document.createElement("div");
    box.className = "card kpi";
    box.innerHTML = `<strong>Как стать верифицированным автором</strong>`;

    const ul = document.createElement("ul");
    ul.className = "clean";
    v.how.forEach(step => {
      const li = document.createElement("li");
      li.className = "small";
      li.textContent = "• " + step;
      ul.appendChild(li);
    });
    box.appendChild(ul);

    // Channels
    const ch = v.channels || {};
    const links = [];
    if (ch.telegram) links.push({ label: "Telegram", url: ch.telegram });
    if (ch.email) links.push({ label: "Email", url: ch.email });
    // Не показываем технические каналы (репозитории/issue-трекеры) обычным пользователям.

    if (links.length) {
      const linksHost = document.createElement("div");
      linksHost.className = "tools";
      linksHost.style.marginTop = "10px";
      renderLinks(linksHost, links);
      box.appendChild(linksHost);
    }

    host.appendChild(box);
  }

  if (v?.rules?.length) {
    const rules = document.createElement("div");
    rules.className = "card kpi";
    rules.innerHTML = `<strong>Правила добавления материалов</strong>`;

    const ul = document.createElement("ul");
    ul.className = "clean";
    v.rules.forEach(rule => {
      const li = document.createElement("li");
      li.className = "small";
      li.textContent = "• " + rule;
      ul.appendChild(li);
    });
    rules.appendChild(ul);
    host.appendChild(rules);
  }

  if (tiers && tiers.length) {
    const tiersBox = document.createElement("div");
    tiersBox.className = "card kpi";
    tiersBox.innerHTML = `<strong>Как работают спонсорские уровни</strong>`;

    const ul = document.createElement("ul");
    ul.className = "clean";
    tiers.forEach(t => {
      const li = document.createElement("li");
      li.className = "small";
      li.textContent = `• ${t.badge ? t.badge + " " : ""}${t.title}: ${t.hint || ""}`;
      ul.appendChild(li);
    });
    tiersBox.appendChild(ul);
    tiersBox.appendChild(document.createElement("div")).className = "small";
    tiersBox.lastChild.style.marginTop = "8px";
    tiersBox.lastChild.textContent = "Если хочешь попасть в список спонсоров — напиши мне после доната (ник/имя, как показывать).";

    host.appendChild(tiersBox);
  }
}

function renderSponsors(host, sponsors, emptyText) {
  if (!host) return;
  if (!sponsors || !sponsors.length) {
    host.innerHTML = emptyText || `<div class="notice">Пока нет спонсоров в списке. Хочешь поддержать? Блок “Донат” — ниже.</div>`;
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "people";

  sponsors.forEach(s => {
    const card = document.createElement("div");
    card.className = "card person";

    const top = document.createElement("div");
    top.className = "person-top";

    const left = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = s.name || "Спонсор";

    const note = document.createElement("div");
    note.className = "small";
    note.textContent = s.note || s.tier || "";

    left.appendChild(name);
    if (s.note || s.tier) left.appendChild(note);

    const right = document.createElement("div");
    if (s.badge || s.tier) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = s.badge || s.tier;
      right.appendChild(badge);
    }

    top.appendChild(left);
    top.appendChild(right);

    card.appendChild(top);

    if (s.url) {
      const linksHost = document.createElement("div");
      linksHost.className = "tools";
      linksHost.style.marginTop = "10px";
      renderLinks(linksHost, [{ label: "Ссылка", url: s.url }]);
      card.appendChild(linksHost);
    }

    wrap.appendChild(card);
  });

  host.innerHTML = "";
  host.appendChild(wrap);
}


document.addEventListener("DOMContentLoaded", async () => {
  const rolesHost = document.querySelector("#rolesList");
  const verifyHost = document.querySelector("#verificationHost");
  const teamHost = document.querySelector("#teamList");
  const contribHost = document.querySelector("#contributorsList");
  const sponsorsHost = document.querySelector("#sponsorsList");
  const introHost = document.querySelector("#communityIntro");

  // If no placeholders exist, do nothing (keeps the script safe on other pages).
  if (!rolesHost && !verifyHost && !teamHost && !contribHost && !sponsorsHost && !introHost) return;

  try {
    const cfg = await loadJSON("content/community.json");

    if (introHost && cfg?.intro) {
      introHost.innerHTML = `<div class="notice"><div><strong>${cfg.intro.title || ""}</strong></div><div class="small" style="margin-top:6px;">${cfg.intro.text || ""}</div></div>`;
    }

    renderRoles(rolesHost, cfg?.roles || []);
    renderVerification(verifyHost, cfg?.verification || {}, cfg?.sponsorTiers || []);

    renderList(teamHost, cfg?.team || [], `<div class="notice">Команда пока не заполнена.</div>`);
    renderList(contribHost, cfg?.contributors || [], `<div class="notice">Пока нет контрибьюторов в списке. Хочешь помочь? Загляни во вкладку “Роли и верификация”.</div>`);
    renderSponsors(sponsorsHost, cfg?.sponsors || [], `<div class="notice">Пока нет спонсоров в списке. Хочешь поддержать? Блок “Донат” — ниже.</div>`);
  } catch (e) {
    console.warn(e);
    if (introHost) introHost.innerHTML = `<div class="notice">Не получилось загрузить данные раздела. Попробуй обновить страницу.</div>`;
  }
});
