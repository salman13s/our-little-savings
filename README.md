# Our Little Savings

A private, invitation-only savings dashboard built with React, Vite and Supabase.

## What visitors see

- Signed-out visitors see a neutral landscape image and a sign-in form.
- The savings dashboard is rendered only after a valid Supabase session exists.
- Signed-in non-admin users can view deposits but cannot add, edit or delete them.
- Admin users can manage deposits and approve or decline access requests.
- Public account registration should be disabled in Supabase. The access-request form does not create accounts; approval sends a Supabase invitation.

The GitHub Pages site itself is still publicly reachable. The image and frontend JavaScript are public; savings data is protected by Supabase Row Level Security (RLS). Never put a service-role key in frontend code or GitHub Pages build variables.

## 1. Supabase database

For a new project, run `supabase/schema.sql` in Supabase SQL Editor.

For the already-existing project, run `supabase/access_requests.sql` in SQL Editor. Your existing `deposits` policies should be:

- SELECT: `authenticated users can view deposits` for `authenticated`.
- INSERT/UPDATE/DELETE: the three admin policies, each checking `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`.
- No SELECT policy for `anon`.

Disable public signups in Supabase Dashboard → Authentication → Settings (the exact section label can vary) → turn off **Allow new users to sign up**. Existing users and admin-created invitations can still sign in.

Ensure your own account has `app_metadata.role = admin`. After changing app metadata, sign out and sign back in so the JWT refreshes.

## 2. Deploy the access-request Edge Function

The request form and admin approval queue use `supabase/functions/access-request/index.ts`. The function uses the service-role key only on the server. It is not included in the website bundle.

Install the Supabase CLI, sign in, and link this folder to your existing Supabase project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy the function (the function performs its own admin authorization checks):

```bash
supabase functions deploy access-request --no-verify-jwt
```

### Email notifications

The function can email you when someone submits an access request. Create a Resend account and verify a sending domain/address. Then set these Edge Function secrets:

```bash
supabase secrets set ADMIN_EMAIL=you@example.com RESEND_API_KEY=re_xxxxxxxxx RESEND_FROM_EMAIL='Private Space <access@your-verified-domain.com>' SITE_URL='https://YOUR_GITHUB_USERNAME.github.io/our-little-savings/'
```

Replace the example values. `RESEND_FROM_EMAIL` must be an address/domain verified with Resend. Without these secrets, access requests are still saved and visible in the admin dashboard, but email notifications will not be sent.

When you approve a request, Supabase sends an invitation email using your Supabase Auth email settings. Configure custom SMTP in Supabase for reliable delivery; the built-in email service has restrictive rate limits.

## 3. GitHub Pages deployment

The project uses the existing GitHub Actions workflow in `.github/workflows/deploy.yml`. Keep the repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable/anon key only)

Do not add the service-role key to GitHub secrets used by the Vite build. Commit and push the updated project to the `main` branch; GitHub Actions will build and deploy it.

## 4. Approving your girlfriend later

When you have her email address:

1. Open the site while signed in as admin.
2. She can submit an access request, or you can create/invite her directly in Supabase Authentication → Users.
3. Approve her request in the **Access requests** panel. The function sends a Supabase invitation to her email.
4. Do not set `app_metadata.role = admin` for her. Regular authenticated users can view the dashboard but cannot modify deposits.

## 5. Test before sharing

1. Open the site in a private/incognito browser. You should see only the neutral landscape and sign-in form.
2. Submit a test access request. It should appear in the admin dashboard; email arrives only after Resend is configured.
3. Sign out. Savings amounts and history must not appear.
4. Sign in as admin. Confirm you can view and manage deposits and see the request queue.
5. Confirm there is no `anon` SELECT policy on `public.deposits`.

The request form is public by design, so it can receive spam. For a public-facing deployment with significant traffic, add CAPTCHA/rate limiting before sharing widely.
