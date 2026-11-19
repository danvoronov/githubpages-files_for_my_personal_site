const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Parser } = require("htmlparser2");
const parseSrcset = require("parse-srcset");
const { chromium } = require("playwright");
const { applyExternalLinks } = require("../eleventy/lib/html");
const { url: siteUrl } = require("../eleventy/_data/site");
const knownMissingLinks = require("./known-missing-links.json");

const output = path.resolve(__dirname, "../_site");
const productionHost = new URL(siteUrl).hostname;
const urlAttributes = {
  a: ["href"], area: ["href"], link: ["href"], script: ["src"],
  iframe: ["src"], img: ["src", "data-lazy-src", "data-src"], input: ["src"], source: ["src"],
  audio: ["src"], video: ["src", "poster"], object: ["data"],
  embed: ["src"], track: ["src"], form: ["action"]
};

function readPage(relativePath) {
  return fs.readFileSync(path.join(output, relativePath), "utf8");
}

function parseHtml(html, onopentag) {
  new Parser({ onopentag }).end(html);
}

function resolveLocalUrl(value, base) {
  const url = URL.parse(value, base);
  return url && ["https:", "http:"].includes(url.protocol) &&
    [productionHost, "www." + productionHost].includes(url.hostname) ? url : null;
}

function checkLocalLinks() {
  const files = fs.readdirSync(output, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(output, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"));
  const published = new Set(files);
  const pages = files.filter((file) => file.endsWith(".html"));
  const known = new Set(knownMissingLinks.map((link) => JSON.stringify(link)));
  const unexpected = new Set();
  const seen = new Set();

  for (const page of pages) {
    const publicPath = page.split("/").map(encodeURIComponent).join("/").replace(/(^|\/)index\.html$/, "$1");
    const pageUrl = siteUrl + "/" + publicPath;
    const links = [];
    let baseUrl = null;

    parseHtml(readPage(page), (tag, attributes) => {
      if (tag === "base" && !baseUrl && attributes.href) {
        baseUrl = URL.parse(attributes.href, pageUrl);
      }
      for (const name of Object.hasOwn(urlAttributes, tag) ? urlAttributes[tag] : []) {
        if (attributes[name]) links.push(attributes[name]);
      }
      if ((tag === "img" || tag === "source") && attributes.srcset) {
        links.push(...parseSrcset(attributes.srcset).map(({ url }) => url));
      }
    });

    for (const value of links) {
      const url = resolveLocalUrl(value, baseUrl || pageUrl);
      if (!url) continue;
      const href = decodeURIComponent(url.pathname);
      const target = href.slice(1);
      const index = target ? target.replace(/\/?$/, "/index.html") : "index.html";
      if (published.has(target) || published.has(index)) continue;

      const missing = JSON.stringify([page, href]);
      if (known.has(missing)) seen.add(missing);
      else unexpected.add(missing);
    }
  }

  assert.equal(unexpected.size, 0,
    "New missing local links [source, target]:\n" + [...unexpected].sort().join("\n"));
  console.log("Checked local links on " + pages.length + " HTML pages (" + seen.size + " known exceptions).");
}

function checkAttachments() {
  const attachments = [
    ["2019-05-21-17-39", "Game_Design_meeting_1.pdf"],
    ["2019-06-29-20-08_2", "Гейм_диз_2_v1.pdf"],
    ["2019-07-30-11-27", "Гейм_диз_3_pt1.pdf"]
  ];

  for (const [slug, filename] of attachments) {
    const expected = "/updates/assets/files/" + filename;
    const links = [];
    parseHtml(readPage("updates/" + slug + "/index.html"), (tag, attrs) => {
      if (tag !== "a" || !attrs.href) return;
      const url = resolveLocalUrl(attrs.href, siteUrl);
      if (url && decodeURIComponent(url.pathname) === expected) links.push(attrs.href);
    });

    assert.ok(fs.statSync(path.join(output, expected.slice(1)), { throwIfNoEntry: false })?.isFile(), expected);
    assert.equal(links.length, 2, slug + " must link to the same PDF in the embed and the wiki-link.");
  }
  console.log("Checked Updates PDF links and attachment files.");
}

function checkExternalLinks() {
  const links = [
    '<a id="external" href="https://example.org">External</a>',
    '<a id="rel" href="//example.org" target=_blank rel="nofollow opener">Existing attributes</a>',
    '<a id="same" href="' + siteUrl + '/updates/">This site</a>',
    '<a id="opt-out" href="https://example.org" target="_self">Same tab</a>'
  ];
  const result = {};
  parseHtml(applyExternalLinks(links.join(""), siteUrl), (tag, attrs) => {
    if (tag === "a") result[attrs.id] = [attrs.target, attrs.rel];
  });
  assert.deepEqual(result, {
    external: ["_blank", "noopener"],
    rel: ["_blank", "nofollow noopener"],
    same: [undefined, undefined],
    "opt-out": ["_self", undefined]
  });
  console.log("Checked Updates external link rules.");
}

async function checkRss(page) {
  const index = JSON.parse(readPage("updates/search.json"));
  const items = await page.evaluate((xml) => {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    if (document.querySelector("parsererror") || document.documentElement.localName !== "rss") {
      throw new Error("Invalid RSS XML");
    }
    return Array.from(document.querySelectorAll("rss > channel > item"), (item) =>
      ["link", "guid", "pubDate"].map((field) => item.querySelector(field)?.textContent)
    );
  }, readPage("updates/feed.xml"));

  const expected = index.slice(0, 50).map(({ url, date }) => {
    const link = siteUrl + url;
    const published = new Date(date);
    assert.ok(Number.isFinite(published.getTime()), "Invalid publication date for " + url);
    return [link, link, published.toUTCString()];
  });
  assert.ok(expected.length, "Expected at least one RSS item");
  assert.deepEqual(items, expected, "RSS links and dates must match the latest Updates posts in order.");
  console.log("Checked RSS XML and " + items.length + " publication dates.");
}

async function checkUpdates(page, baseUrl) {
  await page.goto(baseUrl + "/updates/2019-05-21-17-39/");
  assert.equal(await page.locator("link[href='/updates/styles.css']").count(), 1);
  assert.equal(await page.locator(".updates-shell").evaluate((element) => getComputedStyle(element).borderTopWidth), "8px");
  const shareLink = page.locator(".share-btn--telegram");
  assert.equal(await shareLink.getAttribute("target"), "_blank");
  assert.equal(await shareLink.getAttribute("rel"), "noopener");

  await page.keyboard.press("Escape");
  await page.waitForURL(baseUrl + "/updates/");
  console.log("Checked Updates styles, published link attributes, and Escape navigation.");
}

async function checkStudied(page, baseUrl) {
  await page.goto(baseUrl + "/studied/");
  const category = page.locator("#category-filter");
  const year = page.locator("#year-filter");

  await category.selectOption("bz");
  const years = await year.locator("option").all();
  const selectedYear = await years[1]?.getAttribute("value");
  assert.ok(selectedYear, "Expected a year for the selected category");
  await year.selectOption(selectedYear);
  const before = new URL(page.url());
  assert.equal(before.searchParams.get("cat"), "bz");
  assert.equal(before.searchParams.get("yr"), selectedYear);

  await page.reload();
  await page.locator("#grid .el").first().waitFor();
  assert.equal(await category.inputValue(), "bz");
  assert.equal(await year.inputValue(), selectedYear);

  await page.goBack();
  await page.waitForFunction(() => document.getElementById("year-filter")?.value === "");
  assert.equal(await category.inputValue(), "bz");
  assert.equal(await year.inputValue(), "");
  await page.goto(baseUrl + "/studied/?cat=Organizations%20and%20business&yr=4&a=y");
  await page.locator("#grid").waitFor();
  assert.equal(await category.inputValue(), "bz");
  assert.equal(await year.inputValue(), "04");
  console.log("Checked Studied filters across reload, browser back, and a legacy link.");
}

async function checkRepairedLinks(page, baseUrl) {
  for (const [oldPath, newPath] of [
    ["/ru/2018/02/28/mozg-chto-i-zachem-ono-tut/", "/articles/2018/02/28/mozg-chto-i-zachem-ono-tut/"],
    ["/readed/", "/studied/"],
    ["/prj/", "/startups/"]
  ]) {
    const suffix = "?ref=legacy#archive";
    await page.goto(baseUrl + oldPath + suffix);
    await page.waitForURL(baseUrl + newPath + suffix);
  }

  await page.goto(baseUrl + "/ai/");
  const email = page.locator(".contact-note a");
  assert.equal(await email.getAttribute("href"), "mailto:" + (await email.innerText()).trim());

  await page.goto(baseUrl + "/");
  const menuToggle = page.locator(".main-menu-toggle");
  await page.locator("#graph .nodes circle[cx]").first().waitFor({ state: "attached" });
  await menuToggle.click();
  await page.keyboard.press("Escape");
  assert.equal(page.url(), baseUrl + "/");
  assert.equal(await menuToggle.getAttribute("aria-expanded"), "false");
  console.log("Checked legacy redirects, contact email, and Escape on the homepage.");
}

async function checkInChromium() {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const pathname = decodeURIComponent(new URL(request.url).pathname);
      const filename = path.resolve(output, "." + pathname);
      if (filename !== output && !filename.startsWith(output + path.sep)) {
        return new Response("Not found", { status: 404 });
      }
      const file = Bun.file(path.join(filename, pathname.endsWith("/") ? "index.html" : ""));
      return await file.exists() ? new Response(file) : new Response("Not found", { status: 404 });
    }
  });

  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const baseUrl = server.url.origin;
    await page.route("**/*", (route) => route.request().url().startsWith(baseUrl + "/")
      ? route.continue() : route.abort());
    await checkRss(page);
    await checkUpdates(page, baseUrl);
    await checkStudied(page, baseUrl);
    await checkRepairedLinks(page, baseUrl);
  } finally {
    await browser?.close();
    server.stop(true);
  }
}

async function main() {
  assert.ok(fs.existsSync(path.join(output, "index.html")), "Run bun run build:full before bun run check.");
  checkLocalLinks();
  checkAttachments();
  checkExternalLinks();
  await checkInChromium();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
