/** Create a NEW public repository and enable Pages. Never overwrites a repository. */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const run = (bin, args) =>
  execFileSync(bin, args, {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  }).trim();
const gh = (...args) => run("gh", args);
try {
  gh("--version");
  gh("auth", "status");
  const owner = gh("api", "user", "--jq", ".login");
  const name = "plastic-bending-visualizer",
    repo = `${owner}/${name}`;
  const repos = gh(
    "api",
    "--paginate",
    "user/repos?affiliation=owner&per_page=100",
    "--jq",
    ".[].full_name",
  ).split("\n");
  if (repos.some((r) => r.toLowerCase() === repo.toLowerCase()))
    throw new Error(`${repo} already exists. Refusing to overwrite it.`);
  const root = run("git", ["rev-parse", "--show-toplevel"]);
  if (resolve(root) !== process.cwd())
    throw new Error("Run from the root of the extracted project repository.");
  if (run("git", ["status", "--porcelain"]))
    throw new Error("Commit all source changes before deploying.");
  if (run("git", ["remote"]))
    throw new Error(
      "A git remote already exists. Review it manually before creating another repository.",
    );
  run("npm", ["test"]);
  run("npm", ["run", "build"]);
  // Start without pushing, so Pages is ready before the first workflow run.
  gh(
    "repo",
    "create",
    repo,
    "--public",
    "--source",
    ".",
    "--remote",
    "origin",
    "--description",
    "An interactive 3D exhibit exploring plastic bending, whitening and energy dissipation",
  );
  gh(
    "api",
    "--method",
    "POST",
    `repos/${repo}/pages`,
    "-f",
    "build_type=workflow",
  );
  run("git", ["push", "-u", "origin", "main"]);
  console.log(`Source: https://github.com/${repo}`);
  console.log(
    `Expected Pages URL (verify after workflow succeeds): https://${owner}.github.io/${name}/`,
  );
  console.log(`Watch deployment: gh run list --repo ${repo}`);
} catch (e) {
  console.error("Deployment stopped:", e.stderr?.toString() || e.message);
  console.error(
    "Requires GitHub CLI with repo and workflow permissions. If a new repository was created before a later step failed, keep it and finish Pages setup from its Settings → Pages; this script intentionally refuses to overwrite or reuse an existing repository.",
  );
  process.exitCode = 1;
}
