# The Games Room

A small React app (Vite, installable PWA) with Go and a word search. No backend: everything runs in the
browser, and puzzles you make are shared as links.

```
npm install
npm run dev        # http://localhost:5600
npm test           # Go rules and word search engine tests
npm run build      # outputs dist/ (relative paths, so it works under /games/)
```

- `src/go/` rules engine (captures, ko, territory scoring), board, game screens
- `src/wordsearch/` seeded generator, play screen, puzzle maker, share links
- Routes use the URL hash (`#/go`, `#/ws/...`), so GitHub Pages needs no 404 trick.

## Publishing at natevr.net/games

The site is served by GitHub Pages from the repo root. To add `/games`, switch **Settings > Pages > Source** to
**GitHub Actions** and use a workflow that builds this app and copies it next to the site:

```yaml
name: Deploy site
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: apps/games/package-lock.json }
      - run: npm ci && npm test && npm run build
        working-directory: apps/games
      - run: |
          mkdir _site
          cp -r index.html assets CNAME _site/
          cp -r apps/games/dist _site/games
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

## Installing on an iPad or iPhone

Safari supports this: open the site, tap **Share**, then **Add to Home Screen**. Safari shows no install banner,
which is why it can look like it is missing. Chrome is not needed.
