#!/usr/bin/env node
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GITHUB_REPO = "https://github.com/gabrielcsapo/fieldtest";

const run = (cmd) => execSync(cmd, { cwd: root, stdio: "inherit" });
const capture = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
const tryCapture = (cmd) => {
  try {
    return capture(cmd);
  } catch {
    return "";
  }
};

const BUMP_TYPES = ["major", "minor", "patch"];
const TYPE_MAP = {
  feat: "Features",
  fix: "Bug Fixes",
  bug: "Bug Fixes",
  perf: "Performance",
  refactor: "Refactors",
  docs: "Documentation",
  chore: "Chores",
};
const CATEGORY_ORDER = [
  "Features",
  "Bug Fixes",
  "Performance",
  "Refactors",
  "Documentation",
  "Chores",
  "Other",
];

// ─── CLI flags ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const noPush = argv.includes("--no-push");
const argBump = argv.find((a) => BUMP_TYPES.includes(a.toLowerCase()))?.toLowerCase();

// ─── Core functions ─────────────────────────────────────────────────────────
async function findPackageJsons() {
  const dirs = ["packages", "apps"];
  const files = [];
  for (const dir of dirs) {
    const abs = join(root, dir);
    if (!existsSync(abs)) continue;
    for (const entry of await readdir(abs, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pj = join(abs, entry.name, "package.json");
      if (existsSync(pj)) files.push(pj);
    }
  }
  return files;
}

function bumpVersion(version, type) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    throw new Error(`Cannot parse version: ${version}`);
  }
  const [maj, min, pat] = parts;
  if (type === "major") return `${maj + 1}.0.0`;
  if (type === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

function parseCommits(range) {
  const cmd = range
    ? `git log ${range} --no-merges --pretty=format:%H%x09%s`
    : `git log --no-merges --pretty=format:%H%x09%s`;
  const raw = capture(cmd);
  if (!raw) return [];
  return raw.split("\n").map((line) => {
    const [hash, ...rest] = line.split("\t");
    return { hash, short: hash.slice(0, 7), subject: rest.join("\t") };
  });
}

function categorize(commits) {
  const groups = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
  const re = /^(\w+)(?:\([^)]+\))?!?:\s*(.+)$/;
  for (const c of commits) {
    const m = c.subject.match(re);
    if (m && TYPE_MAP[m[1]]) {
      groups[TYPE_MAP[m[1]]].push({ ...c, message: m[2] });
    } else {
      groups.Other.push({ ...c, message: c.subject });
    }
  }
  return groups;
}

function renderEntry(version, date, groups, prevTag) {
  const compareUrl = prevTag
    ? `${GITHUB_REPO}/compare/${prevTag}...${version}`
    : `${GITHUB_REPO}/releases/tag/${version}`;
  const lines = [`## [${version}](${compareUrl}) (${date})`, ""];
  let hasContent = false;
  for (const cat of CATEGORY_ORDER) {
    const items = groups[cat];
    if (!items.length) continue;
    hasContent = true;
    lines.push(`### ${cat}`, "");
    for (const item of items) {
      lines.push(`- ${item.message} ([${item.short}](${GITHUB_REPO}/commit/${item.hash}))`);
    }
    lines.push("");
  }
  if (!hasContent) lines.push("_No notable changes._", "");
  return lines.join("\n");
}

