# Changelog

All notable changes to ZeroCert are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2025-04-15 — Initial Public Release

### Added

#### Core Platform
- Admin org registration with secret key authentication
- 6-step event creator: Details → Branding → Template → Fields → Signatories → Review
- Live certificate preview during template selection
- URL-based shareable event and verify links (`?event=ID`, `?verify=ID`)

#### Certificate Templates
- **Classic Gold** — Parchment, ornate gold borders, serif type
- **Dark Prestige** — Deep space gradient, electric glow, modern
- **Neon Cyber** — Cyberpunk circuit grid, RGB borders, glitch chrome
- **Pure Minimal** — White space, hairline rules, editorial serif
- **Brutalist** — Impact headers, thick black borders, yellow
- **RetroWave** — 80s synthwave grid, chrome type, vaporwave sunset

#### Multi-Org Collaboration
- Upload up to 5 organization logos per event
- All logos render side-by-side on every certificate
- "IN COLLABORATION" label appears automatically for joint events
- Per-org primary/collaborator designation in event creator

#### Signature Authority
- Add 1–5 signatories per event
- Three signature modes: **Draw** (canvas pad), **Typed** (cursive font), **Upload** (PNG)
- Three cursive font options: Dancing Script, Pacifico, Caveat
- Signatory blocks auto-layout based on count (1→centered, 2→side by side, 3+→grid)
- Signature preview on certificate canvas before event creation

#### Serial Number System
- Custom prefix format: `IITB/CSE/2025` → generates `IITB/CSE/2025-001`, `002`, etc.
- Auto-increments per event, thread-safe per session
- Default fallback to `ZC-` prefix if no custom prefix set

#### Certificate Expiry
- Admin sets optional expiry date per event
- Certs show color-coded validity badge on canvas (gold = valid, red = expired)
- Verify page shows expired status in real time without re-issuing

#### Bulk Issue Engine (CSV)
- CSV drag-and-drop or click-to-browse upload
- Dynamic sample CSV download matching exact event field headers
- Column format reference table shown before upload
- Per-row validation: name required, email required, email format, duplicate detection
- Preview table with per-row checkboxes (select/deselect individual rows)
- Double-click any cell to edit inline — auto-revalidates after edit
- Select All Valid / Deselect All toggle
- 4-stat summary bar: Total / Valid / Errors / Selected
- Clear & re-upload button

#### Email Composer
- Default email template with professional formatting
- `{{Name}}`, `{{Email}}`, `{{EventName}}`, `{{OrgName}}`, `{{CertID}}`, `{{IssueDate}}`, `{{VerifyURL}}` variable support
- Custom field variables automatically available per event
- Variable chip bar — click to insert at cursor position (body) or subject
- Subject character counter with Gmail clip warning
- AI subject line suggestions powered by Claude API
- Live per-recipient email preview panel with ← → row navigation
- `Custom Message` CSV column overrides body for individual recipients

#### Send Engine
- Bulk send with real-time per-row status (✓ sent / ✕ bounced / ⏳ pending)
- Pause and resume mid-send
- Progress bar with percentage
- 5-stat summary: To Send / Sent / Bounced / Pending / Skipped
- Pre-send summary block before confirming
- Results CSV download after send completes

#### Analytics Dashboard
- 4 tabs: Overview, Delivery, Events, Activity
- Overview: stat cards, issuance area trend chart, engagement donut pie
- Delivery: per-event open/click/bounce bar chart, delivery funnel bars
- Events: full per-event breakdown table with inline progress bars
- Activity: recent email log (last 100 rows), export full CSV
- Event filter dropdown to scope all charts to a single event
- 7D / 14D / 30D range toggle for trend charts
- Seed Demo Data button for first-time users
- Export analytics CSV

#### Verify Page
- Enter any certificate ID to verify
- Full certificate visual render on verify page
- Status badge: VALID ✓ / EXPIRED / REVOKED / NOT FOUND
- Revocation reason shown when cert is revoked
- All signatory names and designations shown in verification details
- SHA-256 hash displayed
- Bitcoin anchor status (pending / confirmed)

#### Certificate Download Fix
- Uses `canvas.toBlob()` + `URL.createObjectURL()` for reliable download in all browsers
- Fallback guidance (right-click → Save Image) shown below canvas
- Works inside iframes and sandboxed environments

#### UI / Design
- Dark theme with electric yellow (`#E8FF00`) accent
- IBM Plex Mono for all UI text — sharp and technical
- Bebas Neue for display headings — bold and distinctive
- Grid background overlay for depth
- Radial accent glow on hero
- Smooth focus states on all inputs
- Consistent border, surface, and muted color hierarchy
- Sticky navbar with hover underline transitions
- Mobile-responsive layout (grid adapts, text scales)

---

## Upcoming

### [1.1.0] — Planned

- Supabase backend (replace localStorage)
- OpenTimestamps real API integration with `.ots` file download
- IPFS pinning via web3.storage
- LinkedIn share card (OpenGraph image auto-generation)
- Recipient cert wallet (`/my-certs` page by email)
- Webhook on cert issue (POST to any URL)

### [1.2.0] — Planned

- OTP email verification on claim (prevent fake claims)
- Batch revocation via CSV upload
- Certificate watermark mode (DRAFT / SAMPLE)
- Custom HTML email template upload
- Multi-step approval flow (signatories approve before cert issues)

### [2.0.0] — Vision

- Gasless NFT mint on Polygon
- Recruiter portal (search verified credentials)
- Skill graph from cert history
- Physical cert print & post service
- White-label API for universities
