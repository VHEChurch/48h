/* L'écran de prière : tout se déduit de l'heure. Le sujet n° 1 commence jeudi 26.11.2026 à 00 h (UTC−6), un sujet toutes les 5 minutes. */
(() => {
  const T = {
    fr: { prog: '48 heures de prière non-stop', apercu: 'Aperçu', restant: 'Temps restant', garde: 'De permanence', joindre: 'Rejoindre la chaîne de prière', choisir: 'Choisir mon heure', volume: 'Volume', cloche: 'Bruitages', mus: 'Musique', categorie: 'Catégorie en cours', catN: (a, b) => `Sujet ${a} sur ${b}`, catS: (x) => `Ensuite : ${x}`, catF: (x) => `Prochaine catégorie : ${x}`, nouvelle: 'Nouvelle catégorie', faites: (n) => n === 1 ? '1 heure accomplie' : `${n} heures accomplies`, hEn: (n) => `Nous entrons dans l’heure ${n} sur 48`, es1: 'Son sujet', es2: 'Son catégorie', es3: 'Son heure',
      slogan: 'PARTAGER L’AMOUR DE <em>CHRIST</em> POUR CHANGER LE MONDE', sujet: (n, t) => `Sujet ${n} sur ${t}`, prochain: (r) => `Ensuite : ${r}`, apres: (h, q) => `À ${h} : ${q}`, releve: (m, q) => `Relève dans ${m} : ${q}`, personne: 'Toute l’assemblée', fin: 'fin de la chaîne',
      son: 'Lancer le son', couper: 'Couper le son', plein: 'Plein écran', piste: 'Musique suivante', prec: 'Sujet précédent', suiv: 'Sujet suivant', avant: 'La chaîne commence dans', avantS: 'Jeudi 26 novembre, 00 h, heure d’Edmonton', finT: 'Les 48 heures sont accomplies', finS: 'Merci à chaque sentinelle. À Dieu seul la gloire !',
      jours: ['Jeudi 26 novembre', 'Vendredi 27 novembre'], h: (h) => `${h} h`, heureN: (n) => `heure ${n} sur 48`, et: ' et ' },
    en: { prog: '48 hours of non-stop prayer', apercu: 'Preview', restant: 'Time remaining', garde: 'On watch', joindre: 'Join the prayer chain', choisir: 'Choose my hour', volume: 'Volume', cloche: 'Chimes', mus: 'Music', categorie: 'Current category', catN: (a, b) => `Topic ${a} of ${b}`, catS: (x) => `Next: ${x}`, catF: (x) => `Next category: ${x}`, nouvelle: 'New category', faites: (n) => n === 1 ? '1 hour completed' : `${n} hours completed`, hEn: (n) => `Entering hour ${n} of 48`, es1: 'Topic sound', es2: 'Category sound', es3: 'Hour sound',
      slogan: 'SHARING THE LOVE OF <em>CHRIST</em> TO CHANGE THE WORLD', sujet: (n, t) => `Topic ${n} of ${t}`, prochain: (r) => `Next: ${r}`, apres: (h, q) => `At ${h}: ${q}`, releve: (m, q) => `Handover in ${m}: ${q}`, personne: 'The whole church', fin: 'end of the chain',
      son: 'Turn sound on', couper: 'Turn sound off', plein: 'Full screen', piste: 'Next track', prec: 'Previous topic', suiv: 'Next topic', avant: 'The chain begins in', avantS: 'Thursday, November 26, 12 AM, Edmonton time', finT: 'The 48 hours are complete', finS: 'Thank you to every watchman. To God alone be the glory!',
      jours: ['Thursday, November 26', 'Friday, November 27'], h: (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`, heureN: (n) => `hour ${n} of 48`, et: ' and ' },
  };
  const $ = (i) => document.getElementById(i), Q = new URLSearchParams(location.search);
  const DEBUT = Date.UTC(2026, 10, 26, 6), MIN = 60000, PAS = 5 * MIN, TOTAL = 576, FIN = DEBUT + TOTAL * PAS;
  const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } }, ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch { /* stockage fermé */ } };
  let lang = Q.get('lang') || lire('48h-lang') || 'fr'; if (!T[lang]) lang = 'fr';
  const t = () => T[lang];
  const apercu = Q.has('apercu');
  // en aperçu : ?apercu (sujet 1) ou ?apercu=120 (sujet 120), ?reste=20 (20 s avant la fin du sujet) ; les flèches changent de sujet
  let decal = apercu ? DEBUT + (Math.min(TOTAL, Math.max(1, Number(Q.get('apercu')) || 1)) - 1) * PAS + (Q.has('reste') ? PAS - Number(Q.get('reste')) * 1000 : 1500) - Date.now() : 0;
  let horloge = 0, sujets = [], gardes = [], vu = -1, vuEtat = '', vuGarde = '';
  const now = () => Date.now() + horloge * !apercu + decal;
  const p2 = (n) => String(n).padStart(2, '0');
  const chiffres = (s) => s.replace(/\d/g, '<i>$&</i>').replace(/:/g, '<u>:</u>');
  const hms = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`; };
  const ech = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  /* ---- données ---- */
  async function chargerSujets() {
    try {
      const r = await (await fetch('sujets.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-cache' })).json();
      if (!Array.isArray(r.sujets) || (r.exemples && !apercu)) return; // les exemples ne servent qu’à l’aperçu
      const avant = JSON.stringify(sujets[vu]), premier = !sujets.length; sujets = r.sujets;
      if (!premier && vu >= 0 && JSON.stringify(sujets[vu]) !== avant) poser(vu, false);
    } catch { /* on garde les sujets déjà chargés */ }
  }
  async function chargerGardes() {
    try {
      const a = Date.now(), r = await (await fetch(window.API, { cache: 'no-store' })).json(), b = Date.now();
      if (!r.ok) return;
      gardes = r.permanences; ecrire('48h-gardes', JSON.stringify(gardes));
      // l'horloge de l'appareil est recalée sur celle du serveur si elle s'en écarte nettement
      const e = r.maintenant - (a + b) / 2; if (b - a < 6000) horloge = Math.abs(e) > 2500 + (b - a) / 2 ? e : 0;
      vuGarde = '';
    } catch { if (!gardes.length) try { gardes = JSON.parse(lire('48h-gardes')) || []; } catch { gardes = []; } }
  }
  const noms = (h) => gardes.filter((g) => g.de <= h && g.a > h).map((g) => g.nom);
  const joint = (l) => l.length ? l.slice(0, -1).join(', ') + (l.length > 1 ? t().et : '') + l[l.length - 1] : t().personne;
  const libre = { theme: 'Sentinelles', ref: 'Ésaïe 62.6', verset: 'Sur tes murs, Jérusalem, j’ai placé des gardes ; Ils ne se tairont ni jour ni nuit.', texte: 'Nous déclarons que nous tenons la garde devant Dieu. Nous prions par l’Esprit, chacun à haute voix, sans nous taire.' };
  const sujet = (i) => sujets[i] && (sujets[i].texte || sujets[i].verset) ? sujets[i] : libre;

  /* ---- le cadran des 5 minutes ---- */
  const R = 176, PER = 2 * Math.PI * R;
  let gr = '';
  for (let i = 0; i < 60; i++) { const a = i / 60 * 2 * Math.PI - Math.PI / 2, l = i % 12 === 0 ? 20 : 9, r2 = 152; gr += `<line x1="${(200 + (r2 - l) * Math.cos(a)).toFixed(1)}" y1="${(200 + (r2 - l) * Math.sin(a)).toFixed(1)}" x2="${(200 + r2 * Math.cos(a)).toFixed(1)}" y2="${(200 + r2 * Math.sin(a)).toFixed(1)}" stroke="#35d0ee" stroke-opacity="${i % 12 ? 0.4 : 0.95}" stroke-width="${i % 12 ? 2 : 4}"/>`; }
  $('cadran').innerHTML = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#35d0ee"/><stop offset=".45" stop-color="#b02bff"/><stop offset="1" stop-color="#f127ff"/></linearGradient><radialGradient id="o"><stop offset=".55" stop-color="#0d0026" stop-opacity=".78"/><stop offset="1" stop-color="#0d0026" stop-opacity=".4"/></radialGradient><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>
    <circle cx="200" cy="200" r="192" fill="url(#o)"/><circle cx="200" cy="200" r="${R}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="18"/>${gr}
    <g transform="rotate(-90 200 200)"><circle class="arc" cx="200" cy="200" r="${R}" fill="none" stroke="#f127ff" stroke-opacity=".55" stroke-width="20" filter="url(#b)" stroke-dasharray="${PER}"/><circle class="arc" cx="200" cy="200" r="${R}" fill="none" stroke="url(#g)" stroke-width="18" stroke-dasharray="${PER}"/></g>
    <g id="tete"><circle cx="${200 + R}" cy="200" r="13" fill="#fff"/><circle cx="${200 + R}" cy="200" r="6" fill="#ffe21a"/></g>`;
  const arcs = [...document.querySelectorAll('.arc')], tete = $('tete');
  $('bande48').innerHTML = '<i><b></b></i>'.repeat(48);
  const segs = [...$('bande48').children];

  /* ---- affichage du sujet ---- */
  const V = '(?:déclar|proclam|annonç|décrét|confess|affirm)(?:ons|e)(?![\\p{L}])';
  const MOTS = new RegExp(`(?<![\\p{L}])(?:nous|je)\\s+${V}(?:(?:,\\s+|\\s+et\\s+)(?:nous\\s+|je\\s+)?${V})*`, 'giu');
  const typo = (s) => String(s || '').replace(/\s+([;!?»])/g, ' $1').replace(/\s+:/g, ' :').replace(/«\s+/g, '« ');
  function ajuster() {
    const z = $('zone'), s = $('sujet');
    if (vuEtat !== 'priere') return;
    if (getComputedStyle(document.querySelector('aside')).display === 'contents') { s.style.removeProperty('--fs'); return; }
    let a = 14, b = Math.min(innerHeight * 0.078, innerWidth * 0.046); const H = z.clientHeight * 0.965;
    for (let i = 0; i < 11; i++) { const m = (a + b) / 2; s.style.setProperty('--fs', m + 'px'); if (s.offsetHeight <= H) a = m; else b = m; }
    s.style.setProperty('--fs', a + 'px');
  }
  function poser(i, anime) {
    const x = sujet(i), th = $('theme'), rf = $('ref'), bl = rf.closest('.ref'), v = $('verset'), d = $('declare');
    th.textContent = typo(x.theme); th.hidden = !x.theme;
    rf.textContent = x.ref || ''; bl.hidden = !x.ref;
    v.textContent = x.verset ? typo('« ' + x.verset + ' »') : ''; v.hidden = !x.verset;
    let html = ech(typo(x.texte)).replace(MOTS, '<strong>$&</strong>');
    if (anime) { let k = 0; html = html.split(/(<[^>]+>|[ \n]+)/).map((m) => !m || /^[< \n]/.test(m) ? m : `<span class="mot" style="--i:${Math.min(k++, 130)}">${m}</span>`).join(''); }
    d.innerHTML = html;
    $('numero').textContent = t().sujet(i + 1, TOTAL);
    categorie(i);
    for (const e of [th, bl, v]) { e.classList.remove('entree'); if (anime) { void e.offsetWidth; e.classList.add('entree'); } }
    ajuster();
  }
  function categorie(i) {
    const th = sujet(i).theme || ''; $('cat').hidden = !th; if (!th) return;
    let a = i, b = i; while (a > 0 && sujet(a - 1).theme === th) a--; while (b + 1 < TOTAL && sujet(b + 1).theme === th) b++;
    const n = b - a + 1, k = i - a, s = i + 1 < TOTAL ? sujet(i + 1) : null;
    $('cat-n').textContent = t().catN(k + 1, n);
    $('cat-pas').hidden = n < 2 || n > 60;
    $('cat-pas').innerHTML = n < 2 || n > 60 ? '' : Array.from({ length: n }, (_, j) => `<i class="${j < k ? 'ok' : j === k ? 'ici' : ''}"></i>`).join('');
    $('cat-s').textContent = !s ? '' : b > i ? t().catS(s.ref || '') : t().catF(s.theme || '');
  }
  function annoncer(petit, grand, heure) {
    const a = $('annonce'); $('an-s').textContent = petit; $('an-t').textContent = typo(grand); a.classList.toggle('h', !!heure); a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  }
  function changer(i) {
    const premier = vu < 0, avant = vu; vu = i;
    if (premier) { poser(i, true); if (now() - DEBUT < 4000) SON.jouer('heure'); return; }
    // sujet, catégorie ou heure : à chaque passage son bruitage et son annonce
    const heure = i === avant + 1 && i % 12 === 0, cat = sujet(i).theme && sujet(i).theme !== sujet(avant).theme;
    SON.jouer(heure ? 'heure' : cat ? 'categorie' : 'sujet');
    if (heure) annoncer(t().hEn(i / 12 + 1), t().faites(i / 12), true);
    if (cat && heure) { SON.jouer('categorie', 6.5); setTimeout(() => annoncer(t().nouvelle, sujet(vu).theme), 4700); } else if (cat) annoncer(t().nouvelle, sujet(i).theme);
    const s = $('sujet'), ec = $('eclair'); s.classList.add('sort');
    if (window.FEU) window.FEU.souffle = 1;
    ec.classList.remove('go'); void ec.offsetWidth; ec.classList.add('go');
    setTimeout(() => { s.classList.remove('sort'); poser(vu, true); }, 480);
  }
  function permanence(n) {
    const h = Math.floor((n - DEBUT) / 3600000), l = noms(h), reste = DEBUT + (h + 1) * 3600000 - n;
    let j = h + 1; while (j < 48 && JSON.stringify(noms(j)) === JSON.stringify(l)) j++;
    const suite = j < 48 ? joint(noms(j)) : t().fin, rel = reste < 5 * MIN && j === h + 1 && j < 48, s = Math.ceil(reste / 1000), cle = [lang, h, l, suite, rel ? s : ''].join('|');
    if (cle === vuGarde) return; vuGarde = cle;
    $('qui').textContent = joint(l);
    $('garde').classList.toggle('trois', joint(l).length > 30); $('garde').classList.toggle('releve', rel);
    $('apres').textContent = rel ? t().releve(`${Math.floor(s / 60)}:${p2(s % 60)}`, suite) : t().apres(t().h(j % 24), suite);
  }
  function tic() {
    const n = now(), etat = n < DEBUT ? 'attente' : n >= FIN ? 'fin' : 'priere';
    if (etat !== vuEtat) {
      vuEtat = etat; document.body.dataset.etat = etat; $('priere').hidden = etat !== 'priere'; $('attente').hidden = etat === 'priere';
      document.querySelector('.general').hidden = etat !== 'priere';
      $('att-titre').textContent = etat === 'fin' ? t().finT : t().avant; $('att-sous').textContent = etat === 'fin' ? t().finS : t().avantS; $('att-chrono').hidden = etat === 'fin'; $('att-liens').hidden = etat === 'fin';
      if (etat === 'fin' && vu >= 0) SON.jouer('fin');
      if (etat === 'priere') { vu = -1; if (window.FEU) window.FEU.souffle = 1; }
    }
    if (etat === 'attente') $('att-chrono').innerHTML = chiffres(hms(DEBUT - n));
    if (etat === 'priere') {
      const i = Math.floor((n - DEBUT) / PAS), reste = PAS - (n - DEBUT) % PAS, s = Math.ceil(reste / 1000);
      if (i !== vu) changer(i);
      $('general').innerHTML = chiffres(hms(FIN - n));
      $('chrono').textContent = `${Math.floor(s / 60)}:${p2(s % 60)}`;
      const bientot = s <= 30 && i + 1 < TOTAL; document.querySelector('.cadran').classList.toggle('bientot', bientot);
      $('prochain').textContent = bientot ? t().prochain(sujet(i + 1).ref || sujet(i + 1).theme || '') : '';
      permanence(n);
      const hd = (n - DEBUT) / 3600000, h = Math.floor(hd);
      segs.forEach((e, k) => { e.className = k === h ? 'ici' : ''; e.firstChild.style.setProperty('--p', Math.max(0, Math.min(1, hd - k)).toFixed(3)); });
      const cj = `${t().jours[h < 24 ? 0 : 1]}, ${t().heureN(h + 1)}`; if ($('jour').textContent !== cj) $('jour').textContent = cj;
    } else $('jour').textContent = '';
  }
  function anneau() {
    if (vuEtat !== 'priere') return;
    const f = 1 - ((now() - DEBUT) % PAS) / PAS;
    arcs.forEach((a) => a.setAttribute('stroke-dashoffset', (PER * (1 - f)).toFixed(1)));
    tete.setAttribute('transform', `rotate(${(-90 + 360 * f).toFixed(2)} 200 200)`);
  }

  /* ---- bruitages et musique ---- */
  const SON = (() => {
    const M = window.MUSIQUES || {}, L = M.fichiers || [], petit = matchMedia('(max-width:860px),(pointer:coarse)').matches, dispo = !!(L.length || (M.playlist && !petit));
    let marche = false, vol = Number(lire('48h-vol') ?? 60), cloche = lire('48h-cloche') !== '0', mus = true, ctx = null, sortie = null, fen = null, A = null, k = 0;
    const canal = 'BroadcastChannel' in window ? new BroadcastChannel('48h-musique') : null, dire = (o) => canal && canal.postMessage(o);
    if (canal) canal.onmessage = ({ data: d }) => { if (d.ferme) { fen = null; if (marche && mus) { mus = false; etat(); } } };
    $('vol').value = vol;
    function etat() {
      const m = marche && dispo;
      $('son-t').textContent = marche ? t().couper : t().son; $('cloche').hidden = !marche; $('mus').hidden = !m; $('vol-l').hidden = $('suivante').hidden = !m || !mus;
      $('cloche').setAttribute('aria-pressed', cloche); $('mus').setAttribute('aria-pressed', mus); $('son').setAttribute('aria-pressed', marche);
    }
    function musique(oui) {
      if (!dispo) return;
      if (L.length) { if (!oui) { if (A) A.pause(); } else if (A) A.play(); else fichier(0); return; }
      // la playlist YouTube joue dans sa propre fenêtre, derrière l'écran de prière : rien ne s'affiche ici
      if (oui && (!fen || fen.closed)) { fen = open('musique/', 'musique48', 'popup,width=480,height=340,left=20,top=20'); if (!fen) { mus = false; etat(); } } else dire({ cmd: oui ? 'lire' : 'pause' });
    }
    function fichier(i) { k = i % L.length; if (A) A.pause(); A = new Audio(L[k].src); A.volume = vol / 100; A.onended = () => marche && mus && fichier(k + 1); A.play().catch(() => {}); }
    $('son').onclick = () => {
      marche = !marche;
      try { if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); sortie = ctx.createDynamicsCompressor(); sortie.threshold.value = -10; sortie.ratio.value = 6; sortie.connect(ctx.destination); } ctx.resume(); } catch { ctx = null; }
      if (mus) musique(marche);
      etat(); if (marche) jouer('sujet');
    };
    $('mus').onclick = () => { mus = !mus; musique(mus); etat(); };
    $('suivante').onclick = () => L.length ? fichier(k + 1) : dire({ cmd: 'suivante' });
    $('vol').oninput = (e) => { vol = Number(e.target.value); ecrire('48h-vol', vol); dire({ vol }); if (A) A.volume = vol / 100; };
    $('cloche').onclick = () => { cloche = !cloche; ecrire('48h-cloche', cloche ? '1' : '0'); etat(); if (cloche) jouer('sujet'); };
    function jouer(nom, dans = 0) { if (!ctx || !marche || !cloche) return; if (ctx.state !== 'running') ctx.resume(); try { window.SONS.jouer(nom, ctx, sortie, 1, ctx.currentTime + 0.06 + dans); } catch { /* son indisponible */ } }
    // boutons d'essai de l'aperçu : le bruitage seul, sans ouvrir la musique
    document.querySelectorAll('[data-son]').forEach((e) => { e.onclick = () => { if (!marche) { mus = false; $('son').click(); setTimeout(() => jouer(e.dataset.son), 1200); } else jouer(e.dataset.son); }; });
    return { jouer, etat };
  })();

  /* ---- commandes ---- */
  function textes() {
    document.documentElement.lang = lang; document.querySelectorAll('[data-t]').forEach((e) => { e.innerHTML = t()[e.dataset.t]; }); document.querySelectorAll('[data-a]').forEach((e) => { e.title = t()[e.dataset.a]; e.setAttribute('aria-label', t()[e.dataset.a]); });
    $('langue').textContent = lang === 'fr' ? 'EN' : 'FR'; SON.etat(); vuGarde = ''; vuEtat = ''; tic();
  }
  $('langue').onclick = () => { lang = lang === 'fr' ? 'en' : 'fr'; ecrire('48h-lang', lang); textes(); };
  $('plein').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
  const aller = (d) => { if (!apercu) return; const i = Math.floor((now() - DEBUT) / PAS); decal += DEBUT + Math.max(0, Math.min(TOTAL - 1, i + d)) * PAS + 200 - now(); tic(); };
  $('prec').onclick = () => aller(-1); $('suiv').onclick = () => aller(1); $('nav').hidden = !apercu; $('apercu').hidden = !apercu;
  addEventListener('keydown', (e) => { if (e.target.matches('input') || e.ctrlKey || e.metaKey || e.altKey) return; const c = e.key.toLowerCase(); if (c === 'f') $('plein').click(); if (c === 'm') $('son').click(); if (c === 'n' && !$('suivante').hidden) $('suivante').click(); if (c === 'arrowleft') aller(-1); if (c === 'arrowright') aller(1); });
  let dort; const reveil = () => { document.body.classList.remove('calme'); clearTimeout(dort); dort = setTimeout(() => document.body.classList.add('calme'), 7000); };
  ['mousemove', 'touchstart', 'keydown'].forEach((e) => addEventListener(e, reveil, { passive: true })); reveil();
  const eveille = async () => { try { if (document.visibilityState === 'visible') await navigator.wakeLock?.request('screen'); } catch { /* écran non maintenu */ } };
  document.addEventListener('visibilitychange', () => { eveille(); tic(); }); addEventListener('click', eveille); eveille();
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(ajuster, 120); });

  Promise.allSettled([chargerSujets(), document.fonts.ready, Promise.race([chargerGardes(), new Promise((r) => setTimeout(r, 2500))])]).then(() => {
    textes(); setInterval(tic, 250); setInterval(anneau, 100); anneau(); setInterval(chargerGardes, 20000); setInterval(chargerSujets, 120000);
    Promise.all(['600 30px', '700 30px', 'italic 700 30px', 'italic 800 30px'].map((f) => document.fonts.load(f + ' "Barlow Condensed"'))).then(ajuster);
  });
})();
