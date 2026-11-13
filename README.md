# Sakthi Swarup — Portfolio

A cinematic, scroll-driven portfolio: dark, big type, an orange accent, a background video that plays as you scroll, and three interactive dashboards.

The [original portfolio](https://sakthiswarup.netlify.app/) has its own Netlify project.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install     # first time only
npm run dev     # then open http://localhost:3000
```

`npm run build` produces a static site in `out/`. The cinematic portfolio deploys from the `cinematic` branch in its own Netlify project. Netlify supplies the public URL for the sitemap and page metadata during the build.

## Where to change things

| To change | Edit |
|---|---|
| Any text: bio, jobs, projects, skills, certificates, links | `src/content/site.js` |
| Blog posts | Add a Markdown file to `content/blog/` |
| Résumé, certificates, paper | `public/pdf/` |
| Photos | `public/photo/` |
| Background scroll video | `public/videos/scroll.mp4` and `scroll-rev.mp4` (see below) |
| Accent colour | Search for `#ff6b1a` and `--orange` |
| Dashboards | `public/dashboards/` |

### Writing a blog post

Create `content/blog/my-post.md`:

```markdown
---
title: My post title
date: 2026-12-01
summary: One sentence shown on the blog list.
---

Your post, in Markdown.
```

Add `draft: true` to hide a post.

### Replacing the scroll video

The effect needs the clip twice: forwards and reversed, both encoded so every frame can be jumped to.

```bash
ffmpeg -i my-clip.mp4 -an -vf scale=1600:-2 -c:v libx264 -crf 26 -g 2 -pix_fmt yuv420p -movflags +faststart public/videos/scroll.mp4
ffmpeg -i my-clip.mp4 -an -vf "scale=1600:-2,reverse" -c:v libx264 -crf 26 -g 2 -pix_fmt yuv420p -movflags +faststart public/videos/scroll-rev.mp4
```

Phones and visitors who ask for reduced motion get still frames instead (`public/photo/bg-*.jpg`).

## How it is put together

- **Next.js 15 + React 19**, exported as a fully static site. No server, no database.
- **GSAP + Lenis** for scroll animation and smooth scrolling; **Tailwind CSS 4** for styling.
- **Dashboards**: the original hand-written SVG/JavaScript panels (`data.js`, `dashboards.js`) run unchanged inside a frame. `public/dashboards/frame.css` is the only file that restyles them. All dashboard data is synthetic.
- **Contact form** uses Netlify Forms. Enable form detection on the cinematic project and deploy again to register `public/__forms.html`. Add an email notification for the `contact` form under Forms → Submission notifications to receive messages in your inbox. If submission fails, visitors can open a prefilled draft in their email app.
- **Fonts** (Inter, Playfair Display) are bundled with the site.

## The previous site

The earlier hand-built static site is kept in `legacy/` for reference. It is not deployed.

## Credits

Design and animation components are adapted from [Nextjs-cinematic-portfolio](https://github.com/5araang/Nextjs-cinematic-portfolio) by Sarang, used under the MIT License (see `LICENSE`). The admin panel, analytics, database and the author's own media were removed.
