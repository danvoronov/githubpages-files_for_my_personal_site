const fs = require("node:fs");
const path = require("node:path");
const { Parser } = require("htmlparser2");
const site = require("../_data/site");
const { stripUniversalAnalytics } = require("./legacy-analytics");

const siteHosts = new Set([new URL(site.url).hostname, "www.danvoronov.com"]);
const archiveAliases = new Map([
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
const educatorLegacyRoutes = [
  "/ru/2018/06/05/dnevnikovost-kak-ya-vedu-dnevnik/",
  "/ru/2013/06/12/myishlenie-tsikl-lektsiy-v-svobodnoy-shkole/",
  "/ru/tag/lichnost/page/4/"
];

const unavailablePlugin = /^\/ru\/dan-wpdata\/plugins\/(?:accesspress-social-share|daves-wordpress-live-search|easy-fancybox|top-10)\//;
const unavailableThemeFile = /^\/ru\/dan-wpdata\/themes\/dan-kiev-ua\/(?:header\.css|includes\/js\/(?:jquery\.easing\.min|loopedSlider)\.js)$/;

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

function patchArticle(html, resolveReference) {
  const changes = [];
  let positions;
  let script;

  const parser = new Parser({
    onopentagname() {
      positions = {};
    },
    onattribute(name, _value, quote) {
      if ((name === "href" || name === "src") && quote !== undefined) {
        // For an unquoted value, the parser's end index points at its delimiter.
        positions[name] ??= [parser.startIndex, parser.endIndex + (quote === null ? 0 : 1)];
      }
    },
    onopentag(tag, attributes) {
      const [start, end] = [parser.startIndex, parser.endIndex + 1];
      if (tag === "script") script = { start, end, src: attributes.src, remove: false };

      if (tag !== "a" && tag !== "link" && tag !== "script") return;
      const attr = tag === "script" ? "src" : "href";
      if (!attributes[attr] || !positions[attr]) return;
      const replacement = resolveReference(tag, attributes, attributes[attr]);
      if (replacement === null) return;

      if (replacement === false) {
        if (tag === "script") script.remove = true;
        else changes.push([start, end, ""]);
        return;
      }

      const [from, to] = positions[attr];
      changes.push([from, to, attr + '="' + escapeAttribute(replacement) + '"']);
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
  for (const [start, end, value] of changes) {
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

  function replacementPath(route) {
    const alias = archiveAliases.get(route) || archiveAliases.get(pageRoute(route));
    if (alias) return alias;
    if (route.startsWith("/articles/wp-includes/")) return route.replace("/articles/", "/ru/dan-wpdata/");
    if (route.startsWith("/ru/dan-wpdata/wp-json/")) return route.replace("/ru/dan-wpdata/", "/articles/");
    if (route.startsWith("/ru/dan-files/")) return route.slice(3);
    if (route.startsWith("/ru/") && !route.startsWith("/ru/dan-wpdata/")) {
      return route.replace("/ru/", "/articles/");
    }
    return null;
  }

  function registerRedirect(route, destination) {
    const from = pageRoute(route);
    const to = pageRoute(destination);
    if (from.startsWith("/ru/") && from.endsWith("/") && to.endsWith("/")) {
      redirects.set(from, to);
    }
  }

  for (const route of educatorLegacyRoutes) {
    const destination = replacementPath(route);
    if (hasRoute(destination)) registerRedirect(route, destination);
  }

  const articles = path.join(root, "articles");
  for (const entry of fs.readdirSync(articles, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;

    const filename = path.join(entry.parentPath, entry.name);
    const source = fs.readFileSync(filename, "utf8");
    const route = "/" + path.relative(root, filename).split(path.sep).join("/");
    const base = site.url + pageRoute(route);

    const repaired = patchArticle(stripUniversalAnalytics(source), (tag, attributes, value) => {
      if (tag === "a" && /^remnote\.com\/invite\//.test(value)) return "https://" + value;

      let url;
      let pathname;
      try {
        url = new URL(value, base);
        if (!["http:", "https:"].includes(url.protocol) || !siteHosts.has(url.hostname)) return null;
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return null;
      }

      const replacement = replacementPath(pathname);
      if (replacement && hasRoute(replacement)) {
        registerRedirect(pathname, replacement);
        return encodeURI(pageRoute(replacement)) + url.search + url.hash;
      }
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