async function updateChangelog(entry) {
  const path = join(root, "CHANGELOG.md");
  const header = "# Changelog\n\n";
  let existing = "";
  if (existsSync(path)) {
    existing = await readFile(path, "utf8");
    existing = existing.replace(/^#\s*Changelog\s*\n+/i, "");
  }
  await writeFile(path, `${header}${entry}\n${existing}`);
}

function tagExists(version) {
  return Boolean(tryCapture(`git rev-parse -q --verify refs/tags/${version}`));
}

function headIsReleaseCommit(version) {
  const subject = tryCapture("git log -1 --pretty=format:%s");
  return subject === `chore(release): ${version}`;
}

// ─── Pre-flight ─────────────────────────────────────────────────────────────
function preflight() {
  const branch = capture("git rev-parse --abbrev-ref HEAD");
  if (branch !== "main") {
    throw new Error(`Must be on 'main' branch (currently '${branch}').`);
  }

  try {
    run("git fetch origin main");
  } catch {
    console.warn("Warning: could not fetch origin/main — continuing without sync check.");
    return;
  }
  const local = capture("git rev-parse HEAD");
  const remote = tryCapture("git rev-parse origin/main");
  if (remote && local !== remote) {
    const ahead = Number(tryCapture("git rev-list --count origin/main..HEAD")) || 0;
    const behind = Number(tryCapture("git rev-list --count HEAD..origin/main")) || 0;
    if (behind > 0) {
      throw new Error(`Local main is behind origin/main by ${behind} commit(s). Pull first.`);
    }
    // Ahead-only is fine: that's the release commit we're about to push.
    if (ahead > 0) {
      console.log(`Note: local main is ahead of origin/main by ${ahead} commit(s).`);
    }
  }
}

function checkNpmAuth() {
  try {
    const who = capture("npm whoami");
    console.log(`npm: logged in as ${who}`);
  } catch {
    throw new Error("Not authenticated with npm. Run `npm login` first.");
  }
}

// ─── Build + publish ────────────────────────────────────────────────────────
async function buildAndPublish(ask, version) {
  const publishAns = (await ask("Publish public packages to npm now? (y/N): "))
    .trim()
    .toLowerCase();
  if (publishAns !== "y" && publishAns !== "yes") {
    console.log(
      "Skipped publish. When ready, run:\n" +
        "  pnpm -r --workspace-concurrency=1 build\n" +
        "  pnpm -r publish --access public\n" +
        `  git tag -a ${version} -m "${version}"\n` +
        "  git push origin main --follow-tags",
    );
    return false;
  }

  checkNpmAuth();

  console.log("Building packages...");
  // --workspace-concurrency=1 forces topological ordering so runner's tsc
  // can find roadtest's built types before it compiles.
  if (dryRun) {
    console.log("[dry-run] Would run: pnpm -r --workspace-concurrency=1 build");
    console.log("[dry-run] Would run: pnpm -r publish --access public");
    console.log(`[dry-run] Would tag: ${version}`);
    return true;
  }

  run("pnpm -r --workspace-concurrency=1 build");
  run("pnpm -r publish --access public");
  console.log("Publish complete.");

  run(`git tag -a ${version} -m "${version}"`);
  console.log(`Tagged ${version}.`);

  if (!noPush) {
    const pushAns = (await ask("Push commit + tag to origin? (y/N): ")).trim().toLowerCase();
    if (pushAns === "y" || pushAns === "yes") {
      run("git push origin main --follow-tags");
      console.log("Pushed to origin/main with tags.");
    } else {
      console.log("Skipped push. Run:  git push origin main --follow-tags");
    }
  } else {
    console.log("Skipped push (--no-push). Run:  git push origin main --follow-tags");
  }
  return true;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const rl = createInterface({ input, output });
  const ask = (q) => rl.question(q);

  try {
    preflight();

    const pkgFiles = await findPackageJsons();
    const pkgs = await Promise.all(
      pkgFiles.map(async (file) => ({
        file,
        data: JSON.parse(await readFile(file, "utf8")),
      })),
    );
    if (pkgs.length === 0) throw new Error("No package.json files found under packages/ or apps/.");

    const current = pkgs[0].data.version;
    const mismatched = pkgs.filter((p) => p.data.version !== current);
    if (mismatched.length) {
      console.error("Package versions are out of sync:");
      for (const p of pkgs) console.error(`  ${p.data.name}: ${p.data.version}`);
      throw new Error("Fix version drift before releasing.");
    }

    // Resume path: HEAD is already a release commit for `current` but no tag yet.
    if (!dryRun && headIsReleaseCommit(current) && !tagExists(current)) {
      console.log(
        `Detected pending release: HEAD is chore(release): ${current} but no tag exists.`,
      );
      const resumeAns = (await ask(`Resume (skip bump, go straight to publish + tag)? (y/N): `))
        .trim()
        .toLowerCase();
      if (resumeAns === "y" || resumeAns === "yes") {
        if (capture("git status --porcelain")) {
          throw new Error("Working tree must be clean to resume.");
        }
        const published = await buildAndPublish(ask, current);
        console.log(`\nRelease ${current} ${published ? "done" : "paused"}.`);
        return;
      }
    }

    if (!dryRun && capture("git status --porcelain")) {
      throw new Error("Working tree is not clean. Commit or stash first.");
    }

    console.log(`Current version: ${current}`);

    let bumpType = argBump;
    if (bumpType) console.log(`Release type:    ${bumpType} (from argv)`);
    while (!bumpType) {
      const ans = (await ask("Release type (major/minor/patch): ")).trim().toLowerCase();
      if (BUMP_TYPES.includes(ans)) bumpType = ans;
      else console.log("Please enter one of: major, minor, patch.");
    }
    const newVersion = bumpVersion(current, bumpType);
    console.log(`New version:     ${newVersion}`);

    if (tagExists(newVersion)) {
      throw new Error(
        `Tag ${newVersion} already exists. Delete it (git tag -d ${newVersion}) or bump to a different version.`,
      );
    }

    const lastTag = tryCapture("git describe --tags --abbrev=0");
    const range = lastTag ? `${lastTag}..HEAD` : "";
    if (lastTag) console.log(`\nCommits since ${lastTag}:`);
    else console.log("\nNo prior tag found; using full commit history.");

    const commits = parseCommits(range);
    if (!commits.length) {
      throw new Error("No commits since last release — nothing to release.");
    }

    const groups = categorize(commits);
    const today = new Date().toISOString().slice(0, 10);
    const entry = renderEntry(newVersion, today, groups, lastTag);

    console.log("\n--- Changelog preview ---");
    console.log(entry);
    console.log("--- End preview ---\n");

    if (dryRun) {
      console.log("[dry-run] No files changed, no commit, no publish, no tag.");
      return;
    }

    const confirm = (await ask(`Proceed with release ${newVersion}? (y/N): `)).trim().toLowerCase();
    if (confirm !== "y" && confirm !== "yes") {
      console.log("Aborted. No changes made.");
      return;
    }

    for (const p of pkgs) {
      p.data.version = newVersion;
      await writeFile(p.file, JSON.stringify(p.data, null, 2) + "\n");
    }
    console.log(`Bumped ${pkgs.length} package.json files to ${newVersion}.`);

    await updateChangelog(entry);
    console.log("Updated CHANGELOG.md.");

    try {
      run("pnpm run format");
    } catch {
      console.warn("Warning: `pnpm run format` failed — commit may trip the pre-commit hook.");
    }

    run("git add -A");
    run(`git commit -m "chore(release): ${newVersion}"`);
    console.log(`Committed chore(release): ${newVersion}.`);

    const published = await buildAndPublish(ask, newVersion);
    console.log(
      `\nRelease ${newVersion} ${published ? "done" : "paused (commit made, not tagged)"}.`,
    );
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(`\nRelease failed: ${err.message}`);
  process.exit(1);
});
