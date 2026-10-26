# Houston Apollos — team website

The website for the University of Houston's University Rover Challenge team.

**The audience is sponsors.** Every page is written for someone deciding whether to back
the team; students are recruited through other channels, so there is deliberately no
"join us" page. Keep that in mind before adding anything.

Plain HTML, CSS and JavaScript. **No build step, no npm, no framework.** Edit a file,
commit it, and GitHub Pages publishes it. Anyone on the team can maintain this, including
the officers who take over after we graduate.

---

## Run it locally

Double-click `index.html` — that's it. Everything works from the filesystem.

If you'd rather serve it properly (closer to how GitHub Pages behaves):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Publish it

1. Push to `main`.
2. On GitHub: **Settings → Pages**.
3. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: `main` / `(root)`**.
4. Save. The site goes live at `https://<org-or-user>.github.io/<repo>/` in a minute or two.

Using a custom domain (e.g. `marsrover.uh.edu`)? Add it under Settings → Pages and create a
file named `CNAME` in the repo root containing just that domain.

---

## Files

```
index.html        Home — hero, mission, the four URC missions, sponsors
sponsors.html     Our sponsors, why sponsor, tiers, in-kind support
contact.html      Email, contact form, and who to write to about what
404.html          Shown for any URL that doesn't exist (styles inlined, see below)
assets/css/style.css   All styling. Colours live in the :root block at the top.
assets/js/main.js      Nav drawer, scroll reveals, stat counters, interactive starfield
assets/img/            Logo, favicon, social card
assets/img/sponsors/   Sponsor logos
assets/fonts/          Self-hosted Inter and Space Grotesk (no CDN)
```

---

## Competition facts

The competition details on the site (mission names, dates, the down-select, the budget
cap) were taken from **University Rover Challenge 2027 — Requirements and Guidelines**,
published by The Mars Society. The rules change every year, sometimes substantially — the
2027 Autonomy Mission is nothing like the waypoint course it replaced, and the Science
Mission is now the Astrobiology Mission. **Re-check these against the current rule set
each season** rather than carrying them forward:

| On the site | Source |
| --- | --- |
| The four mission names and what each involves | Rules §1.b–1.e |
| June 2–5, 2027, MDRS near Hanksville, Utah | Rules §3.a.iv |
| Top 36 teams at the System Acceptance Review | Rules §3.a.iii |
| $26,000 cap on fielded equipment | Rules §3.c.iii |
| PDR 2 Dec 2026, SAR 5 Mar 2027 | Rules §3.a.ii–iii |

## Voice

Section headings are plain names — "About the Team", "Competition Missions",
"Sponsorship", "Contact Us" — not slogans. There are deliberately no small kicker labels
above headings; that pattern is what made an earlier draft read as generated rather than
written. Keep the prose declarative, use American spelling, and resist the em-dash aside.

## Editing guide

Search the HTML for `EDIT:` — every placeholder is flagged with a comment. The short list:

| What | Where |
| --- | --- |
| Team name | The `.brand` block in every page's header and footer |
| Email address | `apollos@uh.edu` — find & replace across the pages |
| Social links | The `.socials` block in every footer, and `contact.html` |
| Sponsors and tier amounts | `sponsors.html` |

### Adding a sponsor

Drop the logo in `assets/img/sponsors/` — an SVG, or a PNG with a **transparent
background** so it sits on the dark panel rather than in a white box. Then copy the
existing `<article class="sponsor">` block in `sponsors.html` and change the name, link and
description. The grid goes to two columns on its own once there is more than one.

The same block also appears on the home page under "Our sponsor"; keep your top-tier
sponsors there and the full list on the sponsors page. Update the heading from "Our
sponsor" to "Our sponsors" when the second one arrives.

### Making the contact form actually send

The form in `contact.html` posts to a placeholder endpoint. Pick one:

- **Formspree** (easiest): create a form at [formspree.io](https://formspree.io), then
  replace `YOUR_FORM_ID` in the `action` attribute.
- **Google Forms**: delete the `<form>` block and paste your form's embed `<iframe>` in
  its place.

Until one of those is done, the `mailto:` link under the form is the working path.

### Fonts

Inter and Space Grotesk are **self-hosted** in `assets/fonts/` — the site makes no
third-party requests at all, so it renders identically on a locked-down campus network and
loading type doesn't tell anyone else who's reading the page.

Both are variable fonts, so one file covers every weight. The `latin-ext` files are only
fetched if a visitor hits a character in that range, which means English pages download
about 70 KB of type total.

Both are licensed under the SIL Open Font License 1.1, which permits redistribution like
this. To refresh them, download the `latin` and `latin-ext` woff2 files from Google Fonts
for Inter (400–600) and Space Grotesk (500–700), drop them in `assets/fonts/`, and update
the `src` lines in `fonts.css`.

### Social preview card

`assets/img/social-card.png` (1200×630) is what shows when someone shares a link to the
site. It's a screenshot of a small HTML card, so re-making it after a rebrand is easy:
build a 1200×630 page with the new artwork and screenshot it at that exact size.

Once the site has a real domain, make the `og:image` in each page's `<head>` an **absolute**
URL (`https://yourdomain/assets/img/social-card.png`) — some scrapers won't resolve a
relative one.

### The 404 page

`404.html` is served automatically by GitHub Pages for any URL that doesn't exist. Its
styles are **inlined on purpose**: a 404 can be served at any path depth, and a stylesheet
referenced relatively would 404 too, leaving an unstyled page. If you restyle the site, it
needs its colours updated by hand — it's the one file that doesn't follow `style.css`.

### Changing the colours

Everything comes from custom properties at the top of `assets/css/style.css`:

```css
--scarlet: #c90000;   /* the site's red (UH's official scarlet is #C8102E) */
--black:   #08090b;
--surface-1: #121318;
```

Change those three and the whole site follows.

---

## Notes on the header and footer

There's no templating engine, so the `<header>` and `<footer>` blocks are duplicated in
each page. If you add a nav link, add it to all three pages — they're marked with comment
banners so they're easy to find. (Each page sets `aria-current="page"` on its own nav
link; keep that when you copy.)

---

## Housekeeping

- Accessible by default: skip link, focus outlines, labelled controls, semantic headings.
- Respects `prefers-reduced-motion` — animations and the starfield turn off.
- The hero starfield follows the cursor: the field parts around the pointer, nearby stars
  brighten, and short lines stitch them into a constellation. Three constants at the top of
  that block in `main.js` tune it — `REACH` (influence radius), `SHOVE` (how far stars are
  pushed) and `LINK` (how close two lit stars must be to be joined). It only paints while
  the hero is on screen in a visible tab, and the cursor interaction is skipped on touch
  devices.
- Works with JavaScript disabled; JS only adds the mobile drawer, reveals and counters.
- Makes zero third-party requests — no CDN, no font service, no analytics, no trackers.
- There is no rover page yet, by design — the site doesn't show a machine that doesn't
  exist. When there is one to show, add a page for it and a nav link in all three pages.

_Ad astra._
