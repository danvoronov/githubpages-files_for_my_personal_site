const path = require("node:path");
const site = require("./eleventy/_data/site");
const { markdown } = require("./eleventy/lib/updates");
const { escapeHtml, applyExternalLinks } = require("./eleventy/lib/html");
const { repairArticleArchive } = require("./eleventy/lib/article-archive");
const { stripArchivedAnalytics } = require("./eleventy/lib/legacy-analytics");

const copyFullSite = process.env.ELEVENTY_COPY_SITE_ROOT === "true";
const publicSitePaths = [
  "404.html",
  "87",
  "about",
  "ai",
  "art",
  "articles",
  "dan-files",
  "dr",
  "educator",
  "index.html",
  "lifechanging",
  "menu.js",
  "now",
  "prj",
  "ru",
  "startups",
  "studied",
  "worldviews"
];
const updatesTheme = "ru/dan-wpdata/themes/dan-kiev-ua";
const publicCopyOptions = {
  dot: false,
  filter: (relativePath) => !relativePath.split("/").some((part) => part.startsWith("."))
};

function formatDateOnly(value) {
  if (typeof value !== "string" || value.length < 10) {
    return "";
  }

  return value.slice(0, 10);
}

function formatDateTime(value) {
  if (typeof value !== "string") {
    return formatDateOnly(value);
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})[-T ](\d{2})[-:](\d{2})/);

  if (!match) {
    return formatDateOnly(value);
  }

  return `<strong>${match[1]}</strong> <span class="updates-time-clock">${match[2]}:${match[3]}</span>`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.setLibrary("md", markdown);
  eleventyConfig.addWatchTarget("./updates-md/updates/");
  eleventyConfig.addTransform("updates-external-links", function (html) {
    if (!this.page.url?.startsWith("/updates/") || !this.page.outputPath?.endsWith(".html")) return html;
    return applyExternalLinks(html, site.url);
  });

  eleventyConfig.addPassthroughCopy({
    "updates-md/updates/assets": "updates/assets"
  }, publicCopyOptions);
  eleventyConfig.addPassthroughCopy({
    "eleventy/static/updates.css": "updates/styles.css"
  });
  eleventyConfig.addPassthroughCopy({
    "eleventy/static/updates-search.js": "updates/search.js",
    "eleventy/static/updates-navigation.js": "updates/navigation.js"
  });
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy(".nojekyll");
  eleventyConfig.addPassthroughCopy("CNAME");

  if (copyFullSite) {
    for (const publicPath of publicSitePaths) {
      eleventyConfig.addPassthroughCopy(publicPath, publicCopyOptions);
    }
    eleventyConfig.on("eleventy.after", ({ directories, outputMode }) => {
      if (outputMode !== "fs") return;
      repairArticleArchive(directories.output);
      stripArchivedAnalytics(path.join(directories.output, "prj", "kievpohod"));
    });
  } else {
    for (const stylesheet of ["style.css", "reset.css", "styles/default.css", "custom.css"]) {
      eleventyConfig.addPassthroughCopy(`${updatesTheme}/${stylesheet}`);
    }
    eleventyConfig.addPassthroughCopy("dan-files/i/dan_doska_4site.jpg");
  }

  eleventyConfig.addFilter("readableDate", formatDateOnly);
  eleventyConfig.addFilter("readableDateTime", formatDateTime);
  eleventyConfig.addFilter("htmlEscape", escapeHtml);
  eleventyConfig.addFilter("urlencode", (value) => {
    return encodeURIComponent(String(value ?? ""));
  });
  eleventyConfig.addFilter("absoluteUrl", (url, base = site.url) => {
    if (!url) {
      return "";
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const pathPart = url.startsWith("/") ? url : `/${url}`;
    return `${String(base).replace(/\/+$/, "")}${pathPart}`;
  });
  eleventyConfig.addFilter("updateKindLabel", (value) => {
    const labels = {
      text: "текст",
      photo: "фото",
      video: "відео",
      voice: "голос",
      audio: "аудіо",
      file: "файл"
    };

    return labels[value] || value || "оновлення";
  });

  return {
    dir: {
      input: "eleventy",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "11ty.js"]
  };
};
