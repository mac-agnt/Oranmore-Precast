# Pulse · Oranmore Precast (demo)

Frontend-only, clickable demonstration of Pulse as the operating layer around iThesis, Excel, outsourced carriers and Sage for Oranmore Precast Limited.
**Illustrative demo data · snapshot 09 Nov 2026.** Customer names are real public Oranmore customers; every project, value, date and status is fictional. No integration is live.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run check      # capacity maths, de-duplicated pipeline, POD → invoice gates
npm run build
```

## Where things live

| Area | Where |
| --- | --- |
| Canonical domain model (types, fixtures, selectors, human-gated actions) | `src/oranmore/` |
| Module pages: Commercial, Projects, Plants & Planning, Logistics, Finance, Dashboard body | `src/oranmore/pages/` |
| Record drawer (lineage + links), Records Register, Agent profile, Home rail widgets, chat | `src/oranmore/*.tsx`, `chat.ts` |
| Pulse shell, Home, Agents, Work, Records, Activity, Settings | `src/views/`, state in `src/logic/PulseLogic.js` (`om` slice) |
| Theme (Oranmore palette sampled from oranmore.co.uk) | `src/styles/pulse.css` (`harbour`), `src/styles/oranmore.css` |
| Brand assets (official mark from oranmore.co.uk) | `public/brand/` |

All state is one in-memory `om` slice; every screen derives its numbers from it, and every workflow step writes an Activity event. Reloading resets the demo.
Read `CLAUDE.md` before customising further. Do not run `npm run import-design` on this copy.
