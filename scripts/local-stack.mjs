/** A small, disposable LOCAL test stack. Hosted credentials are never generated or changed. */
import { randomBytes, createHmac } from "node:crypto";
import { mkdir, writeFile, readFile, access, chmod } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, ".local-supabase");
const composeFile = resolve(dir, "compose.json");
function run(command, args, input) {
  const result = spawnSync(command, args, { cwd: root, input, encoding: "utf8", stdio: input ? ["pipe", "inherit", "inherit"] : "inherit" });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
function compose(...args) { run("docker", ["compose", "-p", "bu-local", "-f", composeFile, ...args]); }
const command = process.argv[2] || "start";
if (command === "stop") { compose("stop"); process.exit(0); }
if (command === "sql-test") {
  run("docker", ["exec", "-i", "bu-local-db", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], await readFile(resolve(root, "supabase/tests/security.sql"), "utf8"));
  process.exit(0);
}
if (command !== "start") throw new Error("Use start, stop, or sql-test");
await mkdir(dir, { recursive: true, mode: 0o700 });
let secrets;
try { secrets = JSON.parse(await readFile(resolve(dir, "credentials.json"), "utf8")); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  secrets = { password: randomBytes(24).toString("hex"), jwt: randomBytes(48).toString("hex") };
  await writeFile(resolve(dir, "credentials.json"), JSON.stringify(secrets), { mode: 0o600 });
}
function jwt(role) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role, iss: "supabase-local", iat: 1700000000, exp: 2208988800 })).toString("base64url");
  return `${header}.${payload}.${createHmac("sha256", secrets.jwt).update(`${header}.${payload}`).digest("base64url")}`;
}
const anon = jwt("anon");
const bootstrap = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login noinherit password '${secrets.password}';
grant anon, authenticated, service_role to authenticator;
create role supabase_auth_admin login createrole password '${secrets.password}';
create schema auth authorization supabase_auth_admin;
create schema extensions;
create extension pgcrypto with schema extensions;
grant usage on schema public, auth, extensions to anon, authenticated, service_role;
grant all on schema public to supabase_auth_admin;
alter role supabase_auth_admin set search_path to auth, public, extensions;
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role' $$;
create function auth.email() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email' $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;
`;
await writeFile(resolve(dir, "bootstrap.sql"), bootstrap, { mode: 0o600 });
await writeFile(resolve(dir, "kong.yml"), `_format_version: '2.1'
consumers:
  - username: local-anon
    keyauth_credentials:
      - key: ${anon}
services:
  - name: auth
    url: http://auth:9999/
    routes:
      - name: auth
        paths: [/auth/v1/]
        strip_path: true
  - name: rest
    url: http://rest:3000/
    routes:
      - name: rest
        paths: [/rest/v1/]
        strip_path: true
plugins:
  - name: key-auth
    config:
      key_names: [apikey]
      hide_credentials: true
  - name: cors
