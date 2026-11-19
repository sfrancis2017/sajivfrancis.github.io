# Landing page review (2026-11-19) — status

Source: sajivfrancis-landing-page-review.pdf (reference site staunstender.com).

## Done locally 2026-11-19 (built + browser-checked; NOT committed or pushed)
- Hero + About: tense-neutral capability wording ("Architecture leadership at Fortune 100 scale…"), per Sajiv 2026-11-19. No "currently", "by day", "today" or "Led".
- Hero buttons: Get in touch (mailto) + Read my writing. Swap the first for the booking link once it exists.
- Outcomes moved directly under the hero; Recent Writing moved above the subscriber banner.
- Recent Writing: 6 entries with category label, date, description (from frontmatter).
- Mason badge "Sample · in progress" -> "Preview"; caption trimmed.
- Owner-gate note rendered only on /tools/* (BaseLayout).
- Workbench menu out of public HTML and scripts: built by src/scripts/workbench-menu.ts, loaded only for an owner session (Header.astro; styles now global).
- Search dev fallback notice rendered only in dev (Search.astro).
- Footer links wrap on mobile (was an 11px horizontal overflow).

## Founder calls (parked)
- Employer descriptor: review suggests "Fortune 100 semiconductor manufacturer" — narrows identification; site CLAUDE.md says "Fortune 50 technology company", pages say "Fortune 100". Pick one; not adopted.
- Thesis H1 in place of the name; availability line; headshot choice; hero video keep/replace.
- Booking tool (Cal.com vs Calendly) and meeting types.

## Needs content from Sajiv
- 3 selected-work case cards; "How I lead" principles; personal note; talks/quotes row; "Start here" picks.
- Unlisted /profile page (noindex, out of sitemap).
- Weak card summaries: "A Grounded Personal Chat" description is "Build of my personal chat interface"; daughter post is categorised Reference (review wanted "Personal" — not in the controlled taxonomy).
