/* The words. One source of truth for all three hybrid drafts. */
(function () {
  const I = DRAW.icon, F = DRAW.flourish;
  const rise = (n, html) => `<div class="rise" style="--d:${(3.0 + n * 0.25).toFixed(2)}s">${html}</div>`;

  window.CONTENT = [
    { id: 'prologue', label: 'Prologue',
      L: () => `<div class="title-page">${DRAW.facade()}
          <h1 class="write">Nathan<br>van Rensburg</h1>
          ${rise(1, `<p class="sub">A repository of sketches, scripts, and slow labor.</p>`)}
          ${F()}
          ${rise(3, `<p class="meta">Software maker · South Africa<br><span class="todo">your city / one-line tagline</span></p>`)}
        </div><div class="folio">i</div>`,
      R: () => `<div class="kicker">Table of Contents</div><h2 class="write">The Ledger</h2>
        <ol class="toc">
          <li data-go="works"><span class="num">I.</span><span class="name">Works<small>Vouchr · FNB DataQuest</small></span><span class="dots"></span><span class="pg-no">3</span></li>
          <li data-go="chronicle"><span class="num">II.</span><span class="name">Chronicle<small>Essays, and Steel &amp; Scrolls</small></span><span class="dots"></span><span class="pg-no">5</span></li>
          <li data-go="scholar"><span class="num">III.</span><span class="name">The Scholar<small>Education &amp; craft</small></span><span class="dots"></span><span class="pg-no">7</span></li>
          <li data-go="misc"><span class="num">IV.</span><span class="name">Miscellany<small>Loves, hobbies, and the like</small></span><span class="dots"></span><span class="pg-no">9</span></li>
          <li data-go="colophon"><span class="num">V.</span><span class="name">Colophon<small>Correspondence &amp; how this was made</small></span><span class="dots"></span><span class="pg-no">11</span></li>
        </ol>
        <div class="marg rise" style="--d:2.6s">Turn the page, traveler &mdash;<br>swipe, tap the corner, or pick a ribbon.</div>
        <div class="folio">ii</div>` },

    { id: 'works', label: 'Works',
      L: () => `${I('arch')}<div class="kicker">Book I · Works</div><h2 class="write">Vouchr</h2>
        <p class="meta">Charity coordination platform · <b>Live</b> · React, Spring Boot, PostgreSQL</p>
        <p class="initial">A coordination platform for South African charities. Organisations run projects &mdash; a feeding scheme, a glasses drive &mdash; while staff register the people they help, capture witnessed POPIA consent, group them into families and refer them on to partner organisations.</p>
        <p>Built end to end: a React PWA, a Spring Boot API, a Liquibase-managed schema, Supabase authentication, and a consent contract that seals itself into a hashed PDF.</p>
        <p><a href="https://vouchr.natevr.net">Enter Vouchr &rarr;</a> &nbsp;·&nbsp; <a href="https://vouchr.natevr.net/demo">Try the demo &rarr;</a></p>
        <div class="folio">3</div>`,
      R: () => `<div class="kicker">&nbsp;</div><h2 class="write" style="margin-top:58px">FNB DataQuest</h2>
        <p class="meta">Hackathon · Collaborative filtering · Python, Pandas, NumPy, scikit-learn</p>
        <p class="initial">A recommender built for the FNB DataQuest hackathon, shaped after the matrix-factorisation approach of the Netflix Prize. It studied historic transaction behaviour to predict and rank the five financial products a customer would reach for next.</p>
        <p><a href="https://github.com/NathanVanR/fnb-data-quest" target="_blank">View on GitHub &rarr;</a></p>
        ${F()}
        <p class="meta" style="text-align:center">Further volumes rest on the shelf, to be taken down in due season.</p>
        <div class="folio">4</div>` },

    { id: 'chronicle', label: 'Chronicle',
      L: () => `${I('quill')}<div class="kicker">Book II · Chronicle</div><h2 class="write">Letters &amp; Essays</h2>
        <p class="meta">Occasional writing</p>
        <p class="initial">The pen is dry, but the inkwell is full. Posts will appear here now and then &mdash; notes from building things, and from reading old books.</p>
        ${F()}
        <ul class="plain"><li><span class="todo">First entry &mdash; coming soon</span></li></ul>
        <div class="marg">Each post a real page, with a real link.</div>
        <div class="folio">5</div>`,
      R: () => `<div class="kicker">&nbsp;</div><h2 class="write" style="margin-top:58px">Steel &amp; Scrolls</h2>
        <p class="meta">A YouTube channel · Literature &amp; the cinematic frame</p>
        <p class="initial">Inquiries into classical literature and the cinematic frame &mdash; where the sword meets the pen.</p>
        <p><a href="https://www.youtube.com/@nvanrensburg" target="_blank">Watch on YouTube &rarr;</a></p>
        <div class="folio">6</div>` },

    { id: 'scholar', label: 'The Scholar',
      L: () => `${I('book')}<div class="kicker">Book III · The Scholar</div><h2 class="write">Formal Education</h2>
        <p class="meta"><span class="todo">Degree, institution, years</span></p>
        <p class="initial"><span class="todo">A line or two about what you studied, what you loved, and any distinctions.</span></p>
        <ul class="plain"><li><span class="todo">Qualification &middot; Institution &middot; Year</span></li><li><span class="todo">Certification &middot; Issuer &middot; Year</span></li></ul>
        <div class="folio">7</div>`,
      R: () => `<div class="kicker">&nbsp;</div><h2 class="write" style="margin-top:58px">The Craft</h2>
        <p class="meta">Tools of the trade</p>
        <h3>Building</h3><div class="chips"><span>Java</span><span>Spring Boot</span><span>React</span><span>PostgreSQL</span><span>Liquibase</span></div>
        <h3>Data</h3><div class="chips"><span>Python</span><span>Pandas</span><span>NumPy</span><span>scikit-learn</span></div>
        <h3>Shipping</h3><div class="chips"><span>Docker</span><span>Google Cloud Run</span><span>GitHub Actions</span><span>Supabase Auth</span></div>
        <div class="folio">8</div>` },

    { id: 'misc', label: 'Miscellany',
      L: () => `${I('rose')}<div class="kicker">Book IV · Miscellany</div><h2 class="write">Loves &amp; Pursuits</h2>
        <p class="initial">I am happiest in stone and silence &mdash; a cathedral nave, a library with a ladder on rails, a gothic spire in fog.</p>
        <ul class="plain cols"><li>Cathedrals &amp; gothic architecture</li><li>Old libraries</li><li>Classical literature</li><li>Cinema</li><li><span class="todo">hobby</span></li><li><span class="todo">hobby</span></li></ul>
        <div class="folio">9</div>`,
      R: () => `${I('ladder')}<div class="kicker">&nbsp;</div><h2 class="write">Marginalia</h2>
        <p class="meta">Things in the margins</p>
        <p><span class="todo">Currently reading &middot; listening &middot; building</span></p>
        <div class="marg">&ldquo;Ink on paper is the only truth.&rdquo;</div>
        <p class="meta" style="margin-top:1rem">Sketches &amp; verse &mdash; resting in the drawer for now.</p>
        <div class="folio">10</div>` },

    { id: 'colophon', label: 'Colophon',
      L: () => `${I('candle')}<div class="kicker">Book V · Colophon</div><h2 class="write">Correspondence</h2>
        <p class="initial">Letters are welcome. <span class="todo">email / contact method</span></p>
        <ul class="plain"><li><a href="https://github.com/NathanVanR" rel="me">GitHub</a></li><li><a href="https://www.youtube.com/@nvanrensburg">YouTube</a></li></ul>
        <div class="folio">11</div>`,
      R: () => `<div class="kicker">&nbsp;</div><h2 class="write" style="margin-top:58px">How this was made</h2>
        <p>Set in EB Garamond and IM Fell English. Built with React. Constructed in the tradition of digital minimalism &mdash; no trackers, no cookies, just text.</p>
        ${F()}
        <div class="marg">Finis coronat opus.</div>
        <div class="folio">12</div>` }
  ];
})();
