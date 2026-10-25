// Development server: bundles and serves the app with esbuild, rebuilding on
// changes and reloading the page.
//
//   npm run dev
//
// The app is at http://localhost:3000/ and the browser specs are at
// http://localhost:3000/dev/specs.html

import {join, dirname} from "path"
import {fileURLToPath} from "url"

import * as esbuild from "esbuild"
import {buildAssets} from "./build_assets.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
process.chdir(ROOT)

const generated = buildAssets()
if (generated.length) {
  console.log(`generated ${generated.length} asset file(s)`)
}

const ctx = await esbuild.context({
  entryPoints: {
    main: "static/js/st/main.jsx",
    specs: "static/js/specs.js",
  },
  bundle: true,
  sourcemap: true,
  outdir: "dev/out",
  nodePaths: ["static/js"],
  loader: {".woff": "file", ".woff2": "file"},
  logLevel: "info",
})

await ctx.watch()

const {port} = await ctx.serve({
  servedir: ".",
  fallback: "dev/index.html",
  port: 3000,
})

console.log(`\nSight Reading Trainer: http://localhost:${port}/`)
console.log(`Specs: http://localhost:${port}/dev/specs.html`)
