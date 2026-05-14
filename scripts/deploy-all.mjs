#!/usr/bin/env node
/**
 * One-shot: create GitHub repo `task-manager-app` (if missing), push `main`, deploy to Vercel production.
 * Requires (env or ./.env.deploy):
 *   GITHUB_TOKEN — classic PAT with `repo` scope (or fine-grained: Contents + Metadata write)
 *   VERCEL_TOKEN — Vercel token (https://vercel.com/account/tokens)
 * Optional:
 *   GITHUB_REPO — default task-manager-app
 *   GITHUB_ORG — if set, create under org instead of user
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvFile(".env.deploy");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const REPO = process.env.GITHUB_REPO || "task-manager-app";
const ORG = process.env.GITHUB_ORG || "";

if (!GITHUB_TOKEN) {
  console.error(
    "Missing GITHUB_TOKEN. Set it in the environment or create .env.deploy (see .env.deploy.example).",
  );
  process.exit(1);
}

const api = (path, opts = {}) =>
  fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...opts.headers,
    },
  });

const userRes = await api("/user");
if (!userRes.ok) {
  console.error("GitHub /user failed:", userRes.status, await userRes.text());
  process.exit(1);
}
const me = await userRes.json();
const login = me.login;
if (!login) {
  console.error("Unexpected /user payload", me);
  process.exit(1);
}

const owner = ORG || login;
const createUrl = ORG ? `/orgs/${ORG}/repos` : "/user/repos";

let exists = false;
const getRes = await api(`/repos/${owner}/${REPO}`);
if (getRes.status === 200) exists = true;
else if (getRes.status !== 404) {
  console.error("GitHub repo check failed:", getRes.status, await getRes.text());
  process.exit(1);
}

if (!exists) {
  const body = JSON.stringify({
    name: REPO,
    private: false,
    auto_init: false,
  });
  const cr = await api(createUrl, { method: "POST", body });
  const t = await cr.text();
  if (!cr.ok && cr.status !== 422) {
    console.error("Create repo failed:", cr.status, t);
    process.exit(1);
  }
  if (cr.status === 422 && /already exists/i.test(t))
    console.log("Repo already exists (422), continuing.");
  else if (!cr.ok) console.log("Create repo:", cr.status, t);
  else console.log("Created repository", `${owner}/${REPO}`);
} else {
  console.log("Repository exists:", `${owner}/${REPO}`);
}

const authedRemote = `https://x-access-token:${GITHUB_TOKEN}@github.com/${owner}/${REPO}.git`;
const cleanRemote = `https://github.com/${owner}/${REPO}.git`;

function sh(cmd, opts = {}) {
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

try {
  sh("git remote remove origin 2>/dev/null || true");
} catch {
  /* none */
}
sh(`git remote add origin "${authedRemote}"`);
sh("git branch -M main");
process.env.GIT_TERMINAL_PROMPT = "0";
sh("git push -u origin main");
sh(`git remote set-url origin "${cleanRemote}"`);

console.log("Pushed to", cleanRemote);

if (VERCEL_TOKEN) {
  console.log("Deploying to Vercel (production)…");
  execSync(`npx --yes vercel@latest deploy --prod --yes`, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, VERCEL_TOKEN },
  });
  console.log("Vercel deploy finished.");
} else {
  console.warn(
    "VERCEL_TOKEN not set — skipped Vercel deploy. Import the GitHub repo on vercel.com or set VERCEL_TOKEN and re-run.",
  );
}
