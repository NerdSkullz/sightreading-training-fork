import App from "st/components/app"

import * as React from "react"

import { createRoot } from "react-dom/client";

let root = null

function getRoot() {
  root ||= createRoot(document.getElementById("page"));
  return root;
}

export function init() {
  getRoot().render(<App />)
}
