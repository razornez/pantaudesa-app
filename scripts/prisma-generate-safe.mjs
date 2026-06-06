import { spawn } from "node:child_process";
import path from "node:path";

function getUserProfile() {
  if (process.env.USERPROFILE) return process.env.USERPROFILE;

  const drive = process.env.HOMEDRIVE ?? "C:";
  const homePath = process.env.HOMEPATH ?? "\\Users\\Default";
  return path.join(drive, homePath);
}

function getNormalizedTempDir() {
  const userProfile = getUserProfile();
  return path.join(userProfile, "AppData", "Local", "Temp");
}

function getPrismaBin() {
  return path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
}

function createPrismaCommand() {
  const prismaBin = getPrismaBin();
  return {
    command: process.execPath,
    args: [prismaBin, "generate"],
  };
}

function getSafeEnv() {
  const env = { ...process.env };

  if (process.platform === "win32") {
    const userProfile = getUserProfile();
    const tempDir = getNormalizedTempDir();

    env.USERPROFILE = userProfile;
    env.HOME = userProfile;
    env.TEMP = tempDir;
    env.TMP = tempDir;
  }

  return env;
}

function printWindowsHint() {
  console.error("");
  console.error("[prisma:generate] Windows guard hint:");
  console.error(
    "- If you still see rename EPERM on query_engine-windows.dll.node, stop the local Next.js dev server first.",
  );
  console.error(
    "- The usual cause is a running node/next process locking src/generated/prisma/query_engine-windows.dll.node.",
  );
}

const prismaCommand = createPrismaCommand();

const prisma = spawn(prismaCommand.command, prismaCommand.args, {
  cwd: process.cwd(),
  env: getSafeEnv(),
  stdio: "inherit",
  shell: false,
});

prisma.on("exit", (code) => {
  if (code !== 0 && process.platform === "win32") {
    printWindowsHint();
  }

  process.exit(code ?? 1);
});

prisma.on("error", (error) => {
  console.error("[prisma:generate] Failed to launch Prisma CLI:", error.message);
  if (process.platform === "win32") {
    printWindowsHint();
  }
  process.exit(1);
});
