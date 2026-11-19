const { Parser } = require("htmlparser2");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyExternalLinks(html, siteUrl) {
  const siteHost = new URL(siteUrl).hostname.replace(/^www\./, "");
  const changes = [];
  let ranges;

  const parser = new Parser({
    onopentagname() {
      ranges = {};
    },
    onattribute(name, _value, quote) {
      if (name !== "target" && name !== "rel") return;
      const start = parser.startIndex;
      // Quoted values end at the closing quote; unquoted ones end before the delimiter.
      const end = quote === undefined ? start + name.length : parser.endIndex + (quote === null ? 0 : 1);
      ranges[name] ??= [start, end];
    },
    onopentag(tag, { href, target, rel }) {
      if (tag !== "a" || !href || !/^(?:https?:)?\/\//i.test(href.trim())) return;
      let url;
      try {
        url = new URL(href, siteUrl);
      } catch {
        return;
      }
      if (url.hostname.replace(/^www\./, "") === siteHost) return;

      const linkTarget = target || "_blank";
      if (linkTarget.toLowerCase() !== "_blank") return;

      const missingAttributes = [];
      const setAttribute = (name, value) => {
        const attribute = name + '="' + escapeHtml(value) + '"';
        if (ranges[name]) changes.push([...ranges[name], attribute]);
        else missingAttributes.push(attribute);
      };

      if (!target) setAttribute("target", linkTarget);

      const relTokens = (rel || "").split(/\s+/).filter(Boolean);
      const hasOpener = relTokens.some((token) => token.toLowerCase() === "opener");
      if (hasOpener || !relTokens.some((token) => token.toLowerCase() === "noopener")) {
        const safeRel = relTokens.filter((token) => !["opener", "noopener"].includes(token.toLowerCase()));
        setAttribute("rel", [...safeRel, "noopener"].join(" "));
      }
      if (missingAttributes.length) {
        const insertAt = parser.startIndex + "<a".length;
        changes.push([insertAt, insertAt, " " + missingAttributes.join(" ")]);
      }
    }
  });

  parser.end(html);
  if (!changes.length) return html;

  const parts = [];
  let offset = 0;
  for (const [start, end, value] of changes.sort(([a], [b]) => a - b)) {
    parts.push(html.slice(offset, start), value);
    offset = end;
  }
  parts.push(html.slice(offset));
  return parts.join("");
}

module.exports = { escapeHtml, applyExternalLinks };
