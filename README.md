# The Mage's Rituals (in progress)

A private, offline-first ADHD companion PWA built around the
[Dragons & Distractions](https://dragonsanddistractions.com) bestiary.
Name the monster. Run the ritual. Keep the scroll.

> **This repo is mid-pivot.** It started life as a generic to-do app called
> *The Journey Log*. Most of the original code is still present at the repo
> root and will be moved to `legacy/` or removed in a future cleanup pass. The
> new app lives under [app/](app/).

## Where to look

- **[BRIEF.md](BRIEF.md)** — the product brief. The north star.
- **[CLAUDE.md](CLAUDE.md)** — orientation for future Claude sessions:
  what's live, what's dead, what's legacy, what not to touch.
- **[app/index.html](app/index.html)** — the working demo. Single
  self-contained file (CSS + content + JS all inlined) so it runs in any
  preview environment.
- **[scripts/build-content.js](scripts/build-content.js)** — pulls monster
  and ritual content from the Dragons & Distractions Jekyll site, parses it,
  and injects it into the demo HTML.

## Build the content

The Dragons & Distractions site is the source of truth for monsters and
rituals. To rebuild the in-app content:

```sh
DD_SITE_PATH="path/to/dragons-and-distractions-site" npm run build:content
```

This emits `app/data/*.json` and re-injects the data into
`app/index.html`.

## Privacy posture

All user data stays in `localStorage` on the device. No accounts. No cloud
sync. No analytics by default. Export your scroll any time; we have no copy
of it.

## Status

- **Today screen** — chooser of nine struggles → monsters, with each card
  expanding inline to show the matching ritual (oath, steps, prompt,
  why-it-helps).
- **Scroll screen** — placeholder; the journal/save flow needs the JS layer
  that the current preview environment blocks. Will land when deployed to a
  real environment.
- **Timer, brain dump, alarms** — not in v1. See BRIEF.md.

## License

MIT.
