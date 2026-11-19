const fs = require("node:fs");
const path = require("node:path");
const { Parser } = require("htmlparser2");
const site = require("../_data/site");
const { stripUniversalAnalytics } = require("./legacy-analytics");

const siteHosts = new Set([new URL(site.url).hostname, "www.danvoronov.com"]);
const oldSiteHosts = new Set(["dan.kiev.ua", "www.dan.kiev.ua"]);
const archivePage = /^\/articles\/(?:\d{4}\/|category\/|tag\/).*\/index\.html$/;
const archiveAliases = new Map([
  ["/ru/", "/articles/"],
  ["/prj/", "/startups/"],
  ["/readed/", "/studied/"],
  ["/prochital/", "/studied/"],
  ["/ru/87/", "/87/"],
  ["/articles/87/", "/87/"],
  ["/kievpohod", "/prj/kievpohod/"],
  ["/theater/", "/art/theater/"],
  ["/soshenko33/", "/prj/soshenko33/"],
  ["/whereismygranny/", "/prj/whereismygranny/"],
  ["/articles/blog/index.html", "/articles/"],
  ["/articles/ru/index.html", "/articles/"],
  ["/articles/2008/03/27/kyiv-minicamp-Март/index.html", "/articles/2008/03/27/kyiv-minicamp-march/"],
  ["/articles/2008/03/29/moya-prezentaciya-na-kyiv-minicamp-Март/index.html", "/articles/2008/03/29/moya-prezentaciya-na-kyiv-minicamp-march/"],
  ["/articles/2008/08/30/kyiv-minicamp-Август-online-video/index.html", "/articles/2008/08/30/kyiv-minicamp-august-online-video/"],
  ["/articles/2010/01/19/chem-zaniМайutsya-prakticheskie-psihologi/index.html", "/articles/2010/01/19/chem-zanimayutsya-prakticheskie-psihologi/"],
  ["/ru/kievpohod/", "/prj/kievpohod/"],
  ["/ru/favicon.ico", "/favicon.ico"],
  ["/ru/files/NeTolkoOdinocestvo_SbornikRasskazov_(DanVoronov).pdf", "/dan-files/my/NeTolkoOdinocestvo_SbornikRasskazov_(DanVoronov).pdf"]
]);
const unavailablePlugin = /^\/ru\/dan-wpdata\/plugins\/(?:accesspress-social-share|daves-wordpress-live-search|easy-fancybox|top-10)\//;
const unavailableThemeFile = /^\/ru\/dan-wpdata\/themes\/dan-kiev-ua\/(?:header\.css|includes\/js\/(?:jquery\.easing\.min|loopedSlider)\.js)$/;
const referenceAttributes = {
  a: ["href"], link: ["href"], script: ["src"], iframe: ["src"],
  img: ["src", "data-lazy-src", "data-src"], source: ["src"], video: ["src", "poster"],
  audio: ["src"], embed: ["src"], object: ["data"]
};

function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function pageRoute(value) {
  return value.replace(/\/index\.html$/, "/");
}

function removeMissingReference(tag, attributes, pathname) {
  if (tag === "link") {
    return ["pingback", "edituri"].includes(attributes.rel?.toLowerCase()) ||
      pathname === "/articles/feed/index.rss" ||
      unavailablePlugin.test(pathname) || unavailableThemeFile.test(pathname);
  }

  return tag === "script" && (
    unavailablePlugin.test(pathname) ||
    unavailableThemeFile.test(pathname) ||
    pathname.includes("/wp-includes/js/comment-reply.")
  );
}

