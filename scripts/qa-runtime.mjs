import { spawn } from "node:child_process";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

const BASE_URL = process.env.QA_RUNTIME_BASE_URL ?? "http://localhost:3000";
const SMOKE_TIMEOUT_MS = Number(process.env.QA_RUNTIME_SMOKE_TIMEOUT_MS ?? 45_000);

function runNodeScript(scriptPath) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", (error) => {
      console.error(`[qa:runtime] Failed to run ${scriptPath}: ${error.message}`);
      resolve(1);
    });
  });
}

async function fetchWithTimeout(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SMOKE_TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    return {
      ok: response.ok,
      status: response.status,
      length: (await response.text()).length,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function printSmoke(label, result) {
  console.log(
    `[qa:runtime] ${label}: status=${result.status} ok=${result.ok} length=${result.length}`,
  );
}

const doctorExitCode = await runNodeScript("scripts/db-doctor.mjs");
if (doctorExitCode !== 0) {
  console.error("[qa:runtime] db:doctor failed. Stop before browser/API smoke.");
  process.exit(doctorExitCode);
}

try {
  const publicDetail = await fetchWithTimeout("/desa/batukarut");
  printSmoke("public detail /desa/batukarut", publicDetail);
  if (!publicDetail.ok) process.exit(1);
} catch (error) {
  console.error(
    `[qa:runtime] public detail smoke failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}

const internalCookie = process.env.QA_INTERNAL_ADMIN_COOKIE;
if (!internalCookie) {
  console.log(
    "[qa:runtime] internal admin API smoke skipped: QA_INTERNAL_ADMIN_COOKIE is not set.",
  );
  process.exit(0);
}

try {
  const templates = await fetchWithTimeout("/api/internal-admin/village-data/templates", {
    headers: {
      cookie: internalCookie,
    },
  });
  printSmoke("internal templates API", templates);
  if (!templates.ok) process.exit(1);
} catch (error) {
  console.error(
    `[qa:runtime] internal templates API smoke failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}
