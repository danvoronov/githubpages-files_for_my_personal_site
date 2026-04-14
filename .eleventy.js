const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");

const projectRoot = __dirname;
const copyLegacySiteRoot = process.env.ELEVENTY_COPY_SITE_ROOT === "true";
const passthroughExcludes = new Set([
  ".git",
  ".github",
  ".gitignore",
  ".eleventy.js",
  "_site",
  "eleventy",
  "markdown",
  "node_modules",
  "package.json",
  "package-lock.json"
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateOnly(value) {
  if (typeof value !== "string" || value.length < 10) {
    return "";
  }

  return value.slice(0, 10);
}

function formatDateTime(value) {
  if (typeof value !== "string" || value.length < 16) {
    return formatDateOnly(value);
  }

  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.setLibrary(
    "md",
    new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    })
  );

  eleventyConfig.addPassthroughCopy({
    "markdown/updates/assets": "updates/assets"
  });
  eleventyConfig.addPassthroughCopy({
    "eleventy/static/updates.css": "updates/styles.css"
  });
  eleventyConfig.addPassthroughCopy({
    "eleventy/static/updates-search.js": "updates/search.js"
  });
  eleventyConfig.addPassthroughCopy("favicon.ico");
  eleventyConfig.addPassthroughCopy(".nojekyll");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Keep local builds scoped to Eleventy output unless the full legacy site
  // copy is explicitly requested for deploys.
  if (copyLegacySiteRoot) {
    for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
      if (passthroughExcludes.has(entry.name)) {
        continue;
      }

      eleventyConfig.addPassthroughCopy(entry.name);
    }
  }

  eleventyConfig.addFilter("readableDate", formatDateOnly);
  eleventyConfig.addFilter("readableDateTime", formatDateTime);
  eleventyConfig.addFilter("htmlEscape", escapeHtml);
  eleventyConfig.addFilter("updateKindLabel", (value) => {
    const labels = {
      text: "text",
      photo: "photo",
      video: "video",
      voice: "voice",
      audio: "audio",
      file: "file"
    };

    return labels[value] || value || "update";
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