function patchReferences(html, resolveReference) {
  const changes = [];
  let positions;
  let script;

  const parser = new Parser({
    onopentagname() {
      positions = {};
    },
    onattribute(name, _value, quote) {
      if (quote !== undefined) {
        // For an unquoted value, the parser's end index points at its delimiter.
        positions[name] ??= [parser.startIndex, parser.endIndex + (quote === null ? 0 : 1)];
      }
    },
    onopentag(tag, attributes) {
      const [start, end] = [parser.startIndex, parser.endIndex + 1];
      if (tag === "script") script = { start, end, src: attributes.src, remove: false };

      for (const attr of referenceAttributes[tag] || []) {
        if (!attributes[attr] || !positions[attr]) continue;
        const replacement = resolveReference(tag, attributes, attributes[attr], attr);
        if (replacement === null) continue;

        if (replacement === false) {
          if (tag === "script") script.remove = true;
          else changes.push([start, end, ""]);
          return;
        }

        const [from, to] = positions[attr];
        changes.push([from, to, attr + '="' + escapeAttribute(replacement) + '"']);
      }
    },
    onclosetag(tag, implied) {
      if (tag !== "script" || implied || !script) return;
      const inline = !script.src && html.slice(script.end, parser.startIndex);
      if (script.remove || (inline && /^\s*var fb_timeout, fb_opts\s*=/.test(inline))) {
        changes.push([script.start, parser.endIndex + 1, ""]);
      }
      script = undefined;
    }
  });

  parser.end(html);
  if (!changes.length) return html;

  const segments = [];
  let offset = 0;
  for (const [start, end, value] of changes.sort(([left], [right]) => left - right)) {
    segments.push(html.slice(offset, start), value);
    offset = end;
  }
  segments.push(html.slice(offset));
  return segments.join("");
}

