# HI!

This is the repository for my website.

React + Vite, hand-written CSS, no analytics. Two canvas things going on:
a retro pipes screensaver behind the whole page, and a mouse-reactive ASCII
field behind the hero.

## Local

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # serve dist/ locally
```

## Hosting: GitHub -> Cloudflare Pages

1. Push to GitHub. The remote is already set up:

   ```sh
   git push origin main
   ```

2. Cloudflare dashboard -> **Workers & Pages** -> **Create** -> **Pages** ->
   **Connect to Git** -> pick this repo.
   - Private repo is fine: when prompted, give the *Cloudflare Pages* GitHub app
     access to this repository. That permission grant is the part that used to
     make Cloudflare angry.

3. Build settings (auto-filled if you choose the **Vite** framework preset):
   - build command: `npm run build`
   - output directory: `dist`

4. Deploy. You get `<project>.pages.dev`. Every push to `main` redeploys it,
   and every pull request gets its own preview URL.

5. Custom domain (if you want one): **Settings -> Domains** on the Pages project.

### Alternative: no Git integration

Direct upload from your machine works too:

```sh
npm run build
npx wrangler pages deploy dist
```
