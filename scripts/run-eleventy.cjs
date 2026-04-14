const { spawnSync } = require("child_process");

const rawArgs = process.argv.slice(2);
const copySiteRoot = rawArgs.includes("--copy-site-root");
const eleventyArgs = rawArgs.filter((arg) => arg !== "--copy-site-root");

const cleanResult = spawnSync(process.execPath, ["scripts/clean-site.cjs"], {
  stdio: "inherit"
});

if (cleanResult.status !== 0) {
  process.exit(cleanResult.status ?? 1);
}

const eleventyResult = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["@11ty/eleventy", ...eleventyArgs],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ELEVENTY_COPY_SITE_ROOT: copySiteRoot ? "true" : "false"
    }
  }
);

process.exit(eleventyResult.status ?? 1);
