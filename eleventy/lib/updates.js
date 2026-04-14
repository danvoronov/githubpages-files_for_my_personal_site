const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const updatesRoot = path.join(process.cwd(), "markdown", "updates");
const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeSlashes(value) {
  return value.replace(/\\/g, "/");
}

function walkMarkdownFiles(dirPath) {
  const results = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

function toUpdateUrl(slug) {
  return `/updates/${slug}/`;
}

function toOutputPath(slug) {
  return `updates/${slug}/index.html`;
}

function toAssetUrl(target) {
  const [rawPath] = target.split("|");
  const normalized = normalizeSlashes(rawPath.trim());
  const relativePath = normalized.replace(/^(\.\.\/)+assets\//, "assets/");

  return encodeURI(`/updates/${relativePath}`);
}

function toWikiUrl(target) {
  const [rawSlug] = target.split("#");
  return toUpdateUrl(rawSlug.trim());
}

function preprocessObsidian(rawContent) {
  return rawContent
    .replace(/%%[\s\S]*?%%/g, "")
    .replace(/^\s*_?Reply to Telegram message ID:\s*\d+_?\s*$(?:\r?\n)?/gim, "")
    .replace(/^\s*_?Forwarded from:\s*.+_?\s*$(?:\r?\n)?/gim, "")
    .trim()
    .replace(/\r?\n{3,}/g, "\n\n")
    .replace(/==([^=\n](?:.*?[^=\n])?)==/g, "<mark>$1</mark>");
}

function sanitizeUpdateContent(rawContent) {
  return String(rawContent)
    .replace(/^\s*_?Reply to Telegram message ID:\s*\d+_?\s*$/gim, "")
    .replace(/^\s*_?Forwarded from:\s*.+_?\s*$/gim, "")
    .trim();
}

function renderAssetEmbed(target) {
  const [rawPath, rawCaption] = target.split("|");
  const assetUrl = toAssetUrl(rawPath.trim());
  const extension = path.extname(rawPath.trim()).toLowerCase();
  const label = rawCaption || path.basename(rawPath.trim());

  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"].includes(extension)) {
    return `<figure class="update-embed"><img src="${assetUrl}" alt="${escapeHtml(label)}" loading="lazy"></figure>`;
  }

  if ([".mp4", ".webm", ".mov", ".m4v"].includes(extension)) {
    return `<figure class="update-embed"><video controls preload="metadata" src="${assetUrl}"></video></figure>`;
  }

  if ([".ogg", ".mp3", ".wav", ".m4a", ".aac"].includes(extension)) {
    return `<figure class="update-embed"><audio controls preload="metadata" src="${assetUrl}"></audio></figure>`;
  }

  return `<p><a href="${assetUrl}">Attachment: ${escapeHtml(label)}</a></p>`;
}

function renderNoteEmbed(target, updatesBySlug, stack) {
  const [rawTarget] = target.split("|");
  const [rawSlug] = rawTarget.split("#");
  const slug = rawSlug.trim();
  const embedded = updatesBySlug.get(slug);

  if (!embedded) {
    return `<p><a href="${toWikiUrl(target)}">${escapeHtml(slug)}</a></p>`;
  }

  if (stack.includes(slug)) {
    return `<p><a href="${embedded.url}">${escapeHtml(embedded.title)}</a></p>`;
  }

  const embeddedHtml = renderUpdateMarkdown(embedded.rawContent, updatesBySlug, [...stack, slug]);

  return [
    `<aside class="note-embed">`,
    `<p class="note-embed__label">Embedded update</p>`,
    `<h2 class="note-embed__title"><a href="${embedded.url}">${escapeHtml(embedded.title)}</a></h2>`,
    `<div class="note-embed__content">${embeddedHtml}</div>`,
    `</aside>`
  ].join("");
}

function replaceEmbeds(rawContent, updatesBySlug, stack) {
  return rawContent.replace(/!\[\[([^\]]+)\]\]/g, (_match, target) => {
    const [rawTarget] = target.split("|");
    const extension = path.extname(rawTarget.trim()).toLowerCase();

    if (extension) {
      return renderAssetEmbed(target);
    }

    return renderNoteEmbed(target, updatesBySlug, stack);
  });
}

function replaceWikiLinks(rawContent) {
  return rawContent.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => {
    const linkText = (label || target).trim();

    return `[${linkText}](${toWikiUrl(target)})`;
  });
}

function renderUpdateMarkdown(rawContent, updatesBySlug, stack = []) {
  const preprocessed = preprocessObsidian(rawContent);
  return markdown.render(replaceWikiLinks(replaceEmbeds(preprocessed, updatesBySlug, stack)));
}

function stripMarkdown(rawContent) {
  return rawContent
    .replace(/%%[\s\S]*?%%/g, " ")
    .replace(/!\[\[[^\]]+\]\]/g, " ")
    .replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => (label || target))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/==/g, " ")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildExcerpt(rawContent, fallbackTitle) {
  const contentBeforeLinkedPosts = rawContent.split(/\n## Linked posts\b/i)[0];
  const plainText = stripMarkdown(contentBeforeLinkedPosts);
  const source = plainText || fallbackTitle || "";

  if (source.length <= 220) {
    return source;
  }

  return `${source.slice(0, 217).trimEnd()}...`;
}

function normalizeDisplayTitle(title) {
  return String(title).replace(/^(Photo post|Video post|Voice message|Location post)\s+\d+$/i, "$1");
}

function loadUpdates() {
  const files = walkMarkdownFiles(updatesRoot);

  const records = files
    .map((filePath) => {
      const fileContents = fs.readFileSync(filePath, "utf8");
      const parsed = matter(fileContents);
      const slug = path.basename(filePath, ".md");
      const rawTitle = parsed.data.title || slug;
      const title = normalizeDisplayTitle(rawTitle);
      const date = typeof parsed.data.date === "string" ? parsed.data.date : slug;
      const sanitizedContent = sanitizeUpdateContent(parsed.content);

      return {
        slug,
        rawTitle,
        title,
        date,
        updated: typeof parsed.data.updated === "string" ? parsed.data.updated : null,
        telegramId: parsed.data.telegram_id ?? null,
        mediaKind: parsed.data.media_kind || "text",
        tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
        replyToMessageId: parsed.data.reply_to_message_id ?? null,
        forwardedFrom: parsed.data.forwarded_from || null,
        rawContent: sanitizedContent,
        url: toUpdateUrl(slug),
        outputPath: toOutputPath(slug),
        sourcePath: normalizeSlashes(path.relative(process.cwd(), filePath))
      };
    })
    .sort((left, right) => {
      if (left.date === right.date) {
        return right.slug.localeCompare(left.slug);
      }

      return right.date.localeCompare(left.date);
    });

  const updatesBySlug = new Map(records.map((record) => [record.slug, record]));

  return records.map((record) => {
    const contentHtml = renderUpdateMarkdown(record.rawContent, updatesBySlug, [record.slug]);

    return {
      ...record,
      contentHtml,
      excerpt: buildExcerpt(record.rawContent, record.title),
      searchText: stripMarkdown(record.rawContent)
    };
  });
}

module.exports = {
  loadUpdates
};
