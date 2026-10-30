# Vercel and hosted Supabase preparation

This project uses the existing GitHub repository **[melisa0312-arch/boo-app](https://github.com/melisa0312-arch/boo-app)**. The application is at the repository root. No second repository, Vercel project, public deployment, or remote database change is created by this preparation.

## What is ready

- Next.js App Router with server rendering, Server Actions, Proxy, and Supabase SSR cookies. Use Vercel's Next.js integration, not GitHub Pages or a static export.
- `package-lock.json`, Node 24 in `.nvmrc` and `package.json`, `npm ci`, and `npm run build`.
- `vercel.json` declares the framework and installation/build commands. `git.deploymentEnabled` is **false**, intentionally preventing automatic deployments from Git pushes. Do not change it until a deployment workflow is explicitly authorized. A manual deployment is a separate action and is not blocked by this setting.
- `.gitignore` and `.vercelignore` exclude environment files, generated credentials, local database state, dependencies, builds, logs, and browser artifacts. Even `.env.example` is not uploaded; variable names are documented here instead. SQL test fixtures contain synthetic data only.

## Exact next browser step — connect GitHub without deploying

1. Open **[vercel.com/new](https://vercel.com/new)** and sign in to the Vercel account/team that should own BŪ.
2. Under **Import Git Repository**, choose GitHub. If Vercel is not connected, choose **Continue with GitHub** or the GitHub connection prompt. Authorize Vercel for the intended GitHub account.
3. If `boo-app` is missing, use **Adjust GitHub App Permissions** / **Configure GitHub App**. On GitHub, choose account `melisa0312-arch`, select **Only select repositories**, select **boo-app**, then **Install & Authorize** or **Save**. Return to Vercel and refresh the repository list. Do not create a new GitHub repository.
4. Beside **melisa0312-arch/boo-app**, click **Import**. This opens the project configuration form. Use the settings below.
5. **Stop before clicking Deploy.** Importing a Git repository normally leads to an initial production deployment, even if its address ends in `.vercel.app`. A `.vercel.app` address is not proof that a deployment is a protected Preview. Public deployment is not authorized yet.

The exact GitHub authorization button label may depend on whether the Vercel app was already installed. Grant access only to the existing repository. Git pushes from the prepared workspace use the platform's existing GitHub authentication; no token needs to be pasted into chat or committed.

## Vercel project settings

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | Repository root (`./`) |
| Node.js Version | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave the Next.js default; do not set `out` or use a static export |
| Production Branch | `main` when a production workflow is approved |
| Git automatic deployments | Disabled by `vercel.json` |

Vercel runs the Next.js server functions; it does not run the local Docker stack. Do not run `npm run local:start`, the Supabase CLI stack, or database migrations as a Vercel install/build command. The deployed app needs a hosted Supabase project.

For the later private testing workflow, configure **Project Settings → Deployment Protection → Vercel Authentication** for Preview deployments and use an actual **Preview** deployment target. Check the protection available on the selected plan; do not assume an initial Production deployment is covered. Access for Stefan may require a supported protected-sharing option. Authentication inside BŪ still applies independently of Vercel protection. No preview URL exists until a deployment is explicitly created and succeeds.

## Hosted Supabase requirements

Create a dedicated Supabase project for preview testing so synthetic tests and experiments do not use production user data. Keep all actual values in Supabase/Vercel settings, not GitHub, environment-file uploads, or chat.

| Vercel environment variable | Required value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The hosted project's HTTPS project URL from Supabase Project Settings / API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The same project's browser-safe publishable key, or legacy anon key |
| `NEXT_PUBLIC_APP_URL` | The exact HTTPS origin of this deployment, without a trailing slash |

Set these for the **Preview** environment when preparing a Preview deployment. Set Production values separately only when a production release is approved. Never use the workspace's `localhost`/`127.0.0.1` URLs or locally generated credentials on Vercel. No `SUPABASE_SERVICE_ROLE_KEY`, database password, private JWT key, or Supabase access token is required by the deployed app. Never assign such credentials to any `NEXT_PUBLIC_*` variable.

`NEXT_PUBLIC_APP_URL` controls confirmation and invitation links. Copy the real assigned deployment origin from Vercel; do not guess an available hostname. If an initial frontend-only preview is later authorized before hosted Supabase is configured, public screens can render with an explicit configuration message, but signup, login, and database features are unavailable. After the origin and all variables are known, set them and redeploy before testing authentication and invitations. Vercel environment changes affect new deployments; they do not rewrite an already built deployment.

## Migrations and authentication

Review and apply these migrations, in order, to the new hosted Supabase project:

1. `supabase/migrations/202610300001_foundation.sql`
2. `supabase/migrations/202610300002_session_defaults.sql`

The Supabase Dashboard **SQL Editor → New query** can apply each file without a local installation. Review the target project and migration contents first. For an existing database, inspect its migration state and take an appropriate backup; do not paste migrations blindly or reset a remote database. No remote migration is applied by this GitHub upload or Vercel build.

In **Supabase → Authentication → URL Configuration**:

- Set **Site URL** to the exact approved testing origin while using the dedicated preview project.
- Add that origin's exact `/auth/confirm` URL under **Redirect URLs**. Add each additional approved origin explicitly; use a stable protected preview address where possible. A new generated deployment hostname may require another allowed redirect and a matching `NEXT_PUBLIC_APP_URL`.
- In **Authentication → Email / Email Templates → Confirm signup**, keep email confirmations enabled and use `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email` for the confirmation link. The app also supports the PKCE `code` callback.
- Configure a mail provider/SMTP for sending to the two real accounts. Supabase's built-in mail delivery has restrictions and is not a reliable replacement for configured production mail.
- Set the minimum password length to at least 10; keep anonymous sign-ins disabled for this account-based product. Review rate limits for the small private audience.
- Retain the migration's RLS policies and function grants. The application must connect with its public key plus the signed-in user's session, never a service-role bypass.

## Verification after an approved protected deployment

Open Vercel's assigned HTTPS URL directly in Chrome, not inside the cloud workspace's Web Preview. Check the Bulgarian welcome, English switch, signup/email confirmation, login/logout, two independent accounts, invitation acceptance, own-profile editing, an overnight Tonight draft, and persistence after refresh in both accounts. Recheck denied third-user access against the hosted database. The local checks in `VALIDATION.md` do not establish hosted email delivery or Vercel behavior.

Future code pushes remain deployment-disabled until the user approves enabling them. After approval, a branch-specific `git.deploymentEnabled` mapping can allow selected preview branches while keeping `main` disabled until the production release is approved. Record that decision before changing the current switch.
