/*global ga, ST_BASE_PATH*/

// path the app is served from, set at build time (eg. "/repo-name/" on GitHub
// Pages), always starts and ends with a slash
export const BASE_PATH = typeof ST_BASE_PATH !== "undefined" ? ST_BASE_PATH : "/"

// assetUrl("/static/img/logo.svg") -> "/repo-name/static/img/logo.svg"
export function assetUrl(path) {
  return BASE_PATH + path.replace(/^\//, "")
}

export function setTitle(title) {
  if (title) {
    document.title = `${title} | Sight Reading Trainer`
  } else {
    document.title = "Sight Reading Trainer"
  }
}

export function gaEvent(category, action, label, value, interactive=true) {
  let opts = {
    hitType: "event",
    eventCategory: category,
    eventAction: action,
    eventLabel: label,
    eventValue: value,
  }

  if (!interactive) {
    opts.nonInteraction = 1
  }

  try {
    if (window.ga) {
      ga("send", opts)
    } else {
      // console.log("ga:", opts)
    }
  } catch (e) {}
}

