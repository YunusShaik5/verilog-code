# Enable Google sign-in and private program storage

Production builds stop if the public account settings are missing, so an existing
deployment is not replaced by an unusable sign-in screen.
This release requires account configuration before it can be used. In local/preview builds it intentionally
shows a sign-in/setup screen when configuration is missing. It never falls back to
shared browser storage for private source code.

## 1. Create or connect a Supabase project

Use your own Supabase project. Review its plan and limits before creating it; this
repository does not purchase hosting or storage. The app uses Supabase Auth and
PostgreSQL. A paid tier is not required by the code.

In the SQL editor, run `supabase/migrations/001_private_programs.sql` once.
It creates only the `signal_profiles` and `signal_programs` tables and `signal_*`
functions. It does not change other applications' tables.

The migration enables row-level security. Users can read only their own records;
write operations go through functions that check the authenticated Google user,
lock the account while updating storage usage, and enforce quotas. Do not disable
RLS or grant direct insert/update/delete access to these tables.

## 2. Enable Google login

Follow https://supabase.com/docs/guides/auth/social-login/auth-google.

1. In Google Cloud, configure the OAuth consent screen for this app and create a
   **Web application** OAuth client. Use `openid`, `email`, and `profile` scopes.
2. Add the callback shown in Supabase's Google provider settings as an authorized
   redirect URI (normally `https://YOUR_PROJECT.supabase.co/auth/v1/callback`).
3. Enable **Google** under Supabase Authentication providers. Enter the Google
   client ID and secret there. Keep the client secret out of GitHub and this site.
4. Set Supabase Authentication's Site URL to `https://verilog-code.vercel.app` and
   allow `https://verilog-code.vercel.app/` as a redirect URL. Add exact local or
   preview URLs only when needed for testing.
5. Turn off unused sign-in methods, including anonymous sign-in and email/password.
   Database access additionally requires a signed Google-provider identity.
6. If the Google consent app is in Testing, add your testers. To allow all users,
   complete Google's production publishing requirements.

The button uses Google OAuth with PKCE. No Gmail inbox permission is requested.
Google accounts with Gmail or a Google Workspace address can use it.

## 3. Configure the existing Vercel project

Add these **public** build settings in Vercel Environment Variables:

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key (`sb_publishable_...`). A
  legacy `anon` key also works. **Never use a secret or service-role key.**

Configure both Production and any Preview environment you intend to test.
Use this repository's `main` branch and existing `vercel.json`. The build installs
locked dependencies, bundles the auth client, restores the Verilog engines, and
publishes `public/`. Redeploy after changing environment variables.

The account settings are deliberately public; privacy comes from verified
sessions and database rules, not from hiding a browser key.

## 4. Verify with two real Google accounts

1. Sign in as account A and choose a username. Create `private-test.v`, change its
   design and testbench, save, reload, and reopen it from My private files.
2. Confirm a duplicate username differing only in letter case is rejected for B.
3. Sign out. The previous editor, file list, logs, waveforms and diagrams must clear.
4. Sign in as B with a different username. A's file must be absent. Querying A's
   file ID through Supabase's REST API with B's bearer token must return no rows.
5. Rename, export and delete a file. Change the storage limit and check the meter.
6. Open one file in two tabs, edit/save in each, and confirm stale saves are rejected.
7. Run a lab program, move the waveform cursor, and check transitions and playback.

The automated tests execute the SQL in PostgreSQL WASM and test UI lifecycle and
actual Verilog simulations. They do not substitute for a real Google consent and
callback test against the configured deployment.

## File and storage behavior

- A named program stores `design.v`, `testbench.v`, language, and simulation limit.
- New files have a runnable starter circuit and testbench.
- After the first save, editor changes save automatically. Save forces a save;
  Save as creates a separate copy. Unsaved drafts are kept in memory only.
- Each account has a 5 MiB default code budget, adjustable from 1 to 10 MiB, at
  most 100 programs, and at most 1 MiB of UTF-8 code per program. This is an
  application quota, not a purchase or a reservation of RAM/physical storage.
- Filenames must be unique within an account (case-insensitive). Usernames must
  be globally unique, normalized to lowercase, 3–24 characters.
- Logs, waveform data and compiled results stay in the browser and are cleared
  on sign-out. Source code is uploaded only when saving into the account.
- Previous `signal.workspace.v1` drafts are never loaded automatically because
  they have no verified owner. Export needed old drafts before upgrading.
- Site/database administrators retain administrative access; user privacy means
  other ordinary accounts cannot access your saved programs.

## Local development and tests

```bash
npm ci
npm test
npm run test:labs
# Optional full browser test (uses only local fixture accounts):
npx playwright install chromium
npm run test:browser
# Export public SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in your shell, then:
npm run build
python3 -m http.server 8000 --directory public
```

Configure the exact localhost redirect in Supabase for local Google login. Serving
the source root directly is not supported: `account-client.js` must be bundled.
Do not commit `.env` files, OAuth secrets, login sessions or private user programs.