function repairArticleArchive(output) {
  const root = path.resolve(output);
  const redirects = new Map();
  const pathCache = new Map();

  function hasFile(route) {
    if (!pathCache.has(route)) {
      const file = path.resolve(root, "." + route);
      pathCache.set(route, file.startsWith(root + path.sep) &&
        Boolean(fs.statSync(file, { throwIfNoEntry: false })?.isFile()));
    }
    return pathCache.get(route);
  }

  function hasRoute(route) {
    return hasFile(route.endsWith("/") ? route + "index.html" : route);
  }

  function existingPath(route) {
    if (!route) return null;
    if (hasRoute(route)) return route;
    return !route.endsWith("/") && hasRoute(route + "/") ? route + "/" : null;
  }

  function replacementPath(route) {
    const alias = archiveAliases.get(route) || archiveAliases.get(pageRoute(route));
    if (alias) return alias;
    if (/^\/(?:ru\/|articles\/)?kievpohod\/\d{4}-\d{2}-\d{2}\//.test(route)) {
      return route.replace(/^\/(?:ru\/|articles\/)?kievpohod\//, "/prj/kyivnaskvoz/");
    }
    if (/^\/(?:ru\/|articles\/)?(?:kievpohod|kyivnaskvoz)\//.test(route)) {
      return route.replace(/^\/(?:ru\/|articles\/)?/, "/prj/");
    }
    if (route.startsWith("/blog/")) {
      const article = route.replace("/blog/", "/articles/");
      return archiveAliases.get(article) || article;
    }
    if (route.startsWith("/articles/wp-includes/")) return route.replace("/articles/", "/ru/dan-wpdata/");
    if (route.startsWith("/ru/dan-wpdata/wp-json/")) return route.replace("/ru/dan-wpdata/", "/articles/");
    if (route.startsWith("/ru/dan-files/")) return route.slice(3);
    if (route.startsWith("/ru/") && !route.startsWith("/ru/dan-wpdata/")) {
      const article = route.replace("/ru/", "/articles/");
      return archiveAliases.get(article) || article;
    }
    return null;
  }

  function registerRedirect(route, destination) {
    const from = pageRoute(route);
    const to = pageRoute(destination);
    if (from !== to && from.endsWith("/") && to.endsWith("/") && hasRoute(to)) {
      redirects.set(from, to);
    }
  }

  for (const [route, destination] of archiveAliases) {
    registerRedirect(route, destination);
  }

  function repairPage(entry) {
    const filename = path.join(entry.parentPath, entry.name);
    const source = fs.readFileSync(filename, "utf8");
    const route = "/" + path.relative(root, filename).split(path.sep).join("/");
    const base = site.url + pageRoute(route);

    const archived = stripUniversalAnalytics(source)
      .replace(/<a\b[^>]*\bhref=["']https?:\/\/plus\.google\.com\/share\?[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "")
      .replace(/<a\b[^>]*\bhref=["']https?:\/\/picasaweb\.google\.com(?:\.ua)?\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi,
        "$1 (альбом недоступен)");
    const repaired = patchReferences(archived, (tag, attributes, value, attribute) => {
      if (tag === "a" && /^remnote\.com\/invite\//.test(value)) return "https://" + value;

      let url;
      let pathname;
      try {
        // The WordPress lazy-loader uses a transparent placeholder in src.
        if (tag === "img" && attribute === "src" && value.includes("/1x1.trans.gif") &&
            attributes["data-lazy-src"]) {
          const lazyUrl = URL.parse(attributes["data-lazy-src"], base);
          if (lazyUrl && oldSiteHosts.has(lazyUrl.hostname)) {
            const localPath = replacementPath(decodeURIComponent(lazyUrl.pathname));
            if (localPath && hasRoute(localPath)) {
              return encodeURI(localPath) + lazyUrl.search + lazyUrl.hash;
            }
          }
        }
        url = new URL(value, base);
        if (!["http:", "https:"].includes(url.protocol)) return null;
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return null;
      }

      if (tag === "link" && url.hostname === "feeds.feedburner.com" && pathname === "/DanKievUa") {
        return false;
      }

      const oldHost = oldSiteHosts.has(url.hostname);
      if (!oldHost && !siteHosts.has(url.hostname)) {
        if (url.protocol === "http:" && (
          /^lh\d+\.ggpht\.com$/.test(url.hostname) ||
          (tag === "iframe" && url.hostname === "www.youtube.com") ||
          (tag === "link" && url.hostname === "fonts.googleapis.com")
        )) {
          url.protocol = "https:";
          return url.href;
        }
        return null;
      }

      let replacement = existingPath(replacementPath(pathname));
      if (!replacement && oldHost && pathname !== "/") {
        replacement = existingPath(pathname) || existingPath("/articles" + pathname);
        if (!replacement && pathname.startsWith("/dan-wpdata/")) {
          replacement = existingPath("/ru" + pathname);
        }
        if (!replacement && pathname.startsWith("/files/")) {
          replacement = existingPath(archiveAliases.get("/ru" + pathname));
        }
      }
      if (replacement) {
        if (pathname.startsWith("/ru/")) registerRedirect(pathname, replacement);
        return encodeURI(pageRoute(replacement)) + url.search + url.hash;
      }
      if (oldHost) return null;
      if (!hasRoute(pathname)) {
        return removeMissingReference(tag, attributes, pathname) ? false : null;
      }

      const isResource = tag === "script" || (tag === "link" && attributes.rel === "stylesheet");
      if (isResource && /^\s*(?:https?:)?\/\//i.test(value)) {
        return url.pathname + url.search + url.hash;
      }
      return null;
    });

    if (repaired !== source) fs.writeFileSync(filename, repaired);
  }

  for (const directory of ["articles", "prj/kievpohod", "prj/kyivnaskvoz"]) {
    for (const entry of fs.readdirSync(path.join(root, directory), { recursive: true, withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
      const route = "/" + path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/");
      if (archivePage.test(route)) {
        // These WordPress paths moved from /ru/ to /articles/ as a group.
        registerRedirect(route.replace("/articles/", "/ru/"), route);
      } else if (route.startsWith("/prj/") && route.endsWith("/index.html")) {
        for (const prefix of ["/ru/", "/articles/"]) {
          registerRedirect(route.replace("/prj/", prefix), route);
        }
      }
      repairPage(entry);
    }
  }

  for (const [from, to] of redirects) {
    const filename = path.join(root, from, "index.html");
    if (fs.existsSync(filename)) continue;

    const destination = encodeURI(to);
    const link = escapeAttribute(destination);
    const canonical = escapeAttribute(site.url + destination);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Страница переехала</title>
<link rel="canonical" href="${canonical}">
<script>location.replace(${JSON.stringify(destination)} + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=${link}">
<p><a href="${link}">Перейти к статье или архиву</a></p>
</html>
`, { flag: "wx" });
  }
}

module.exports = { repairArticleArchive };
