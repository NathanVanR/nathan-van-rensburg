/* The codex engine.
   Desktop: two-page spreads, the right (or left) leaf turns in 3D.
   Phone:   one page at a time, the same leaf turns from the spine; swipe or tap the corner.
   Pages are an ordered list [S0.L, S0.R, S1.L, ...]; `p` is the current page index. */
(function () {
  function createBook(o) {
    const root = o.root;
    const L = root.querySelector('.page.left'), R = root.querySelector('.page.right');
    const prevB = root.querySelector('.corner.p'), nextB = root.querySelector('.corner.n');
    const pages = []; o.spreads.forEach(s => { pages.push(s.L, s.R); });
    const html = i => `<div class="pg">${pages[i]()}</div>`;
    const mq = matchMedia('(max-width:780px)');
    const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
    let p = o.start || 0, busy = false, single = mq.matches;

    const nav = t => (o.onNavigate ? o.onNavigate(t) : go(t));
    const step = () => (single ? 1 : 2);

    function setState(el, state) { el.classList.remove('drawn', 'static'); void el.offsetWidth; if (state) el.classList.add(state); }
    function fill(el, i, state) { el.innerHTML = html(i); setState(el, state); }

    function render(st = {}) {
      single = mq.matches; root.classList.toggle('single', single);
      if (single) { fill(R, p, st.R === undefined ? 'drawn' : st.R); L.innerHTML = ''; }
      else {
        p = 2 * (p >> 1);
        fill(L, p, st.L === undefined ? 'drawn' : st.L);
        fill(R, p + 1, st.R === undefined ? 'drawn' : st.R);
      }
      bind(); mark();
    }

    function mark() {
      const si = p >> 1;
      if (o.ribbons) o.ribbons.querySelectorAll('button').forEach((b, i) => {
        b.classList.toggle('on', i === si);
        if (i === si && single) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      });
      if (prevB) prevB.disabled = p <= 0;
      if (nextB) nextB.disabled = p >= pages.length - (single ? 1 : 2);
      if (o.counter) o.counter.textContent = single ? `leaf ${p + 1} of ${pages.length}` : `spread ${si + 1} of ${pages.length >> 1}`;
      if (o.onTurn) o.onTurn(p, single);
    }

    function bind() {
      root.querySelectorAll('[data-go]').forEach(el => {
        el.onclick = () => nav(2 * o.spreads.findIndex(s => s.id === el.dataset.go));
      });
    }

    function go(t) {
      if (busy) return;
      single = mq.matches;
      if (single) {
        t = Math.max(0, Math.min(pages.length - 1, t));
        if (t === p) return;
        if (reduced()) { p = t; render(); return; }
        flip(t, true);
      } else {
        const si = Math.max(0, Math.min((pages.length >> 1) - 1, t >> 1));
        if (si === (p >> 1)) return;
        if (reduced()) { p = 2 * si; render(); return; }
        flip(2 * si, false);
      }
    }

    function flip(t, isSingle) {
      busy = true;
      const dir = t > p ? 1 : -1;
      const leaf = document.createElement('div');
      const verso = '<div class="face rev"><div class="page verso"></div></div>';
      const shade = '<div class="shade"></div>';
      if (isSingle) {
        leaf.className = 'leaf single';
        if (dir === 1) {
          fill(R, t, '');                                           // the page revealed beneath, not yet drawn
          leaf.innerHTML = `<div class="face"><div class="page right static">${html(p)}</div>${shade}</div>${verso}`;
          root.appendChild(leaf); leaf.getBoundingClientRect();
          leaf.style.transform = 'rotateY(-180deg)';
        } else {
          leaf.innerHTML = `<div class="face"><div class="page right static">${html(t)}</div>${shade}</div>${verso}`;
          leaf.style.transition = 'none'; leaf.style.transform = 'rotateY(-180deg)';
          root.appendChild(leaf); leaf.getBoundingClientRect();
          leaf.style.transition = ''; leaf.style.transform = 'rotateY(0deg)';
        }
      } else if (dir === 1) {
        leaf.className = 'leaf fwd';
        fill(R, t + 1, '');
        leaf.innerHTML = `<div class="face"><div class="page right static">${html(p + 1)}</div>${shade}</div><div class="face rev"><div class="page left static">${html(t)}</div></div>`;
        root.appendChild(leaf); leaf.getBoundingClientRect();
        leaf.style.transform = 'rotateY(-180deg)';
      } else {
        leaf.className = 'leaf back';
        fill(L, t, '');
        leaf.innerHTML = `<div class="face"><div class="page left static">${html(p)}</div>${shade}</div><div class="face rev"><div class="page right static">${html(t + 1)}</div></div>`;
        root.appendChild(leaf); leaf.getBoundingClientRect();
        leaf.style.transform = 'rotateY(180deg)';
      }
      const done = () => {
        if (!busy) return;
        p = t;
        // the page that rode on the leaf is already fully drawn; only the revealed page draws itself in
        render(isSingle ? (dir === 1 ? {} : { R: 'static' }) : (dir === 1 ? { L: 'static' } : { R: 'static' }));
        leaf.remove(); busy = false;
        if (o.onSettled) o.onSettled(p);
      };
      leaf.addEventListener('transitionend', e => { if (e.target === leaf) done(); });
      setTimeout(done, 1500);
    }

    if (o.ribbons) {
      o.ribbons.innerHTML = o.spreads.map((s, i) => `<button data-i="${i}">${s.label}</button>`).join('');
      o.ribbons.addEventListener('click', e => { const b = e.target.closest('button'); if (b) nav(2 * +b.dataset.i); });
    }
    if (prevB) prevB.onclick = () => nav(p - step());
    if (nextB) nextB.onclick = () => nav(p + step());
    if (o.keys !== false) addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,textarea')) return;
      if (e.key === 'ArrowRight') nav(p + step());
      if (e.key === 'ArrowLeft') nav(p - step());
    });
    let sx = 0, sy = 0;
    root.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    root.addEventListener('touchend', e => {
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dy) < Math.abs(dx) * 0.6) nav(dx < 0 ? p + step() : p - step());
    }, { passive: true });
    mq.addEventListener('change', () => { if (!busy) render(); });

    render(o.lazy ? { L: '', R: '' } : {});   // lazy: pages wait undrawn until reveal()
    return {
      go, nav, render, reveal: () => render(),
      get page() { return p; }, get busy() { return busy; },
      get single() { return single; }, get count() { return pages.length; }
    };
  }
  window.createBook = createBook;
})();
