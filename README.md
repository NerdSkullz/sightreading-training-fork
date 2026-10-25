# Sight Reading Trainer

## <https://nerdskullz.github.io/sightreading-training-fork/>

![build and deploy](https://github.com/NerdSkullz/sightreading-training-fork/actions/workflows/pages.yml/badge.svg)

[![Twitch Link](http://leafo.net/dump/twitch-banner.svg)](https://www.twitch.tv/moonscript)

A tool for practicing sight reading, learning songs, and training other musical skills in your browser. The successor to <https://github.com/leafo/mursic>.

Learn more on [the guide](https://nerdskullz.github.io/sightreading-training-fork/about).

This is a frontend-only fork of
[leafo/sightreading.training](https://github.com/leafo/sightreading.training),
with the backend removed so it can be hosted as a static site.

![screenshot](http://leafo.net/shotsnb/2016-05-14_16-30-55.png)

## Development

The app is a static React frontend with no backend. All you need is Node:

```bash
npm install
npm run dev
```

Then open <http://localhost:3000/>. The dev server bundles with esbuild,
watches for changes, and reloads the page automatically. The browser specs are
at <http://localhost:3000/dev/specs.html>.

Run `npm run lint` to lint the JavaScript.

## Building

```bash
npm run build
```

This writes a minified, self-contained site to `dist/` that can be served by
any static file host. Unknown paths should fall back to `index.html` so
client-side routes like `/about` work on reload (`dist/404.html` is a copy of
`index.html` for hosts such as GitHub Pages). To serve the site from a
sub-path, set `BASE_PATH`, eg. `BASE_PATH=/my-repo/ npm run build`.

## Deployment

Every push to `master` is built and published to GitHub Pages by
`.github/workflows/pages.yml`, which sets `BASE_PATH` to the repository's
Pages path. Other branches and pull requests are built but not published.
