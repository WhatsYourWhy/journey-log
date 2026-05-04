# The Mage's Rituals — Product Brief

*Working name. Final name TBD.*

## One line

A private ADHD companion. Name the monster. Run the ritual. Keep the scroll.

## What it is

An installable, offline-first phone app that turns the Dragons & Distractions
bestiary and spellbook into a daily companion. You open it on a hard morning,
match the stuck feeling to a monster, and run one short ritual. Your scroll
(journal + history) lives only on your device.

## Who it's for

Severely ADHD adults — late-diagnosed, tired of clinical worksheets, allergic
to streak-shame productivity apps. People who already speak in metaphor to
make hard patterns approachable. The first user is the maker.

## Why it exists

Existing tools fail this audience three ways:

1. **They sell the data.** Mental-health and journaling apps routinely monetize
   what should be the most private surface a person has.
2. **They shame instead of name.** Streaks, badges, and "you missed a day"
   notifications add weight to brains already carrying too much.
3. **They scatter the toolkit.** Timer in one app, journal in another, mood
   tracker in a third. The switching cost is itself an ADHD tax.

The Mage's Rituals answers all three: nothing leaves the device, the language
is warm and pattern-naming, and the toolkit is one app.

## The differentiator

The Dragons & Distractions universe. Anyone can ship a Pomodoro timer; nobody
else has the Task Hydra, the Burnout Dragon, the Dopamine Goblin, or the
spellbook of rituals already written for them. The content is the moat.

## v1 — three screens

1. **Today.** The chooser path from the site, in app form: "Which feeling
   matches?" Names the monster. Hands you that monster's `start_here_ritual`.
2. **Ritual.** Runs the chosen ritual: shows the oath, the prompts, a
   forgiving timer when the ritual calls for one, accepts a brief journal note.
3. **Scroll.** Private history. Which monsters showed up, which rituals you
   ran, what you wrote. Exportable as markdown or PDF. Never leaves the device.

## Explicitly not in v1

- Cloud sync, accounts, login of any kind
- Streaks, gamification, social, sharing
- AI features
- Alarms, push notifications, calendar integration
- Body-doubling video, audio, or live presence
- Brain-dump capture surface (planned for v2)

If a feature isn't on the v1 list, the answer is "later." This list is the
filter.

## Privacy posture

- All data in `localStorage` on the user's device
- No analytics by default; if added later, opt-in and local-only
- No network calls except for fetching app shell and content updates
- Export your scroll any time; we have no copy of it
- Stated plainly in the app, not buried in a policy

## Content pipeline

The site at `dragons-and-distractions-site` is the source of truth.
A build step emits `monsters.json` and `spellbook.json` from the existing
Jekyll collections; the app fetches and caches them. Update the site →
app updates on next launch. No duplication, no drift.

## Shipping vehicle

Installable PWA at `app.dragonsanddistractions.com`. No app store, no review
cycles, no 30% cut, fully offline once installed. Promoted from the main site
as "install the companion."

## Tone, in one paragraph

Warm, not clinical. Grounded, not magical thinking. Practical first: every
path points to one ritual and one tool before asking for the lore. The
metaphor lowers shame; the rituals do real work. Not therapy.

## North star question

> Would someone who is ADHD, exhausted, and skeptical of productivity apps
> open this on a hard morning and feel less alone by the time they close it?

If a feature doesn't move that needle, it doesn't ship.
