import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const command = ["supabase", "gen", "types", "typescript", "--local", "--schema", "public"];
const output = process.platform === "win32"
  ? execFileSync(process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe", ["/d", "/s", "/c", `npx ${command.join(" ")}`], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
  : execFileSync("npx", command, { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });

await writeFile(resolve(root, "lib/database.types.ts"), output, "utf8");
console.log(`Wrote ${output.split(/\r?\n/).length} lines to lib/database.types.ts`);
