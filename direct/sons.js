/* Les bruitages, entièrement synthétisés :
   « sujet » : une petite cloche claire · « categorie » : une harpe qui monte · « heure » : trois coups de grande cloche et un souffle · « fin » : heure puis harpe. */
window.SONS = (() => {
  const salles = new WeakMap();
  function salle(c) {
    if (salles.has(c)) return salles.get(c);
    const N = Math.floor(c.sampleRate * 4), b = c.createBuffer(2, N, c.sampleRate);
    for (let k = 0; k < 2; k++) { const d = b.getChannelData(k); let lp = 0; for (let i = 0; i < N; i++) { const t = i / N; lp += (0.5 - 0.42 * t) * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.exp(-6 * t) * Math.min(1, i / (c.sampleRate * 0.02)); } }
    const v = c.createConvolver(); v.buffer = b; const g = c.createGain(); g.gain.value = 0.9; v.connect(g); salles.set(c, { v, g }); return salles.get(c);
  }
  const bus = (c, sortie, vol, humide) => { const s = salle(c), g = c.createGain(), h = c.createGain(); g.gain.value = vol; h.gain.value = humide; g.connect(sortie); g.connect(h).connect(s.v); s.g.disconnect(); s.g.connect(sortie); return g; };
  function note(c, b, t, f, vol, duree, { att = 0.006, type = 'sine', vers = null, pan = 0 } = {}) {
    const o = c.createOscillator(), e = c.createGain(), p = c.createStereoPanner(); o.type = type; o.frequency.setValueAtTime(f, t); if (vers) o.frequency.exponentialRampToValueAtTime(vers, t + duree);
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(vol, t + att); e.gain.exponentialRampToValueAtTime(0.0001, t + duree); p.pan.value = pan;
    o.connect(e).connect(p).connect(b); o.start(t); o.stop(t + duree + 0.05);
  }
  function souffle(c, b, t, vol, duree, f1, f2) {
    const N = Math.floor(c.sampleRate * duree), buf = c.createBuffer(1, N, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), e = c.createGain(); s.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.1; f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + duree * 0.7);
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(vol, t + duree * 0.62); e.gain.exponentialRampToValueAtTime(0.0001, t + duree); s.connect(f).connect(e).connect(b); s.start(t);
  }
  const J = {
    sujet(c, s, t, v) {
      const b = bus(c, s, 0.26 * v, 0.35);
      for (const [dt, f, k] of [[0, 587.33, 0.8], [0.17, 880, 1]]) for (const [m, g, d] of [[1, 1, 3.2], [2.004, 0.38, 2.1], [3.01, 0.17, 1.3], [4.17, 0.07, 0.8]]) note(c, b, t + dt, f * m, g * k, d);
    },
    categorie(c, s, t, v) {
      const b = bus(c, s, 0.24 * v, 0.6);
      souffle(c, b, t, 0.22, 1.5, 500, 5200);
      [293.66, 369.99, 440, 587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => { const d = t + 0.12 + i * 0.105, pan = -0.6 + i * 0.17; for (const [m, g, l] of [[1, 0.85, 3.4], [2, 0.3, 1.9], [3, 0.14, 1.1], [5.02, 0.04, 0.5]]) note(c, b, d, f * m, g * (0.75 + i * 0.04), l, { att: 0.004, pan }); });
      [[1.15, 587.33], [1.15, 880], [1.15, 1174.66]].forEach(([d, f], i) => note(c, b, t + d, f, 0.42, 4.2, { att: 0.02, pan: (i - 1) * 0.4 }));
    },
    heure(c, s, t, v) {
      const b = bus(c, s, 0.34 * v, 0.55);
      [0, 2.1, 4.2].forEach((d, k) => { const q = k === 2 ? 1.12 : 0.9; for (const [m, g, l] of [[0.5, 0.75, 7], [1, 1, 6], [1.2, 0.5, 4.6], [1.5, 0.36, 4], [2, 0.58, 3.6], [2.52, 0.2, 2.4], [3.01, 0.15, 1.8], [4.1, 0.08, 1.1]]) note(c, b, t + d, 196 * m, g * q * 0.62, l, { att: 0.008 }); });
      souffle(c, b, t + 2.6, 0.3, 3.6, 180, 2400);
      [146.83, 220, 293.66, 440].forEach((f, i) => note(c, b, t + 4.2, f, 0.3, 7, { att: 0.9, pan: (i - 1.5) * 0.35 }));
    },
    fin(c, s, t, v) { J.heure(c, s, t, v); J.categorie(c, s, t + 6, v); },
  };
  return { jouer(nom, c, sortie, vol, quand) { (J[nom] || J.sujet)(c, sortie, quand ?? c.currentTime + 0.06, vol); } };
})();
