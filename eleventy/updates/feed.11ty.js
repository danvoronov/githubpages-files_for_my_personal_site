function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

class UpdatesFeed {
  data() {
    return {
      permalink: "updates/feed.xml"
    };
  }

  render({ site, updates }) {
    const items = updates.slice(0, 50).map((post) => {
      const absoluteUrl = `${site.url}${post.url}`;
      const description = post.excerpt || post.title;

      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(absoluteUrl)}</link>`,
        `<guid>${escapeXml(absoluteUrl)}</guid>`,
        `<pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `<description>${escapeXml(description)}</description>`,
        "</item>"
      ].join("");
    });

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      "<channel>",
      `<title>${escapeXml(`${site.name} Updates`)}</title>`,
      `<link>${escapeXml(`${site.url}/updates/`)}</link>`,
      `<description>${escapeXml(site.updatesDescription)}</description>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      ...items,
      "</channel>",
      "</rss>"
    ].join("");
  }
}

module.exports = UpdatesFeed;

