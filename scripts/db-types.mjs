import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
// This helper is only for scripts/local-stack.mjs. For the standard CLI use npm run db:types.
const { password } = JSON.parse(await readFile(new URL("../.local-supabase/credentials.json", import.meta.url), "utf8"));
const result = spawnSync("npx", ["supabase", "gen", "types", "--db-url", `postgresql://postgres:${password}@127.0.0.1:54322/postgres`, "--schema", "public"], { encoding: "utf8", env: process.env });
if (result.status !== 0 || !result.stdout.includes("activity_sessions")) throw new Error("Type generation failed. Confirm the local stack is running and migrated.");
await writeFile(new URL("../src/lib/supabase/database.types.ts", import.meta.url), result.stdout);
console.log("Generated database types from the local migrated schema.");
