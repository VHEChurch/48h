/* 48 heures de prière non-stop · Love Expression Assembly
   L'heure d'Edmonton est calculée avec un décalage fixe (UTC−6 depuis 2026) : les bases de fuseaux des téléphones sont parfois en retard. */
(() => {
  'use strict';
  const DEBUT = Date.UTC(2026, 10, 26, 6), H = 3600000, N = 48, FIN = DEBUT + N * H;
  const SITE = 'https://vhechurch.github.io/48h/';
  const $ = (id) => document.getElementById(id);
  const MEET = $('joindre').href;
  let MAX = 3, MAXD = 12, liste = null, ecart = 0, sel = null, jour = 0, T, lang;

  /* ---------- rangement local (jamais bloquant) ---------- */
  const lire = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage bloqué */ } };

  const maintenant = () => Date.now() + ecart;
  const passe = (h) => DEBUT + (h + 1) * H <= maintenant();
  const gens = (h) => (liste || []).filter((p) => p.de <= h && p.a > h);
  const heureCourante = () => { const t = maintenant(); return t >= DEBUT && t < FIN ? Math.floor((t - DEBUT) / H) : -1; };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  /* ---------- heures ---------- */
  function heure(h, fin) {
    const x = h % 24;
    if (lang === 'en') return x === 0 ? '12 AM' : x < 12 ? `${x} AM` : x === 12 ? '12 PM' : `${x - 12} PM`;
    return fin && x === 0 ? '24 h' : `${String(x).padStart(2, '0')} h`;
  }
  const court = (h) => lang === 'en' ? `${heure(h)}` : `${String(h % 24).padStart(2, '0')} h – ${String(h % 24 + 1).padStart(2, '0')} h`;
  function finDe(de, a) {
    // la fin tombe le lendemain : on le précise
    if (Math.floor(de / 24) === Math.floor((a - 1) / 24)) return heure(a, true);
    return `${heure(a)} (${(a < 48 ? T.vendredi : T.fin).toLowerCase().replace(/^\w/, (c) => lang === 'en' ? c.toUpperCase() : c)})`;
  }
  const plage = (de, a) => T.plage(de < 24 ? T.Jeudi : T.Vendredi, heure(de), finDe(de, a));
  const plageCourte = (de, a) => `${T.jc[de < 24 ? 0 : 1]} ${heure(de)} – ${a > 24 && de < 24 ? T.jc[1] + ' ' + heure(a) : heure(a, true)}`;

  /* ---------- langue ---------- */
  function choisirLangue(l) {
    lang = l; T = TEXTES[l]; ecrire('48h-lang', l);
    document.documentElement.lang = l; document.title = T.titrePage;
    document.querySelectorAll('[data-t]').forEach((e) => { const v = T[e.dataset.t]; if (e.dataset.t === 'slogan') e.innerHTML = v; else e.textContent = v; });
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === l));
    $('raz').textContent = T.effacer;
    tout();
  }

  /* ---------- décor : les faisceaux de l'affiche ---------- */
  function faisceaux() {
    const c = ['#35d0ee', '#f127ff', '#ff4b4b', '#7a3bff', '#35d0ee', '#ff5c7a', '#a81dff'];
    let g = 7; const alea = () => (g = (g * 16807) % 2147483647) / 2147483647;
    const f = document.createDocumentFragment();
    for (let i = 0; i < 18; i++) {
      const e = el('i'), fin = alea() < .6;
      e.style.cssText = `--x:${(alea() * 100).toFixed(1)}%;--l:${fin ? 2 + alea() * 4 : 26 + alea() * 70}px;--h:${35 + alea() * 55}%;--f:${fin ? 1 : 16}px;--c:${c[i % c.length]};--d:${(5 + alea() * 7).toFixed(1)}s;--r:-${(alea() * 8).toFixed(1)}s`;
      f.append(e);
    }
    $('faisceaux').append(f);
  }

  /* ---------- compte à rebours ---------- */
  function rebours() {
    const t = maintenant(), r = $('rebours');
    $('joindre').classList.toggle('direct', t >= DEBUT - 15 * 60000 && t < FIN);
    if (t >= DEBUT) {
      const texte = t < FIN ? T.enCours(heureCourante() + 1) : T.fini;
      if (r.textContent !== texte) r.replaceChildren(el('p', t < FIN ? 'direct' : '', texte));
      return;
    }
    let s = Math.floor((DEBUT - t) / 1000);
    const v = [[Math.floor(s / 86400), T.j], [Math.floor(s % 86400 / 3600), T.h], [Math.floor(s % 3600 / 60), T.m], [s % 60, T.s]].filter((x, i) => i || x[0]);
    if (r.children.length !== v.length || r.querySelector('p') || r.dataset.l !== lang) { r.dataset.l = lang; r.replaceChildren(...v.map((x) => { const d = el('div'); d.append(el('b'), el('small', '', x[1])); return d; })); }
    v.forEach((x, i) => { r.children[i].firstChild.textContent = String(x[0]).padStart(2, '0'); });
  }

  /* ---------- cadran de 48 segments (anneau extérieur : jeudi ; intérieur : vendredi) ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const pt = (r, x) => { const a = (x / 24) * 2 * Math.PI - Math.PI / 2; return [200 + r * Math.cos(a), 200 + r * Math.sin(a)]; };
  function arc(r1, r2, x1, x2) {
    const [a, b] = pt(r2, x1), [c, d] = pt(r2, x2), [e, f] = pt(r1, x2), [g, h] = pt(r1, x1), z = (n) => n.toFixed(2);
    return `M${z(a)} ${z(b)}A${r2} ${r2} 0 0 1 ${z(c)} ${z(d)}L${z(e)} ${z(f)}A${r1} ${r1} 0 0 0 ${z(g)} ${z(h)}Z`;
  }
  const segs = [];
  let aiguille;
  function dessinerCadran() {
    const s = $('cadran');
    const defs = svg('defs', {}), g = svg('linearGradient', { id: 'degrade', x1: 60, y1: 20, x2: 300, y2: 390, gradientUnits: 'userSpaceOnUse' });
    g.append(svg('stop', { offset: 0, 'stop-color': '#c32bff' }), svg('stop', { offset: .55, 'stop-color': '#6a45ff' }), svg('stop', { offset: 1, 'stop-color': '#22c4e6' }));
    defs.append(g); s.append(defs);
    for (let i = 0; i < 24; i++) { const [a, b] = pt(172, i), [c, d] = pt(i % 6 ? 176 : 181, i); s.append(svg('line', { class: 'grad', x1: a, y1: b, x2: c, y2: d, 'stroke-opacity': i % 6 ? .5 : 1 })); }
    for (let h = 0; h < N; h++) {
      const x = h % 24, ext = h < 24, p = svg('path', { d: ext ? arc(127, 166, x + .05, x + .95) : arc(84, 121, x + .07, x + .93), class: 'seg' });
      p.append(svg('title', {}));
      p.addEventListener('click', () => { if (passe(h)) return; montrerJour(h < 24 ? 0 : 1); toucher(h); });
      segs.push(p); s.append(p);
    }
    [[0, 0], [6, 6], [12, 12], [18, 18]].forEach(([x]) => { const [a, b] = pt(194, x), t = svg('text', { x: a, y: b, 'data-x': x }); s.append(t); });
    aiguille = svg('line', { class: 'aiguille', x1: 200, y1: 200, x2: 200, y2: 30 }); s.append(aiguille);
  }
  function majCadran() {
    const hc = heureCourante();
    segs.forEach((p, h) => {
      const g = gens(h);
      p.setAttribute('class', 'seg' + (g.length ? ' plein' : '') + (sel && h >= sel[0] && h < sel[1] ? ' sel' : '') + (passe(h) ? ' passe' : '') + (h === hc ? ' ici' : ''));
      p.firstChild.textContent = T.segment(h < 24 ? T.jeudi : T.vendredi, heure(h), heure(h + 1, true), g.map((x) => x.nom).join(', '));
    });
    document.querySelectorAll('#cadran text').forEach((t) => { t.textContent = heure(+t.dataset.x); });
    aiguille.style.display = hc < 0 ? 'none' : '';
    if (hc >= 0) { const x = ((maintenant() - DEBUT) / H) % 24, r = hc < 24 ? [126, 168] : [60, 124], [a, b] = pt(62, x), [c, d] = pt(r[1], x); aiguille.setAttribute('x1', a); aiguille.setAttribute('y1', b); aiguille.setAttribute('x2', c); aiguille.setAttribute('y2', d); }
    const n = Array.from({ length: N }, (_, h) => gens(h).length > 0).filter(Boolean).length;
    $('nb').replaceChildren(document.createTextNode(liste ? n : '–'), el('small', '', '/48'));
  }

  /* ---------- qui est de permanence, et les heures libres ---------- */
  function majGarde() {
    const z = $('garde'), hc = heureCourante(); z.replaceChildren();
    if (!liste || maintenant() >= FIN) return;
    const bloc = (titre, h) => {
      const g = gens(h), d = el('div', g.length ? '' : 'vide');
      d.append(el('small', '', `${titre} · ${heure(h)}`), el('strong', '', g.map((p) => p.nom).join(', ') || T.personne));
      z.append(d);
    };
    if (hc >= 0) { bloc(T.maintenant, hc); if (hc + 1 < N) bloc(T.ensuite, hc + 1); } else bloc(T.premier, 0);
  }
  function majUrgence() {
    const z = $('urgence'); z.replaceChildren();
    if (!liste || maintenant() >= FIN) return;
    const trous = [];
    for (let h = 0; h < N; h++) if (!passe(h) && !gens(h).length) { const d = trous[trous.length - 1]; if (d && d[1] === h && Math.floor(d[0] / 24) === Math.floor(h / 24)) d[1]++; else trous.push([h, h + 1]); }
    if (!trous.length) { z.append(el('p', '', T.toutPlein)); return; }
    z.append(el('p', '', T.urgence));
    const l = el('div');
    trous.slice(0, 8).forEach(([a, b]) => {
      const bt = el('button', '', plageCourte(a, b)); bt.type = 'button';
      bt.addEventListener('click', () => { montrerJour(a < 24 ? 0 : 1); sel = null; toucher(a); ouvrirFiche(); });
      l.append(bt);
    });
    z.append(l);
  }

  /* ---------- calendrier ---------- */
  function montrerJour(j) {
    jour = j;
    document.querySelectorAll('[data-jour]').forEach((b) => b.setAttribute('aria-selected', +b.dataset.jour === j));
    majGrille();
  }
  function majGrille() {
    const z = $('grille'), mes = new Set(lire('48h-moi', []).map((m) => m.id)), hc = heureCourante();
    const focus = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.h : null;
    z.className = liste ? '' : 'squelette';
    z.replaceChildren(...[['nuit', 0], ['matin', 6], ['apm', 12], ['soir', 18]].map(([cle, d]) => {
      const s = el('section', 'moment'), t = el('h3', '', T[cle]);
      t.append(el('small', '', cle === 'nuit' ? T['nuit' + jour] : ''));
      const c = el('div', 'cases');
      for (let i = 0; i < 6; i++) {
        const h = jour * 24 + d + i, g = gens(h), b = el('button', 'case'); b.type = 'button'; b.dataset.h = h;
        if (g.length) b.classList.add('plein'); if (g.length === 2) b.classList.add('g2'); if (g.length > 2) b.classList.add('g3');
        if (g.some((p) => mes.has(p.id))) b.classList.add('moi-ici');
        if (sel && h >= sel[0] && h < sel[1]) { b.classList.add('sel'); b.setAttribute('aria-pressed', 'true'); }
        if (h === hc) b.classList.add('ici');
        b.disabled = !liste || passe(h);
        b.append(el('b', '', court(h)));
        if (g.length) g.forEach((p) => { const n = el('span', 'n', p.nom); n.title = p.nom; b.append(n); }); else b.append(el('span', 'libre', T.libre));
        b.addEventListener('click', () => toucher(h));
        c.append(b);
      }
      s.append(t, c); return s;
    }));
    if (focus) { const f = z.querySelector(`[data-h="${focus}"]`); if (f) f.focus({ preventScroll: true }); }
    [0, 1].forEach((j) => { let n = 0; for (let h = j * 24; h < j * 24 + 24; h++) if (gens(h).length) n++; $('c' + j).textContent = liste ? T.compte(n) : ''; });
  }

  /* ---------- sélection ---------- */
  function toucher(h) {
    if (passe(h)) return annoncer(T.passee);
    if (gens(h).length >= MAX) return annoncer(T.complete);
    if (!sel) sel = [h, h + 1];
    else if (h >= sel[0] && h < sel[1]) sel = sel[1] - sel[0] === 1 ? null : [h, h + 1];
    else {
      const n = [Math.min(sel[0], h), Math.max(sel[1], h + 1)];
      let ok = n[1] - n[0] <= MAXD;
      for (let i = n[0]; i < n[1]; i++) if (gens(i).length >= MAX) ok = false;
      if (n[1] - n[0] > MAXD) annoncer(T.max(MAXD));
      sel = ok ? n : [h, h + 1];
    }
    majSel();
  }
  function majSel() {
    majGrille(); majCadran();
    $('barre').hidden = !sel;
    if (sel) { $('barre-h').textContent = plageCourte(sel[0], sel[1]); $('barre-d').textContent = T.heuresN(sel[1] - sel[0]); }
  }

  /* ---------- fiche d'inscription ---------- */
  function premierLibre() { for (let h = 0; h < N; h++) if (!passe(h) && !gens(h).length) return h; for (let h = 0; h < N; h++) if (!passe(h) && gens(h).length < MAX) return h; return -1; }
  function ouvrirFiche() {
    if (maintenant() >= FIN) return annoncer(T.fini);
    if (!sel) { const h = premierLibre(); if (h < 0) return annoncer(T.toutPlein); sel = [h, h + 1]; }
    $('merci').hidden = true; $('form').hidden = false; $('alerte').textContent = '';
    if (!$('nom').value) $('nom').value = lire('48h-nom', '');
    remplir(); majSel();
    if (!$('fiche').open) $('fiche').showModal();
  }
  function remplir() {
    const j = sel[0] < 24 ? 0 : 1;
    document.querySelectorAll('[name=jour]').forEach((r) => { r.checked = +r.value === j; });
    const de = $('de'), a = $('a'); de.replaceChildren(); a.replaceChildren();
    for (let h = j * 24; h < j * 24 + 24; h++) {
      const n = gens(h).length, o = new Option(heure(h) + (n >= MAX ? ' ✕' : ''), h); o.disabled = passe(h) || n >= MAX; de.append(o);
    }
    de.value = sel[0];
    for (let h = sel[0] + 1; h <= Math.min(N, sel[0] + MAXD); h++) { if (gens(h - 1).length >= MAX) break; a.append(new Option(finDe(sel[0], h), h)); }
    a.value = sel[1]; if (!a.value) { a.selectedIndex = a.options.length - 1; sel[1] = +a.value; }
    const r = $('resume'); r.replaceChildren(el('b', '', plage(sel[0], sel[1])));
    if (sel[0] % 24 < 6) r.append(document.createTextNode(T['nuit' + j].replace(/^./, (c) => c.toUpperCase())));
    for (let h = sel[0]; h < sel[1]; h++) { const g = gens(h); if (g.length) r.append(el('em', '', T.deja(heure(h), g.map((p) => p.nom).join(', ')))); }
  }
  async function appel(corps) {
    let r;
    try { r = await fetch(window.API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corps) }); r = await r.json(); } catch { return { ok: false, erreur: 'reseau' }; }
    return r;
  }
  function recevoir(o) { liste = o.permanences; if (o.max) MAX = o.max; if (o.maxDuree) MAXD = o.maxDuree; if (o.maintenant) ecart = Math.abs(o.maintenant - Date.now()) > 20000 ? o.maintenant - Date.now() : 0; ecrire('48h-etat', liste); $('etat').textContent = ''; }
  const messageErreur = (o) => { const m = T.err[o.erreur] || T.err.serveur; return typeof m === 'function' ? m(heure(o.heure || 0)) : m; };
  async function envoyer(ev) {
    ev.preventDefault();
    const nom = $('nom').value.replace(/\s+/g, ' ').trim();
    if (nom.length < 2) { $('alerte').textContent = T.err.nom; $('nom').focus(); return; }
    const bt = $('valider'); bt.disabled = true; bt.firstChild.textContent = T.envoi; $('alerte').textContent = '';
    const [de, a] = sel, o = await appel({ action: 'reserver', nom, de, a, site: document.querySelector('.piege').value });
    bt.disabled = false; bt.firstChild.textContent = T.valider;
    if (!o.ok) { $('alerte').textContent = messageErreur(o); if (o.erreur === 'complet') charger(); return; }
    recevoir(o); ecrire('48h-nom', nom);
    ecrire('48h-moi', [...lire('48h-moi', []), { id: o.id, cle: o.cle, nom, de, a }]);
    sel = null; tout(); remercier(nom, de, a);
  }
  const utc = (h) => new Date(DEBUT + h * H).toISOString().replace(/[-:]|\.\d{3}/g, '');
  function remercier(nom, de, a) {
    const z = $('merci'), q = plage(de, a);
    const e = svg('svg', { class: 'eclat', viewBox: '0 0 96 96' }); e.append(svg('circle', { cx: 48, cy: 48, r: 42 }), svg('path', { d: 'M29 50l13 13 26-28' }));
    const b = el('div', 'boutons');
    const lien = (txt, href, cls) => { const x = el('a', 'simple ' + (cls || ''), txt); x.href = href; x.target = '_blank'; x.rel = 'noopener'; b.append(x); return x; };
    lien(T.agendaG, 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(T.agendaTitre) + `&dates=${utc(de)}/${utc(a)}&details=` + encodeURIComponent(`${T.agendaTexte} ${MEET}`) + '&location=' + encodeURIComponent(MEET));
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Love Expression Assembly//48h//FR', 'BEGIN:VEVENT', `UID:48h-${de}-${a}-${Date.now()}@vhechurch.ca`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, '')}`, `DTSTART:${utc(de)}`, `DTEND:${utc(a)}`, `SUMMARY:${T.agendaTitre}`, `DESCRIPTION:${T.agendaTexte} ${MEET}`, `URL:${MEET}`, 'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', `DESCRIPTION:${T.agendaTitre}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const i = lien(T.agendaI, URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))); i.download = '48h-priere.ics'; i.removeAttribute('target');
    lien(T.partager, 'https://wa.me/?text=' + encodeURIComponent(`${T.wa(q)} ${SITE}`), 'wa');
    const f = el('button', 'simple', T.fermer); f.type = 'button'; f.addEventListener('click', () => { $('fiche').close(); $('chaine').scrollIntoView(); }); b.append(f);
    z.replaceChildren(e, el('h2', '', T.merci(nom.split(' ')[0])), el('p', 'quand', q), el('p', '', T.merciTexte), b);
    $('form').hidden = true; z.hidden = false; if (!$('fiche').open) $('fiche').showModal(); $('fiche').scrollTop = 0;
  }

  /* ---------- mes permanences ---------- */
  function majMoi() {
    const z = $('moi'), ids = new Set((liste || []).map((p) => p.id));
    let mes = lire('48h-moi', []);
    if (liste) { const garde = mes.filter((m) => ids.has(m.id)); if (garde.length !== mes.length) ecrire('48h-moi', garde); mes = garde; }
    mes = mes.filter((m) => !passe(m.a - 1)).sort((x, y) => x.de - y.de);
    z.hidden = !mes.length;
    z.replaceChildren(...mes.map((m) => {
      const c = el('article'), d = el('div'); d.append(el('small', '', `${T.maGarde} · ${m.nom}`), el('strong', '', plage(m.de, m.a)));
      const b = el('button', 'lien', T.annuler); b.type = 'button';
      b.addEventListener('click', async () => {
        if (!confirm(T.confirmeAnnuler)) return;
        b.disabled = true; const o = await appel({ action: 'annuler', id: m.id, cle: m.cle }); b.disabled = false;
        if (!o.ok) return annoncer(messageErreur(o));
        ecrire('48h-moi', lire('48h-moi', []).filter((x) => x.id !== m.id)); recevoir(o); tout(); annoncer(T.annulee);
      });
      c.append(d, b); return c;
    }));
  }

  let minuterie;
  function annoncer(t) { const a = $('annonce'); a.textContent = t; a.classList.add('vu'); clearTimeout(minuterie); minuterie = setTimeout(() => a.classList.remove('vu'), 3200); }
  function tout() { rebours(); majSel(); majGarde(); majUrgence(); majMoi(); if ($('fiche').open && !$('form').hidden && sel) remplir(); }

  /* ---------- lecture de la chaîne ---------- */
  let derniere = '';
  async function charger() {
    try {
      const r = await fetch(window.API, { cache: 'no-store' }), o = await r.json();
      if (!o.ok) throw new Error(o.erreur);
      recevoir(o);
      const s = JSON.stringify(liste);
      if (s !== derniere) { derniere = s; if ($('fiche').open) { majGrille(); majCadran(); majGarde(); majUrgence(); majMoi(); } else tout(); }
    } catch { $('etat').textContent = T.erreurCharge; }
  }

  /* ---------- démarrage ---------- */
  faisceaux(); dessinerCadran();
  liste = null; const gardee = lire('48h-etat', null); if (Array.isArray(gardee)) liste = gardee;
  const voulue = new URLSearchParams(location.search).get('lang') || lire('48h-lang', null);
  jour = heureCourante() >= 24 ? 1 : 0;
  choisirLangue(TEXTES[voulue] ? voulue : /^en/i.test(navigator.language || '') ? 'en' : 'fr');
  montrerJour(jour);
  if (!liste) $('etat').textContent = T.chargement;
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => choisirLangue(b.dataset.lang)));
  document.querySelectorAll('[data-jour]').forEach((b) => b.addEventListener('click', () => montrerJour(+b.dataset.jour)));
  $('ouvrir').addEventListener('click', ouvrirFiche);
  $('continuer').addEventListener('click', ouvrirFiche);
  $('raz').addEventListener('click', () => { sel = null; majSel(); });
  $('fermer').addEventListener('click', () => $('fiche').close());
  $('fiche').addEventListener('click', (e) => { if (e.target === $('fiche')) $('fiche').close(); });
  $('form').addEventListener('submit', envoyer);
  document.querySelectorAll('[name=jour]').forEach((r) => r.addEventListener('change', () => {
    const j = +r.value, d = sel[1] - sel[0]; let h = j * 24 + sel[0] % 24;
    for (let k = 0; k < 24; k++) { const x = j * 24 + (h - j * 24 + k) % 24; if (!passe(x) && gens(x).length < MAX) { h = x; break; } }
    sel = [h, Math.min(N, h + d)]; remplir(); montrerJour(j); majSel();
  }));
  $('de').addEventListener('change', () => { const d = sel[1] - sel[0], h = +$('de').value; sel = [h, Math.min(N, h + d)]; remplir(); majSel(); });
  $('a').addEventListener('change', () => { sel = [sel[0], +$('a').value]; remplir(); majSel(); });
  charger();
  setInterval(rebours, 1000);
  setInterval(() => { if (!document.hidden) charger(); }, 15000);
  setInterval(() => { if (!document.hidden && !$('fiche').open) tout(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) charger(); });
})();
