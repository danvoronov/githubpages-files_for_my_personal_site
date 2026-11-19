const { Parser } = require("htmlparser2");

const analyticsUrl = /^(?:https?:)?\/\/(?:www\.)?google-analytics\.com\/analytics\.js(?:[?#]|$)/i;

function stripUniversalAnalytics(html) {
  if (!html.includes("google-analytics.com/analytics.js")) return html;

  const parts = [];
  let offset = 0;
  let script;

  const parser = new Parser({
    onopentag(tag, attributes) {
      if (tag === "script") {
        script = { start: parser.startIndex, content: parser.endIndex + 1, src: attributes.src };
      }
    },
    onclosetag(tag, implied) {
      if (tag !== "script" || implied || !script) return;

      const code = html.slice(script.content, parser.startIndex);
      const isLoader = script.src && analyticsUrl.test(script.src.trim());
      const isTrackingSnippet = !script.src &&
        code.trimStart().startsWith("(function(i,s,o,g,r,a,m){") &&
        code.includes("GoogleAnalyticsObject") &&
        code.includes("google-analytics.com/analytics.js") &&
        /\bga\s*\(\s*['"]create['"]\s*,\s*['"]UA-/.test(code);

      if (isLoader || isTrackingSnippet) {
        parts.push(html.slice(offset, script.start));
        offset = parser.endIndex + 1;
      }
      script = undefined;
    }
  });

  parser.end(html);
  if (!offset) return html;
  parts.push(html.slice(offset));
  return parts.join("");
}

module.exports = { stripUniversalAnalytics };
