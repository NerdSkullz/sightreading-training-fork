// Production build: bundles and minifies the app into dist/, ready to be
// served by any static file host.
//
//   npm run build
//   BASE_PATH=/repo-name/ npm run build   # when served from a sub-path
//
// The app uses client side routing, so unknown paths should fall back to
// index.html (a copy is written to 404.html for hosts like GitHub Pages that
// serve that file for missing paths).

import {join, dirname} from "path"
import {fileURLToPath} from "url"
import {rmSync, mkdirSync, cpSync, readdirSync, readFileSync, writeFileSync} from "fs"

import * as esbuild from "esbuild"
import {buildAssets} from "./build_assets.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
process.chdir(ROOT)

const DIST = "dist"

// the path the site is served from, with leading and trailing slashes
const BASE_PATH = `/${process.env.BASE_PATH || ""}/`.replace(/\/+/g, "/")

// static files that are requested at runtime
const STATIC_DIRS = ["img", "music", "soundfonts", "svg"]

buildAssets()

rmSync(DIST, {recursive: true, force: true})
mkdirSync(join(DIST, "static/guides"), {recursive: true})

const result = await esbuild.build({
  entryPoints: ["static/js/st/main.jsx"],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: "es2020",
  entryNames: "[name]-[hash]",
  assetNames: "assets/[name]-[hash]",
  outdir: join(DIST, "static"),
  nodePaths: ["static/js"],
  loader: {".woff": "file", ".woff2": "file"},
  define: {ST_BASE_PATH: JSON.stringify(BASE_PATH)},
  metafile: true,
  logLevel: "warning",
})

for (const dir of STATIC_DIRS) {
  cpSync(join("static", dir), join(DIST, "static", dir), {recursive: true})
}

cpSync("static/manifest.json", join(DIST, "static/manifest.json"))

for (const file of readdirSync("static/guides").filter(f => f.endsWith(".json"))) {
  cpSync(join("static/guides", file), join(DIST, "static/guides", file))
}

// find the hashed bundle names to reference from the page
const outputs = Object.keys(result.metafile.outputs).map(f => BASE_PATH + f.slice(DIST.length + 1))
const mainJs = outputs.find(f => /\/main-\w+\.js$/.test(f))
const mainCss = outputs.find(f => /\/main-\w+\.css$/.test(f))

const html = readFileSync("dev/index.prod.html", "utf8")
  .replace("{{main_css}}", mainCss)
  .replace("{{main_js}}", mainJs)
  .replaceAll("{{base}}", BASE_PATH)

writeFileSync(join(DIST, "index.html"), html)
writeFileSync(join(DIST, "404.html"), html)

console.log(`built ${DIST}/ for ${BASE_PATH} (${mainJs}, ${mainCss})`)
