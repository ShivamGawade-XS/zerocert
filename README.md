# ZeroCert 🔏

> **Free. Open. Blockchain-anchored. Certificate platform for communities.**

Issue verifiable, SHA-256 hashed certificates for hackathons, bootcamps, workshops, and any community event — completely free. Multi-org collaboration, multi-signatory support, bulk CSV email engine, full analytics dashboard.

![ZeroCert Preview](https://via.placeholder.com/1200x600/07070F/E8FF00?text=ZEROCERT)

---

## ✦ Features

| Feature | Detail |
|---|---|
| **6 Certificate Templates** | Classic Gold · Dark Prestige · Neon Cyber · Pure Minimal · Brutalist · RetroWave |
| **Multi-Org Collaboration** | Upload logos for all hosting organizations — all appear side-by-side on every cert |
| **Signature Authority** | Add 1–5 signatories per event. Draw, type (cursive font), or upload signature images |
| **Bulk CSV Engine** | Upload CSV → validate → preview → issue 10,000 certs in one shot |
| **Variable Email Engine** | `{{Name}}`, `{{CertID}}`, `{{VerifyURL}}` and any custom field — personalized per recipient |
| **AI Subject Lines** | Claude AI suggests compelling email subject lines for your event |
| **Live Send Status** | Per-row live status (sent / bounced / pending) with pause/resume |
| **Full Analytics** | Open rates, click rates, bounce tracking, trend charts, per-event breakdown |
| **Serial Number Format** | Custom prefix like `IITB/CSE/2025-001` — auto-increments per cert |
| **Certificate Expiry** | Set validity window — certs show color-coded expiry badge on verify page |
| **SHA-256 Hashing** | Every certificate cryptographically fingerprinted on issue |
| **Bitcoin Anchoring** | OpenTimestamps-ready — provable timestamp without gas fees |
| **QR Verify Page** | Every cert verifiable by anyone via cert ID, forever |
| **Zero Cost** | No wallet. No gas. No subscription. No credit card. |

---

## 🚀 Quick Start

### Option 1: Use the Demo (Recommended)
Open `ZeroCert_Final.jsx` directly in the [Claude Artifacts viewer](https://claude.ai) or any React sandbox.

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/zerocert.git
cd zerocert

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Option 3: Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
```

---

## 📦 Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React 18 + Vite | Free |
| Hosting | Vercel / Netlify | Free tier |
| Database | localStorage (MVP) → Supabase (production) | Free tier |
| Blockchain Proof | OpenTimestamps (Bitcoin) | Free |
| File Storage | IPFS via web3.storage | Free tier |
| Email | Resend | 3,000/month free |
| AI (Subject Lines) | Anthropic Claude API | Usage-based |
| Fonts | Google Fonts | Free |
| Charts | Recharts | Free (MIT) |

---

## 🗂 Project Structure

```
zerocert/
├── src/
│   ├── ZeroCert_Final.jsx     # Complete single-file app
│   └── main.jsx               # Entry point
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## 🔄 Admin Flow

```
1. Register Org           → Secret key (your password)
2. Create Event
   ├── Event details       (name, date, description, expiry, serial prefix)
   ├── Upload Logos        (up to 5 org logos for collaboration)
   ├── Pick Template       (live preview while selecting)
   ├── Set Form Fields     (Name, Email + custom: Roll No, Grade, Track…)
   └── Add Signatories     (draw / type / upload — up to 5 signatories)
3. Share Event Link        → Participants claim from your link
4. Bulk Issue (Optional)
   ├── Upload CSV          (inline validation, editable cells)
   ├── Compose Email       ({{variable}} injection, AI subject suggestions)
   └── Send + Monitor      (live per-row status, pause/resume)
5. Analytics              (open/click/bounce rates, charts, export)
```

## 🧑‍🎓 Participant Flow

```
1. Open event link
2. Fill form (Name, Email + any custom fields)
3. Submit → cert generates instantly with:
   ├── SHA-256 hash
   ├── Serial number
   ├── All org logos
   └── Signatory blocks
4. Download PNG certificate
5. Copy verify link to share
```

---

## 🔐 Verification

Every certificate has a unique ID. Anyone can verify at:

```
zerocert.app/verify?id=IITB/CSE/2025-001
```

The verify page shows:
- Certificate render (full visual)
- Issued to, event, organization
- All signatory names and designations
- SHA-256 hash
- Bitcoin timestamp proof (via OpenTimestamps)
- Expiry status (valid / expired / revoked)

---

## 📧 Email System

### Variables Available

| Variable | Replaces With |
|---|---|
| `{{Name}}` | Recipient's name |
| `{{Email}}` | Recipient's email |
| `{{EventName}}` | Event name |
| `{{OrgName}}` | Organization name |
| `{{CertID}}` | Certificate serial/ID |
| `{{IssueDate}}` | Formatted issue date |
| `{{VerifyURL}}` | Direct verify link |
| `{{CustomField}}` | Any custom field from your form |

### CSV Format

```csv
# ZeroCert CSV Template — EventName
# Required: Name, Email
# Custom Message (optional): overrides default email body for this row
Name,Email,Roll No,Grade,Custom Message
Rahul Sharma,rahul@example.com,CS2021001,A,"Congratulations on your exceptional work!"
Priya Verma,priya@example.com,CS2021002,B+,
Aditya Nair,aditya@example.com,CS2021003,A+,
```

---

## 🔗 Blockchain Proof

ZeroCert uses **OpenTimestamps** to anchor certificate hashes into the Bitcoin blockchain:

1. Every cert is SHA-256 hashed at issue time
2. Hashes are batched every hour
3. The batch root is submitted to `opentimestamps.org`
4. Bitcoin includes it within 1–2 Bitcoin blocks (~10–20 min)
5. The `.ots` proof file can be independently verified offline

**No gas. No wallet. No Ethereum.** This uses Bitcoin's own timestamp mechanism.

---

## 🎨 Certificate Templates

| Template | Best For | Style |
|---|---|---|
| **Classic Gold** | Academic, formal events | Parchment, gold borders, serif fonts |
| **Dark Prestige** | Modern tech events | Deep space gradient, electric accent |
| **Neon Cyber** | Hackathons, CTFs | Cyberpunk grid, RGB borders, glitch |
| **Pure Minimal** | Design, professional | White space, hairline rules, editorial |
| **Brutalist** | Bold communities | Impact font, thick black, yellow |
| **RetroWave** | Fun events, gaming | 80s synthwave, chrome type, sunset |

All templates support:
- Multi-logo collaboration display
- 1–5 signatory blocks (auto-laid out)
- Custom serial number format
- Expiry validity badge
- SHA-256 hash and verify URL

---

## 🛠 Productionizing (Free Stack)

Replace localStorage with Supabase for multi-user production:

```javascript
// Replace db.get / db.set with:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Store cert
await supabase.from('certs').insert(cert)

// Get cert
const { data } = await supabase.from('certs').select('*').eq('certId', id)
```

**Free Supabase limits:** 500MB DB, 2GB bandwidth, 50,000 MAU — enough for most communities.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📋 Roadmap

- [ ] Supabase backend integration
- [ ] OpenTimestamps real API integration + .ots download
- [ ] IPFS pinning via web3.storage
- [ ] LinkedIn share card (OpenGraph image)
- [ ] Recipient cert wallet (all your certs in one place)
- [ ] Webhook on cert issue
- [ ] OTP email verification on claim
- [ ] Batch revocation via CSV
- [ ] NFT mint (gasless via Polygon)
- [ ] Self-host Docker image

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙌 Acknowledgements

Built with React, Recharts, IBM Plex Mono, Bebas Neue, and the Anthropic Claude API.

---

<div align="center">
  <strong>ZeroCert</strong> — Issue verifiable certificates. For free. Forever.
</div>
