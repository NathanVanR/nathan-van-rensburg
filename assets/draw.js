/* Line-art generators: every stroke carries pathLength=1 so CSS can "draw" it
   (stroke-dashoffset 1 -> 0) with a per-element delay (--d). */
(function () {
  const SQ3 = 1.7320508;
  const f = n => +n.toFixed(2);
  const seq = (base, inc) => { let k = 0; return () => `style="--d:${(base + k++ * inc).toFixed(2)}s"`; };
  const P  = (d, D, cls = '') => `<path class="ln ${cls}" pathLength="1" ${D()} d="${d}"/>`;
  const C  = (cx, cy, r, D, cls = '') => `<circle class="ln ${cls}" pathLength="1" ${D()} cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`;
  const Ln = (x1, y1, x2, y2, D, cls = '') => P(`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`, D, cls);
  const polar = (cx, cy, r, deg) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];
  const GLASS = ['#8c1c2c', '#1f3a7a', '#d99a2b', '#1f5a45', '#5a2d6e', '#b8341f'];

  // equilateral pointed arch: straight sides from ground gy up to the springing line by, half-width w
  function arch(cx, by, w, gy) {
    const apex = by - w * SQ3;
    return `M${f(cx - w)} ${f(gy)}V${f(by)}A${f(2 * w)} ${f(2 * w)} 0 0 1 ${f(cx)} ${f(apex)}A${f(2 * w)} ${f(2 * w)} 0 0 1 ${f(cx + w)} ${f(by)}V${f(gy)}`;
  }

  /* ----- west front of a cathedral, drawn stroke by stroke ----- */
  function facade() {
    const D = seq(0, 0.022);
    let s = '<svg class="facade" viewBox="0 0 300 340" aria-hidden="true">';
    s += P('M8 320H292', D, 'g');
    for (const cx of [60, 240]) {                       // the two towers
      s += P(`M${cx - 32} 320V112H${cx + 32}V320`, D);
      s += P(`M${cx - 32} 112L${cx} 22L${cx + 32} 112`, D);
      s += P(`M${cx} 22L${cx - 12} 112M${cx} 22L${cx + 12} 112`, D, 'g');
      s += P(`M${cx} 22V9M${cx - 4} 14H${cx + 4}`, D, 'r');
      s += P(arch(cx, 142, 9, 176), D);
      s += P(`M${cx - 32} 200H${cx + 32}M${cx - 32} 250H${cx + 32}`, D, 'g');
      s += P(arch(cx, 285, 11, 320), D);
    }
    s += P('M28 320V200L22 194V320M272 320V200L278 194V320', D, 'g');      // buttresses
    s += P('M92 150L150 82L208 150', D);                                    // gable
    s += P('M150 82V64M143 72H157', D, 'r');
    s += P('M92 224H208M92 258H208', D, 'g');
    for (let i = 0; i < 6; i++) s += P(arch(107.5 + i * 17, 240, 6, 252), D); // gallery
    // rose window
    s += C(150, 185, 32, D); s += C(150, 185, 11, D);
    for (let i = 0; i < 12; i++) { const a = polar(150, 185, 11, i * 30), b = polar(150, 185, 32, i * 30); s += Ln(a[0], a[1], b[0], b[1], D, 'g'); }
    for (let i = 0; i < 12; i++) {
      const [x, y] = polar(150, 185, 21.5, i * 30 + 15);
      s += C(x, y, 4.2, D);
      s += `<circle class="fillin" style="--d:${(2.2 + i * .08).toFixed(2)}s" cx="${f(x)}" cy="${f(y)}" r="3.6" fill="${GLASS[i % 6]}"/>`;
    }
    s += `<circle class="fillin" style="--d:3s" cx="150" cy="185" r="9" fill="#e6c36a"/>`;
    // portals
    s += P(arch(150, 286, 24, 320), D); s += P(arch(150, 292, 19, 320), D, 'g'); s += P(arch(150, 300, 12, 320), D);
    s += P('M150 320V290', D, 'g'); s += C(150, 272, 5, D, 'r');
    s += `<path class="fillin" style="--d:2.8s" stroke="none" fill="rgba(122,31,31,.16)" d="${arch(150, 300, 12, 320)}Z"/>`;
    return s + '</svg>';
  }

  /* ----- the nave in one-point perspective, arches receding toward a rose window ----- */
  function nave() {
    const VX = 400, VY = 250, K = 7;
    const S = k => 1 / (1 + k * 0.62);
    const aw = k => 140 * S(k), sp = k => VY - 50 * S(k), fl = k => VY + 170 * S(k), ap = k => sp(k) - aw(k) * SQ3;
    let s = '<svg class="nave" viewBox="0 -90 800 610" aria-hidden="true">';
    for (let k = 0; k < K; k++) {
      const D = seq(k * 0.24, 0.03), w = aw(k), sy = sp(k), fy = fl(k);
      s += P(arch(VX, sy, w, fy), D);
      s += P(arch(VX, sy, w * 0.86, fy), D, 'g');
      s += Ln(VX - w - 7 * S(k), sy, VX - w + 7 * S(k), sy, D) + Ln(VX + w - 7 * S(k), sy, VX + w + 7 * S(k), sy, D);
      s += Ln(VX - w, fy, VX + w, fy, D, 'g');
      if (k < K - 1) {
        const w2 = aw(k + 1), sy2 = sp(k + 1), fy2 = fl(k + 1), sm = (S(k) + S(k + 1)) / 2;
        const bossY = VY - 50 * sm - 140 * sm * SQ3;
        s += Ln(VX - w, sy, VX - w2, sy2, D) + Ln(VX + w, sy, VX + w2, sy2, D);
        s += Ln(VX - w, fy, VX - w2, fy2, D) + Ln(VX + w, fy, VX + w2, fy2, D);
        s += Ln(VX, ap(k), VX, ap(k + 1), D, 'g');
        s += P(`M${f(VX - w)} ${f(sy)}L${VX} ${f(bossY)}L${f(VX + w2)} ${f(sy2)}`, D, 'g');
        s += P(`M${f(VX + w)} ${f(sy)}L${VX} ${f(bossY)}L${f(VX - w2)} ${f(sy2)}`, D, 'g');
      }
    }
    const D = seq(1.6, 0.03);
    s += Ln(VX - 46, fl(0), VX - 46 * S(K), fl(K), D, 'g') + Ln(VX + 46, fl(0), VX + 46 * S(K), fl(K), D, 'g');
    // the far rose
    const ry = sp(K - 1) - 12, rr = 11;
    s += C(VX, ry, rr, D) + C(VX, ry, rr * 0.4, D);
    for (let i = 0; i < 8; i++) { const a = polar(VX, ry, rr * 0.4, i * 45), b = polar(VX, ry, rr, i * 45); s += Ln(a[0], a[1], b[0], b[1], D, 'g'); }
    for (let i = 0; i < 8; i++) { const [x, y] = polar(VX, ry, rr * 0.7, i * 45 + 22.5); s += `<circle class="fillin" style="--d:${(2.4 + i * .1).toFixed(2)}s" cx="${f(x)}" cy="${f(y)}" r="2" fill="${GLASS[i % 6]}"/>`; }
    s += `<circle class="fillin nave-glow" style="--d:2.4s" cx="${VX}" cy="${ry}" r="46" fill="url(#roseglow)" stroke="none"/>`;
    s = s.replace('<svg class="nave" viewBox="0 -90 800 610" aria-hidden="true">',
      '<svg class="nave" viewBox="0 -90 800 610" aria-hidden="true"><defs><radialGradient id="roseglow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>');
    return s + '</svg>';
  }

  /* ----- small spot illustrations ----- */
  const ICONS = {
    quill:  d => P('M52 8C38 10 22 24 16 44l-4 12 12-4c20-6 34-22 28-44z', d) + P('M16 44L40 20M28 36l8 2M34 28l8 2M22 42l-6 -2', d, 'g'),
    book:   d => P('M32 18C24 12 14 12 6 14v36c8-2 18-2 26 4 8-6 18-6 26-4V14c-8-2-18-2-26 4z', d) + P('M32 18v36', d, 'g'),
    arch:   d => P('M18 58V34A28 28 0 0 1 32 9.8A28 28 0 0 1 46 34V58', d) + P('M24 58V37A16 16 0 0 1 32 23.1A16 16 0 0 1 40 37V58', d, 'g') + P('M32 23V58', d, 'g'),
    rose:   d => { let s = C(32, 32, 24, d) + C(32, 32, 9, d); for (let i = 0; i < 12; i++) { const a = polar(32, 32, 9, i * 30), b = polar(32, 32, 24, i * 30); s += Ln(a[0], a[1], b[0], b[1], d, 'g'); } for (let i = 0; i < 12; i++) { const [x, y] = polar(32, 32, 16.5, i * 30 + 15); s += C(x, y, 3.2, d); } return s; },
    ladder: d => P('M20 6V58M44 6V58', d) + P('M20 16H44M20 28H44M20 40H44M20 52H44', d, 'g') + P('M12 60H52', d, 'g'),
    candle: d => P('M25 30h14v28H25z', d) + P('M32 30V23', d, 'g') + P('M32 23C26 17 33 13 32 5c6 6 1 12 0 18', d, 'r')
  };
  function icon(name, base = 0.2) {
    const D = seq(base, 0.07);
    return `<svg class="ico" viewBox="0 0 64 64" aria-hidden="true">${ICONS[name](D)}</svg>`;
  }
  function flourish() {
    const D = seq(0.4, 0.15);
    return `<svg class="flourish" viewBox="0 0 240 16" aria-hidden="true">${P('M0 8H98', D)}${P('M142 8H240', D)}${P('M108 8L120 1L132 8L120 15Z', D, 'g')}${C(100, 8, 1.6, D, 'g')}${C(140, 8, 1.6, D, 'g')}</svg>`;
  }

  window.DRAW = { facade, nave, icon, flourish, arch };
})();
