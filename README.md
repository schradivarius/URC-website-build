# Houston Apollos — team website

The website for the University of Houston's University Rover Challenge team.

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
index.html        Home — hero, mission, the four URC missions, rover teaser, season, sponsors
rover.html        The rover — specs, subsystem write-ups, testing
team.html         Leadership cards and the five subteams
sponsors.html     Why sponsor, tiers, in-kind, budget split, logo wall
join.html         Why join, open roles, process, FAQ, contact form
404.html          Shown for any URL that doesn't exist (styles inlined, see below)
assets/css/style.css   All styling. Colours live in the :root block at the top.
assets/js/main.js      Nav drawer, reveals, counters, starfield, descent rail
assets/img/            Logo, favicon, rover illustration, portrait placeholder, social card
assets/fonts/          Self-hosted Inter and Space Grotesk (no CDN)
```

---

## Editing guide

Search the HTML for `EDIT:` — every placeholder is flagged with a comment. The short list:

| What | Where |
| --- | --- |
| Team name / rover name | `index.html`, `rover.html`, plus the `.brand` block in every page's header and footer |
| Email address | `marsrover@uh.edu` appears in all five pages — find & replace |
| Social links | The `.socials` block in every footer, and the contact section in `join.html` |
| Stats (members, subteams) | `index.html`, the `.stats` block |
| Rover specs | `rover.html`, the two `.spec-table` blocks |
| Roster and photos | `team.html` |
| Sponsor tiers and amounts | `sponsors.html` |
| Meeting time and lab room | `join.html` |
| Left-rail section labels | The `data-nav` attribute on each `<section id="...">` |

### Adding a team member

Copy one `<article class="person">` block in `team.html`, change the name, role and
major/year, and point `src` at a square photo in `assets/img/team/`. The grid reflows on
its own — no layout work needed.

### Adding a sponsor logo

Drop the logo in `assets/img/sponsors/` (SVG or a transparent PNG) and replace one of the
`<div>Your logo here</div>` placeholders in the `.logo-wall` with:

```html
<a href="https://sponsor-website.com" rel="noopener">
  <img src="assets/img/sponsors/name.svg" alt="Sponsor name" width="160">
</a>
```

### Making the contact form actually send

The form in `join.html` posts to a placeholder endpoint. Pick one:

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
each page. If you add a nav link, add it to all five files — they're marked with comment
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
- A rocket sits on a pad at the foot of the left margin and climbs as you scroll: engines
  cold at the top of the page, ignition on the first scroll, an exhaust column trailing
  back down to the pad, and the orbit marker lit when you reach the end. The dots on the
  rail are that page's sections, ordered the way the rocket flies them — the first section
  is the one nearest the pad — and they jump to their section when clicked.
  - Each dot's label comes from `data-nav` on the `<section>`. Add a section with an `id`
    and it gets a dot automatically; give it a `data-nav="Short label"` to name it.
  - Shown only at 1240px and wider, where there is free margin to put it in. Below that it
    is not rendered at all, so it never crowds the content or the phone layout.
- Works with JavaScript disabled; JS only adds the mobile drawer, reveals and counters.
- Makes zero third-party requests — no CDN, no font service, no analytics, no trackers.
- The rover illustration in `assets/img/rover.svg` is a stand-in. Replace it with a CAD
  render or a photo of the real machine when you have one — that single swap does more for
  the site than any other change.

_Ad astra._
