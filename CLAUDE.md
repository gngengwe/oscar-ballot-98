# Oscar Ballot 98 — Project Instructions

## Hosting: ngengwe.com (HostMonster)

**CRITICAL — FTP folder mapping:**
- FTP host: `ftp.ngengwe.com`, port 21
- The FTP **root `/` is the web root** for `www.ngengwe.com`
- To deploy a project at `www.ngengwe.com/{project_name}`, upload to `ftp://ftp.ngengwe.com/{project_name}/`
- `ftp://ftp.ngengwe.com/public_html/` is a subfolder — NOT the web root ❌
- Never upload site files into `public_html/` — it does not map to the domain root

**Deploy any project to ngengwe.com/{project_name}:**
```bash
curl --user "gngengwe@ngengwe.com:<password>" \
  -T localfile.html \
  "ftp://ftp.ngengwe.com/{project_name}/index.html"
```

## This App (Oscar Ballot)

- **Live URL:** https://oscars-gray.vercel.app
- **Redirect:** `www.ngengwe.com/oscars` → FTP root `/oscars/index.html`
- **GitHub:** https://github.com/gngengwe/oscar-ballot-98 (branch: `main`)
- **Vercel project:** gngengwes-projects/oscars
- **Database:** Neon PostgreSQL (connection strings in `.env`)
- **Admin login:** gngengwe@gmail.com / changeme123

## Local Development

```bash
cd C:\HK_Clearway\oscars
npm install
npm run dev       # runs at http://localhost:3000
```

## Deploy to Vercel

```bash
npx vercel --token <token> --prod --yes --scope gngengwes-projects
```
Or push to `main` — Vercel auto-deploys from GitHub.
