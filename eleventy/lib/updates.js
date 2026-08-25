const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");

const updatesRoot = path.join(process.cwd(), "updates-md", "updates");
const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

const defaultLinkOpen = markdown.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

markdown.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const hrefIdx = tokens[idx].attrIndex("href");
  if (hrefIdx >= 0) {
    const href = tokens[idx].attrs[hrefIdx][1];
    if (href && /^https?:\/\//i.test(href)) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener");
    }
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

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

function getAssetFolderForExtension(ext) {
  const lower = String(ext).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"].includes(lower)) return "photos";
  if ([".mp4", ".webm", ".mov", ".m4v"].includes(lower)) return "videos";
  if ([".ogg", ".mp3", ".wav", ".m4a", ".aac", ".oga", ".opus"].includes(lower)) return "voice_messages";
  if ([".pdf", ".zip", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"].includes(lower)) return "files";
  return null;
}

function inferAssetRelativePath(filename) {
  const ext = path.extname(filename).toLowerCase();
  const folder = getAssetFolderForExtension(ext);
  if (folder) return `assets/${folder}/${filename}`;
  return `assets/${filename}`;
}

function resolveAssetFallback(relativePath) {
  try {
    const assetsRoot = path.join(process.cwd(), "updates-md", "updates", "assets");
    const fileName = path.basename(relativePath);
    const ext = path.extname(fileName).toLowerCase();
    const full = path.join(assetsRoot, relativePath.replace(/^assets\//, ""));
    if (fs.existsSync(full)) return relativePath;
    // If requested path was assets/<bare> but file actually lives in subfolder (e.g. photos), try inferred location
    if (relativePath === `assets/${fileName}`) {
      const alt = inferAssetRelativePath(fileName);
      if (alt !== relativePath && fs.existsSync(path.join(assetsRoot, alt.replace(/^assets\//, "")))) {
        return alt;
      }
    }
    // If requested was assets/photos/<file> but somehow file at root (legacy), fallback to root
    const inferred = inferAssetRelativePath(fileName);
    if (relativePath === inferred) {
      const rootAlt = `assets/${fileName}`;
      if (fs.existsSync(path.join(assetsRoot, fileName))) return rootAlt;
    }
  } catch (_) {}
  return relativePath;
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
  const normalized = normalizeSlashes(rawPath.trim()).replace(/^\.\/+/, "");
  const assetIdx = normalized.indexOf("assets/");
  let relativePath;

  if (assetIdx !== -1) {
    relativePath = normalized.slice(assetIdx);
  } else if (!normalized.includes("/")) {
    relativePath = inferAssetRelativePath(normalized);
  } else {
    relativePath = normalized.replace(/^(\.\.\/)+/, "");
    if (!relativePath.startsWith("assets/")) {
      relativePath = `assets/${relativePath.replace(/^\//, "")}`;
    }
  }

  relativePath = resolveAssetFallback(relativePath);
  return encodeURI(`/updates/${relativePath}`);
}

// Rewrite bare/relative markdown image src via toAssetUrl (supports Obsidian bare names like "Pasted image.png")
const defaultImageRule = markdown.renderer.rules.image || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
markdown.renderer.rules.image = function (tokens, idx, options, env, self) {
  const srcIdx = tokens[idx].attrIndex("src");
  if (srcIdx >= 0) {
    const src = tokens[idx].attrs[srcIdx][1];
    if (src && !/^https?:\/\//i.test(src) && !src.startsWith("/") && !src.startsWith("data:")) {
      tokens[idx].attrs[srcIdx][1] = toAssetUrl(src);
    }
  }
  return defaultImageRule(tokens, idx, options, env, self);
};

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

  return `<p><a href="${assetUrl}">Вкладення: ${escapeHtml(label)}</a></p>`;
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
    `<p class="note-embed__label">Вкладений запис</p>`,
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

function replaceMarkdownImages(rawContent) {
  return rawContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, inner) => {
    let src = inner.trim();
    // Handle optional title: ![alt](url "title")
    let url = src;
    let title = "";
    const titleMatch = src.match(/^(.+?)\s+["'][^"']*["']\s*$/);
    if (titleMatch) {
      url = titleMatch[1].trim();
      title = src.slice(url.length);
    }
    url = url.replace(/^<|>$/g, "").trim();
    if (!url || /^https?:\/\//i.test(url) || url.startsWith("/") || url.startsWith("data:")) return _match;
    // Skip if url already looks like an absolute /updates/assets path
    if (url.startsWith("/updates/")) return _match;
    const assetUrl = toAssetUrl(url);
    return `![${alt}](${assetUrl}${title})`;
  });
}

function renderUpdateMarkdown(rawContent, updatesBySlug, stack = []) {
  const preprocessed = preprocessObsidian(rawContent);
  const withEmbeds = replaceEmbeds(preprocessed, updatesBySlug, stack);
  const withImages = replaceMarkdownImages(withEmbeds);
  return markdown.render(replaceWikiLinks(withImages));
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
  const str = String(title);
  if (/^Photo post\s+\d+$/i.test(str) || str === "Photo post") return "Фотопост";
  if (/^Video post\s+\d+$/i.test(str) || str === "Video post") return "Відеопост";
  if (/^Voice message\s+\d+$/i.test(str) || str === "Voice message") return "Голосове повідомлення";
  if (/^Location post\s+\d+$/i.test(str) || str === "Location post") return "Локація";
  return str;
}

function findFirstImage(rawContent) {
  const obsidianMatch = rawContent.match(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
  if (obsidianMatch) {
    const rawPath = obsidianMatch[1].trim();
    const extension = path.extname(rawPath).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"].includes(extension)) {
      return toAssetUrl(rawPath);
    }
  }

  const markdownMatch = rawContent.match(/!\[.*?\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/);
  if (markdownMatch) {
    return markdownMatch[1];
  }

  return null;
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
        imageUrl: findFirstImage(sanitizedContent),
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

  return records.map((record, index) => {
    const contentHtml = renderUpdateMarkdown(record.rawContent, updatesBySlug, [record.slug]);
    const prevRecord = records[index + 1];
    const nextRecord = records[index - 1];

    const prevPost = prevRecord
      ? {
          url: prevRecord.url,
          title: prevRecord.title,
          date: prevRecord.date
        }
      : null;

    const nextPost = nextRecord
      ? {
          url: nextRecord.url,
          title: nextRecord.title,
          date: nextRecord.date
        }
      : null;

    return {
      ...record,
      contentHtml,
      prevPost,
      nextPost,
      excerpt: buildExcerpt(record.rawContent, record.title),
      searchText: stripMarkdown(record.rawContent)
    };
  });
}

module.exports = {
  loadUpdates
};
