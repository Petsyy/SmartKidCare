import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export default function globalSetup() {
  const backendDirectory = fileURLToPath(
    new URL("../../backend", import.meta.url),
  );
  const command =
    process.platform === "win32"
      ? { executable: "cmd.exe", args: ["/d", "/s", "/c", "npm run seed:e2e"] }
      : { executable: "npm", args: ["run", "seed:e2e"] };

  execFileSync(command.executable, command.args, {
    cwd: backendDirectory,
    env: process.env,
    stdio: "inherit",
  });
}