`, { mode: 0o644 });
const stack = {
  services: {
    db: { image: "postgres:17-alpine", container_name: "bu-local-db", environment: { POSTGRES_PASSWORD: secrets.password }, ports: ["127.0.0.1:54322:5432"], volumes: ["database:/var/lib/postgresql/data"], healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: "2s", retries: 30 } },
    auth: { image: "supabase/gotrue:v2.197.0", environment: {
      GOTRUE_API_HOST: "0.0.0.0", GOTRUE_API_PORT: "9999", API_EXTERNAL_URL: "http://127.0.0.1:54321",
      GOTRUE_DB_DRIVER: "postgres", GOTRUE_DB_DATABASE_URL: `postgres://supabase_auth_admin:${secrets.password}@db:5432/postgres`,
      GOTRUE_SITE_URL: "http://127.0.0.1:3000", GOTRUE_URI_ALLOW_LIST: "http://127.0.0.1:3000/**,http://localhost:3000/**",
      GOTRUE_JWT_SECRET: secrets.jwt, GOTRUE_JWT_EXP: "3600", GOTRUE_JWT_AUD: "authenticated", GOTRUE_JWT_DEFAULT_GROUP_NAME: "authenticated", GOTRUE_JWT_ADMIN_ROLES: "service_role",
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true", GOTRUE_MAILER_AUTOCONFIRM: "true", GOTRUE_PASSWORD_MIN_LENGTH: "10", GOTRUE_RATE_LIMIT_EMAIL_SENT: "1000",
    }, depends_on: { db: { condition: "service_healthy" } }, healthcheck: { test: ["CMD", "wget", "-Y", "off", "-q", "--spider", "http://127.0.0.1:9999/health"], interval: "2s", retries: 30 } },
    rest: { image: "postgrest/postgrest:v16.5", environment: {
      PGRST_DB_URI: `postgres://authenticator:${secrets.password}@db:5432/postgres`, PGRST_DB_SCHEMAS: "public", PGRST_DB_ANON_ROLE: "anon", PGRST_JWT_SECRET: secrets.jwt,
    }, depends_on: { auth: { condition: "service_healthy" } } },
    gateway: { image: "kong:2.8.1", environment: { KONG_DATABASE: "off", KONG_DECLARATIVE_CONFIG: "/kong.yml", KONG_PROXY_ACCESS_LOG: "off", KONG_ADMIN_ACCESS_LOG: "off", KONG_ADMIN_LISTEN: "off", KONG_DNS_ORDER: "LAST,A,CNAME" }, ports: ["127.0.0.1:54321:8000"], volumes: [`${dir}/kong.yml:/kong.yml:ro`], depends_on: ["auth", "rest"] },
  }, volumes: { database: {} },
};
await chmod(resolve(dir, "kong.yml"), 0o644);
await writeFile(composeFile, JSON.stringify(stack, null, 2), { mode: 0o600 });
compose("up", "-d", "--wait", "db");
const bootstrapped = spawnSync("docker", ["exec", "bu-local-db", "psql", "-U", "postgres", "-Atc", "select 1 from pg_roles where rolname='supabase_auth_admin'"], { encoding: "utf8" });
if (bootstrapped.status !== 0) throw new Error("Cannot check local database roles");
if (!bootstrapped.stdout.trim()) run("docker", ["exec", "-i", "bu-local-db", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1"], `begin;\n${bootstrap}\ncommit;`);
run("docker", ["exec", "bu-local-db", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-c", "alter function auth.uid() owner to supabase_auth_admin; alter function auth.role() owner to supabase_auth_admin; alter function auth.email() owner to supabase_auth_admin;"]);
compose("up", "-d", "--wait");
run("docker", ["exec", "-i", "bu-local-db", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1"], `create or replace function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;`);
// Apply each migration once, transactionally. A failed migration cannot be recorded as applied.
run("docker", ["exec", "bu-local-db", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-c", "create schema if not exists bu_local; create table if not exists bu_local.migrations (name text primary key); revoke all on schema bu_local from public;" ]);
const { readdir } = await import("node:fs/promises");
for (const file of (await readdir(resolve(root, "supabase/migrations"))).filter((name) => /^\d+_[\w-]+\.sql$/.test(name)).sort()) {
  const applied = spawnSync("docker", ["exec", "bu-local-db", "psql", "-U", "postgres", "-Atc", `select name from bu_local.migrations where name = '${file}'`], { encoding: "utf8" });
  if (applied.status !== 0) throw new Error("Cannot read migration history");
  if (applied.stdout.trim()) continue;
  run("docker", ["exec", "-i", "bu-local-db", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1"], `begin;\n${await readFile(resolve(root, "supabase/migrations", file), "utf8")}\ninsert into bu_local.migrations values ('${file}');\ncommit;`);
}
run("docker", ["exec", "bu-local-db", "psql", "-U", "postgres", "-c", "notify pgrst, 'reload schema';"]);
let ready = false;
for (let attempt = 0; attempt < 20; attempt++) {
  try { const response = await fetch("http://127.0.0.1:54321/auth/v1/health", { headers: { apikey: anon } }); if (response.ok) { ready = true; break; } } catch { /* Wait for gateway. */ }
  await new Promise((done) => setTimeout(done, 500));
}
if (!ready) throw new Error("Local auth readiness check failed");
try { await access(resolve(root, ".env.local")); console.log("Existing .env.local preserved; local public config is in .local-supabase/app.env."); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  await writeFile(resolve(root, ".env.local"), `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${anon}\nNEXT_PUBLIC_APP_URL=http://127.0.0.1:3000\n`, { mode: 0o600 });
}
await writeFile(resolve(dir, "app.env"), `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${anon}\nNEXT_PUBLIC_APP_URL=http://127.0.0.1:3000\n`, { mode: 0o600 });
console.log("Local Supabase Auth + PostgreSQL + PostgREST ready. Only loopback ports are published. No remote project was changed.");
