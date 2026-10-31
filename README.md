<<<<<<< HEAD
# Our Little Savings

A small USD savings dashboard with a romantic/elegant design. Deposits are stored in Supabase; the total is calculated from the deposit records.

## Free services

- GitHub Pages: static website hosting (free for public repositories).
- Supabase Free: Postgres database and authentication (subject to free-tier limits).
- React + Vite: free, open-source frontend.

No paid service is required for the starter setup. Free-tier terms and limits can change. Supabase free projects may pause after periods of inactivity; check its current plan details before relying on it long term.

## 1. Create the database

1. Create a free project at https://supabase.com.
2. In **Authentication → Users**, create your admin user.
3. Open **SQL Editor** and mark that account as admin (replace the email):
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'YOUR_ADMIN_EMAIL';
   ```
4. Run `supabase/schema.sql` in the SQL Editor.
5. In **Project Settings → API**, copy the Project URL and anon/public key.

Never use the `service_role` key in the frontend.

## 2. Configure and run locally

```bash
npm install
cp .env.example .env
```

Put your Supabase URL and anon/public key in `.env`, then:

```bash
npm run dev
```

Open the local URL printed by Vite. Use **Admin sign in** with the admin account you created. The admin account can add, edit, and delete deposits. Other signed-in accounts can only view.

## 3. Choose the viewing privacy

**Option A — anyone with the link (no password):** keep the `public can view deposits` policy in `schema.sql`. The public page is read-only.

**Option B — password-protected viewing:** run this SQL:
```sql
drop policy if exists "public can view deposits" on public.deposits;
```
Then create a separate viewer user in Supabase Auth and share those viewer credentials with her. She signs in to view; she cannot change deposits. Do not share your admin login.

To return to public viewing, run:
```sql
create policy "public can view deposits"
on public.deposits for select
to anon
using (true);
```

The optional password mode uses a viewer login rather than a single shared page password. This keeps the database protected by Supabase Auth and RLS.

## 4. Publish free on GitHub Pages

1. Create a **public** GitHub repository and upload this project (do not upload `.env`).
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
3. Add repository secrets under **Settings → Secrets and variables → Actions**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Add this workflow as `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

5. In `vite.config.js`, set `base` to your repository name, e.g. `base: "/our-little-savings/"`, before deploying to a project Pages URL. For a custom domain or username.github.io repository, use `base: "/"`.
6. GitHub Actions will publish the website and show its URL under **Settings → Pages**.

## Security notes

- The anon key is designed to be public; Row Level Security (RLS) is what protects the data.
- Never expose the Supabase service-role key.
- The admin account is authorized by the `role=admin` value in its Supabase app metadata. Only set this value for your own account, never for the viewer account.
- The public read policy intentionally exposes the deposit amounts, dates, and notes to anyone who can reach the site. Use password mode if you do not want that.
- This starter is a small personal ledger, not a bank account and not a place to store payment credentials.
=======
# our-little-savings-
little program that shows the accumalated budget 
>>>>>>> 4c22d8bd941b6f3b3f756c037cad867a71b0c12e
