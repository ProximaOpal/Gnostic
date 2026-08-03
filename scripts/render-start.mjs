import { existsSync } from "node:fs";
import { spawnSync, spawn } from "node:child_process";

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Render's Build Command is currently just `yarn` (install only).
// Always produce dist before serving so the site is not an empty 404.
if (!existsSync("dist/index.html")) {
  console.log("[gnostic] dist/ missing — running vite build…");
} else {
  console.log("[gnostic] refreshing production build…");
}
run("npx", ["--yes", "vite", "build"]);

const port = process.env.PORT || "3000";
console.log(`[gnostic] serving dist on 0.0.0.0:${port}`);
const child = spawn(
  "npx",
  ["--yes", "serve", "-s", "dist", "-l", `tcp://0.0.0.0:${port}`],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  },
);
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
