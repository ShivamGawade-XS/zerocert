# Contributing to ZeroCert

Thank you for your interest in contributing. ZeroCert is built for communities, by the community.

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Local Setup

```bash
git clone https://github.com/yourusername/zerocert.git
cd zerocert
npm install
npm run dev
```

---

## How to Contribute

### Reporting Bugs

Open an issue with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior vs actual behavior
- Browser and OS info
- Screenshots if relevant

### Feature Requests

Open an issue labelled `enhancement`. Describe:
- The problem you are solving
- The solution you propose
- Any alternatives you considered

### Pull Requests

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test locally: `npm run dev` and verify manually
5. Commit using conventional commits:
   - `feat: add signatory revocation`
   - `fix: download button in iframe`
   - `docs: update CSV format guide`
   - `style: improve mobile nav`
   - `refactor: extract cert draw to utils`
6. Push: `git push origin feature/your-feature-name`
7. Open a Pull Request with a clear description

---

## Code Style

- All UI code stays in JSX with inline styles (no external CSS files)
- Keep components in logical sections with `// ─── SECTION ──` headers
- Shared UI primitives go in the shared UI section at the top
- New certificate templates follow the existing `drawCert` pattern
- Analytics data processing stays in pure helper functions

---

## Priority Areas

These contributions are most needed right now:

| Area | What's needed |
|---|---|
| Backend | Supabase integration to replace localStorage |
| Blockchain | Real OpenTimestamps API integration |
| Email | Real email delivery via Resend or Nodemailer |
| Mobile | Better responsive layout for small screens |
| Testing | Basic smoke tests for cert generation |
| Templates | New event-type-specific templates (Academic, Sports, etc.) |
| Accessibility | ARIA labels, keyboard navigation |

---

## Questions

Open a Discussion on GitHub or email `hello@zerocert.app`.
