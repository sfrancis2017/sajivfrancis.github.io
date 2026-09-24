# 01 · Sign PDF: dates, initials, audit trail, certified seal

**Status:** Phase 1a BUILT + VERIFIED 2026-09-24 (ratified by founder: "keep
it simple by adding the signature and date feature, the audit trail & email can
come later"). Phase 1b (local audit footer/page), Phase 2 and Phase 3 remain
DRAFT pending founder calls below.

### Phase 1a — what shipped (2026-09-24)
- `src/pages/tools/pdf-sign.astro` rewritten: placement model, signature +
  initials (draw / type / upload), date stamp with 5 formats, "Sign this
  page", "Initial pages" (all / all except signed / custom range), tray +
  stage layout with page thumbnails and badges, mouse drag from tray, move /
  corner-resize / ✕ / Delete key / arrow nudge, zoom (Fit page default, Fit
  width, 75–200%), whole-page PDF drop.
- Trackpad help (founder note): heavier stroke smoothing for mouse/trackpad
  input, **Expand** button opens the pad full-screen, **Upload** strips the
  paper background from a phone photo of a signature.
- **Save as…** dialog via the File System Access API (Chrome/Edge); Safari
  and Firefox fall back to a normal download. Cancel writes nothing.
- Verified with a puppeteer run against the built site (5-page PDF; drawn,
  typed, expanded-pad and uploaded-photo signatures; page 3 signed; pages
  1,2,4,5 initialed + dated; output re-rendered with pdf.js: 1 image per
  page, date text on every page, DD/MM/YYYY present; screenshots inspected).
- Lessons: Astro scopes `<style>` to markup-time elements, so JS-created
  nodes need `<style is:global>` (prefixed with `.sign-page`); an author
  `display:` rule beats the `hidden` attribute — the page has a scoped
  `[hidden] { display:none !important }`; the sticky tray is a stacking
  context, so the expanded pad is re-parented to the article while open.
- Bug fix (founder report, same day): filled-in form fields vanished from the
  download. pdf.js draws field values itself, but forms filled in
  Preview/Chrome carry no appearance streams, so pdf-lib's output showed
  blank fields elsewhere. Export now flattens the AcroForm (values drawn
  into the page, fields removed) with fallbacks to regenerating
  appearances; regression test `e2e-form.mjs` (fixture: text fields +
  checkbox, NeedAppearances, no AP) — input has 0 page-text values, output
  has both values and 0 widgets.
- Known, out of scope: the site footer link row overflows by ~11 px at
  390 px viewport (site-wide, pre-existing). Rotated pages (see Risks).
**Repos:** UI in this repo (`src/pages/tools/pdf-sign.astro`); backend in
`tools-sajivfrancis/backend/` (new router `tools/pdf_sign.py`).
**Author:** Claude (Fable 5.1) with Sajiv Francis, 2026-09-24.

## Goal
Turn the local-only Sign PDF tool into a lightweight HelloSign-style flow:
sign one page, initial and date the rest, stamp an audit footer, and — in an
opt-in "Certified" mode — record where/when it was signed, seal the file with a
real PAdES certification signature (pyHanko), and optionally email it.

## Current state (verified 2026-09-24)
- `pdf-sign.astro` is 100% client-side: pdf.js preview, pdf-lib stamping,
  draw/type/upload signature, saved signatures in `localStorage`
  (`sf_signatures`), one image placed on **one** page, download `signed.pdf`.
- Draw pad is a fixed 560×160 canvas stretched by CSS (blurry on retina), no
  smoothing, no undo.
- No date, no initials, no footer, no server call. Page promises
  "Nothing is uploaded".
- Backend (FastAPI on the droplet behind Cloudflare Tunnel) has no email
  sender, no geo, no pyHanko. PyMuPDF is already a dependency. Public
  endpoints already have size caps + SSRF guard (`netguard.py`).
- DO Spaces bucket has a **7-day lifecycle on the `tools/` prefix** — audit
  records must live under a different prefix.

## Design constraint: reusable by Gravitite (founder note 2026-09-24)
The certified seal + audit trail + email delivery (Phases 2–3) should later
serve Gravitite documents, whose backend is **Node**. pyHanko is Python-only
and the Node equivalents (`@signpdf/signpdf`) do not do PAdES certification
with DocMDP cleanly, so **do not port** — expose the capability as a
standalone service both stacks call:
- Own router with no site-specific coupling: `POST /api/sign/certify`,
  `POST /api/sign/send`, `GET /api/sign/verify/{id}`; multipart PDF in,
  sealed PDF + `audit_id` out. Versioned JSON audit schema
  (`audit_schema_version`) documented in `backend/README.md`.
- Two auth modes: browser callers (Turnstile + rate limit) and
  server-to-server callers (`X-Api-Key` per client, e.g. `gravitite`), with
  the `client` name recorded in the audit record.
- Email templates and the verify page take the caller's branding as
  parameters (product name, reply-to, verify base URL) rather than hard-
  coding sajivfrancis.com.
- Gravitite integration itself is out of scope here; when it happens it is
  an ADR in the Gravitite repo pointing at this contract.

## Non-goals
- Multi-party signing workflows (send → countersign → collect). Single signer.
- Legal advice. Tool copy states it is an attestation, not a legal opinion.
- Replacing the local-only mode. It stays the default.

## Founder calls (parked — decide before Phase 2)
1. **Privacy promise.** Certified mode uploads the stamped PDF. Proposed: keep
   "nothing is uploaded" as the default, and change the copy only when the
   Certified toggle is on, with an explicit consent checkbox.
2. **Retention.** How long certified PDFs + audit JSON stay in Spaces.
   Proposed: audit JSON permanent, PDF 90 days.
3. **Certificate identity.** Use case: Sajiv's wife signs nursing documents
   that go to nursing associations, so the seal must read as a genuine third
   party to a stranger opening the PDF in Acrobat. Cloudflare does **not**
   issue document-signing certificates (its certs are TLS-only, no document
   signing usage), so it is not an option here. Realistic options:
   - **A. Self-signed platform cert + DigiCert timestamp.** Free. The
     timestamp is a real third-party attestation of *what* was signed and
     *when*, validated on its own chain, but the signer identity shows
     "validity unknown" until the reader trusts our CA. Weak for strangers.
   - **B. AATL platform cert (recommended default).** A document-signing
     cert from an Adobe Approved Trust List CA (DigiCert, GlobalSign,
     Sectigo, Entrust) in the platform's name, e.g. "Sajiv Francis Tools".
     Paid yearly, identity-verified, key must sit on hardware or in the CA's
     cloud signing service (GlobalSign DSS, DigiCert, Sectigo — pyHanko
     supports these via the CSC API / `ExternalSigner`). Acrobat shows green.
     This is the HelloSign/DocuSign model: the *platform* certifies the audit
     trail; the signer's identity is carried by the audit page, not the cert.
   - **C. Personal AATL cert in the signer's own name.** Same CAs, issued to
     the wife after ID verification, on a USB token or cloud. Strongest
     identity claim, but then she can sign directly in Acrobat and the tool
     adds only the audit page and convenience.
   Proposed: build the backend signer as pluggable (`SEAL_BACKEND =
   selfsigned | pkcs12 | csc`), ship Phase 2 on A for testing, buy B before
   sending anything real, and expose a **Seal** selector in the UI
   ("Trusted CA seal" vs "Self-signed seal") only if both are configured.
4. **Sending domain + provider** for email (Phase 3). DECIDED: fine, as
   long as the sealed PDF reaches the recipient (nursing associations).
   Resend from `sign@sajivfrancis.com` with SPF, DKIM and DMARC in Cloudflare
   DNS so association mail filters accept it. Reply-To = the signer's email
   so replies go to the wife, not the platform. Signer always gets a copy.
5. **Abuse control** on the public certify endpoint. Proposed: Cloudflare
   Turnstile token required in Certified mode + per-IP rate limit.

---

## Phase 1 — client-only (no backend, privacy promise unchanged)

**Split:** Phase **1a** = 1.1–1.5 (placement model, signature/initials/date
stamps, larger drag & drop viewer, multi-page controls, draw pad). Building
now. Phase **1b** = 1.6 (local audit footer + audit page). Deferred with
Phase 2/3 by founder decision.

### 1.1 Placement model (replaces the single overlay)
```js
// one entry per stamp on the document
{ id, kind: 'signature'|'initials'|'date'|'text', page, x, y, w,   // px at render scale
  dataUrl?,   // signature / initials image
  text?, font?, color? }  // date / name / title
```
- `placements[]` is the source of truth. The stage renders the overlays for
  the **current page** only; page switch re-renders overlays from the model.
- Apply loops over every placement and stamps it on its page with pdf-lib
  (image → `embedPng`, text → `drawText` with an embedded standard font).
- Overlay: drag to move, corner handle or slider to resize, ✕ to remove,
  click to select. Keyboard: arrow keys nudge, Delete removes.

### 1.2 Stamps
- **Signature** — as today (draw / type / upload), saved list.
- **Initials** — same three modes, separate saved list (`sf_initials`),
  short input (max 5 chars), typed default = first letters of the name.
- **Date** — text stamp, auto-filled with today, editable, format select
  (`YYYY-MM-DD`, `DD MMM YYYY`, `DD/MM/YYYY`, `MM/DD/YYYY`, `Month D, YYYY`). "Attach date to signature"
  option places it directly under/right of the signature and moves with it.
- **Name / Title** — optional plain text stamps.

### 1.3 Viewer: larger, drag & drop
- Page width goes from `max-w-4xl`/720 px to a full-width workspace
  (`mainClass="max-w-7xl"`): a left **tray** (signature, initials, date,
  name/title stamps, saved items) and a right **stage** that fits the page to
  the available width, with zoom (fit width / 100% / 150%) and a page
  thumbnail rail. On ≤900 px the tray collapses above the stage.
- **Drag from tray onto the page** to place a stamp (HTML5 drag-and-drop on
  desktop, long-press + move via Pointer Events on touch). Dropping on a page
  creates a placement at the drop point; dragging an existing overlay moves
  it; corner handle resizes; ✕ removes.
- Drop a PDF anywhere on the workspace to open it (whole article is the drop
  target, not only the small zone).

### 1.4 Multi-page controls
- Thumbnail rail (pdf.js at small scale) with a badge per page showing what
  is placed there; click to jump.
- **"Sign this page"** — the signature (+ attached date) goes on the current
  page only. Exactly what happens today, now explicit.
- **"Initial pages…"** — pick `All`, `All except signature page`, or a
  range (`1-3,5`). Clones the initials (+ date) placement to each chosen page
  at the same position (default bottom-right, inset 36 px). Each clone is
  still individually movable/deletable.

### 1.5 Draw pad usability
- Scale the canvas to `devicePixelRatio`; pad 150 px in the tray, 200 px on
  ≤900 px screens, full-screen via **Expand**.
- Own Bézier-midpoint smoothing with velocity-based width (no library);
  input-position smoothing is heavier for `pointerType === 'mouse'`
  (trackpads) than for pen/touch; pen thickness thin/medium/thick.
- Upload mode removes a paper background (luminance threshold against the
  90th-percentile "paper" brightness) so a phone photo works.
- Undo last stroke, Clear, faint baseline guide.
- Keep `touch-action: none`; verify on iOS Safari that the page does not
  scroll while signing.

### 1.6 Local audit footer + audit page
- Footer on **every** page, 7 pt, bottom margin:
  `Signed by {name} · {UTC ISO} · Audit ID {uuid} · SHA-256 {first 16 hex}`.
- Appended **audit page** (pdf-lib `addPage`) listing: signer name (typed
  field, required when the footer is on), timestamp UTC + browser timezone,
  signature method (draw/type/upload), pages signed / initialed with
  coordinates, SHA-256 of the **original** file (WebCrypto `crypto.subtle`)
  and of the stamped output (computed after stamping, written on a final
  pass), user agent, and the line "Local mode — location not recorded".
- Toggle "Add audit footer + page" (default on). Output name
  `{original}-signed.pdf`.

### 1.7 Acceptance (Phase 1)
- `pnpm build` passes; page renders in `dist/`.
- A 5-page PDF: signature + date on page 3, initials + date on 1,2,4,5,
  footer on all, audit page appended → open in Preview and Acrobat, verify
  visually (screenshot into the session scratchpad and LOOK).
- Retina draw pad is crisp; iOS Safari does not scroll while drawing.
- Drag a stamp from the tray onto page 3 with a mouse; on touch, select the
  stamp and use the place buttons (tray drag on touch fights page scroll).
  Placements survive page switches and zoom changes. ✔ 2026-09-24
- Rehashing the original file matches the SHA-256 printed on the audit page.
- `tools/index.astro` description updated (still "browser").

---

## Phase 2 — Certified mode (backend: geo, audit record, pyHanko seal)

### 2.1 Endpoint `POST /api/sign/certify` (public, rate-limited, Turnstile)
Multipart: `file` (stamped PDF, ≤ 15 MB, magic-byte checked), `signer_name`,
`signer_email` (optional), `consent` (must be `true`), `tz`, `placements`
(JSON summary), `original_sha256`, `turnstile_token`.

Server steps, in this order (order matters — the seal must be last):
1. Validate input; reject non-PDF, oversize, missing consent.
2. Read Cloudflare headers: `CF-Connecting-IP`, `CF-IPCountry`, and — once the
   "Add visitor location headers" managed transform is enabled on the zone —
   `cf-ipcity`, `cf-region`, `cf-timezone`. Fall back to country-only.
3. Build the audit record (`audit_id` UUID4, `signed_at` server UTC,
   ip, geo, user agent, hashes, signer, placements, method, `mode: certified`).
4. Append the audit page with **PyMuPDF** (already a dep) — same layout as
   Phase 1 but with the location + IP lines and the audit ID; overwrite the
   client's "Local mode" audit page if present (detect by a marker string).
5. **pyHanko** certification signature:
   - Signer chosen by `SEAL_BACKEND`: `selfsigned`/`pkcs12` →
     `SimpleSigner.load_pkcs12('/opt/tools/seal.p12', passphrase from env)`;
     `csc` → pyHanko CSC-API signer against the CA's cloud signing service
     (credentials in env). Request may carry `seal=trusted|selfsigned` when
     both are configured; default is the trusted one.
   - `PdfSignatureMetadata(field_name='SajivFrancisSeal', certify=True,
     docmdp_permissions=MDPPerm.NO_CHANGES, reason=f'Audit {audit_id}',
     location=geo_string, subfilter=PADES)`.
   - `HTTPTimeStamper('http://timestamp.digicert.com')` → PAdES B-T so the
     time is asserted by a third party, not just our clock.
   - Optional small visible stamp on the audit page ("Certified · audit id").
6. Compute final SHA-256; store `certified/{audit_id}.json` and
   `certified/{audit_id}.pdf` in Spaces (prefix outside the 7-day rule,
   **not** public-read). Return the sealed PDF bytes + `audit_id` header.

### 2.2 Endpoint `GET /api/sign/verify/{audit_id}` (public)
Returns the non-sensitive part of the record (name, time, country/city,
hashes, method). IP and email are not returned.
`POST /api/sign/verify` with a PDF: pyHanko `validate_pdf_signature`, plus
hash match against the stored record → `{ intact, certified, audit_id, … }`.

### 2.3 Certificate + secrets (droplet, one-time)
- Generate a CA + document-signing cert with pyHanko's `pyhanko-certvalidator`
  test utilities or openssl; store as `/opt/tools/seal.p12`, `chmod 600`.
- `SEAL_P12_PASSPHRASE`, `TURNSTILE_SECRET` in `/opt/tools/tools.env`.
- Publish the CA `.cer` at `sajivfrancis.com/verify/` with a one-paragraph
  "how to trust this seal in Acrobat".

### 2.4 Client changes
- "Certified" toggle in the place panel. When on: consent checkbox, name
  required, email optional, Turnstile widget, copy changes to
  "This file will be uploaded to seal it and record the audit trail".
- Flow: stamp locally (Phase 1 code) → POST → download the sealed file →
  show the audit ID and a link to `/verify/{id}`.

### 2.5 Acceptance (Phase 2)
- `pytest backend/tests/test_pdf_sign.py`: certify a fixture PDF with a
  **test** cert → pyHanko validation reports intact + certified + DocMDP
  no-changes; audit JSON has every field; modifying one byte after sealing
  → `intact: false`.
- Acrobat opens the sealed file with the blue "certified" bar (validity
  unknown until CA trusted; green after importing the CA).
- Country/city appear on the audit page from a real request via the tunnel.
- `backend/README.md` endpoint list + secrets section updated.

---

## Phase 3 — Email delivery + verify page
- Certify form gains `recipient_email` (one or more, comma-separated),
  `subject`, `message`, and "send me a copy" (default on). Server sends via
  Resend (API key in env) with the sealed PDF attached (≤ 10 MB) or, above
  that, a 7-day signed Spaces URL. Sender `sign@sajivfrancis.com`,
  Reply-To = signer email, SPF + DKIM + DMARC in Cloudflare DNS.
- Email body: who signed, when (UTC), audit ID, the `/verify/{id}` link,
  and one line on how to check the seal in Acrobat.
- Audit record gains `sent_to[]`, `sent_at`, provider message ids, and
  delivery status from the Resend webhook (delivered / bounced).
- Site page `src/pages/verify/[id].astro` (or client-side `/verify/`)
  that calls the verify endpoint and shows the record + a "drop the PDF here
  to check it is intact" box, plus the CA cert download for option A.
- Acceptance: test send to the owner's address arrives with attachment and
  DKIM/DMARC pass in the headers; a bounce shows up in the audit record;
  verify page renders a real record.

## Sequencing & sizing
| Phase | Where | Rough size | Depends on |
|---|---|---|---|
| 1 | Astro repo only | one session | — |
| 2 | backend + droplet deploy + small UI | one session + cert setup | Founder calls 1, 2, 5; call 3 for option A |
| 2b | trusted seal (option B) | CA purchase + ID verification + one short session | Founder call 3 |
| 3 | backend + DNS + verify page | one session | Founder call 4; Phase 2 |

## Risks / notes
- Rotated pages (`/Rotate 90`) are previewed rotated by pdf.js but stamped
  in unrotated pdf-lib space — known limitation carried over from the
  current tool; handle in a follow-up if a real document hits it.
- pyHanko seal is last; any later edit (even re-saving in Preview) breaks
  the "intact" flag. That is the feature, but the UI must say so.
- Cloudflare city/region headers need a zone-level managed transform;
  country is available by default.
- ESIGN/UETA: consent checkbox + typed name + audit record cover consent,
  intent, association and retention in the ordinary lightweight sense. The
  tool page will state it is not legal advice.
- Keep `tools/index.astro` `where: 'browser'` for the default mode; note
  "certified mode uses the server" in the description.

## Tracking
- FOLLOWUPS: (none yet — created on ratification)
- Decisions recorded here until an ADR is warranted (Phase 2 certificate
  choice is the likely first ADR).
