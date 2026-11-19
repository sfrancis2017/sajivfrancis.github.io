# Booking link on the site (2026-11-19)

## State

- BUILT locally, uncommitted: a "Book a meeting" link to `https://sajiv-francis.breely.com/form/26321`
  (switched from Calendly the same day, founder's choice)
  in four places: home hero and home contact list (`src/pages/index.astro`), About contact
  line (`src/pages/about.astro`), footer (`src/components/Footer.astro`). Plain link, new
  tab, no embed and no third-party script. Build green; home hero (desktop and phone
  width), About contact line and footer looked at. Commit and push on founder ask.

## Decisions (founder, 2026-11-19)

- Home hero: "Book a meeting" is the primary button (Breely); "Get in touch" stays as a
  separate email link beside it. The label is "Book a meeting" everywhere (was "Book a call").
- Breely redirects to https://sajivfrancis.com after a booking (set by the founder in Breely).

- Plain link, not an embedded scheduler.
- Video tool for meetings booked through the page: Google Meet only. Zoom (40-minute cap
  on the free plan) and Teams (needs a Microsoft 365 work account) are not connected.
  This is set inside the booking tool, not on the site.

- Booking tool: Breely (free up to 10 clients a month, $7 a month after). Its page lists
  Intro Call 15 min, Conversation 30 min and Deep Dive 60 min, all public (founder made
  Deep Dive public). Google Meet comes through Breely's Google Calendar sync. Seen on the
  public page 2026-11-19: three types listed, Test Mode banner gone. Not verified by
  Claude: that a booking produces a Meet link and a calendar entry.

## Open (founder calls)

- Whether to close or keep the Calendly account now that the site points to Breely.
- Whether to add "Book a meeting" to the top navigation (would also need the matching change
  in the docs repo, `src/config/site-nav.mjs`).
