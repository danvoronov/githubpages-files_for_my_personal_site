const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const rawArgs = process.argv.slice(2);
const copySiteRoot = rawArgs.includes("--copy-site-root");
const eleventyArgs = rawArgs.filter((arg) => arg !== "--copy-site-root");

const cleanResult = spawnSync(process.execPath, [path.join(__dirname, "clean-site.cjs")], {
  cwd: root,
  stdio: "inherit"
});

if (cleanResult.status !== 0) {
  process.exit(cleanResult.status ?? 1);
}

const eleventyCli = path.join(root, "node_modules", "@11ty", "eleventy", "cmd.cjs");
const eleventyResult = spawnSync(process.execPath, [eleventyCli, ...eleventyArgs], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    ELEVENTY_COPY_SITE_ROOT: copySiteRoot ? "true" : "false"
  }
});

process.exit(eleventyResult.status ?? 1);
