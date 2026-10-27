# Halfly website

Marketing site for **Halfly**, the AI cost router: it sends easy prompts to cheap models and hard ones to your
best, with a quality target you choose ("95% of answers as good as your strong model").

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4 and three.js for the 3D mascot in the hero.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Where things are

- `src/app/page.tsx`: the page, section by section
- `src/lib/data.ts`: **every number on the site** (benchmark results, pricing, contact email). Change figures here only.
- `src/components/`: sections (hero, quality dial, results, pricing, FAQ...) and the Halfy mascot
- `src/app/globals.css`: colours, buttons and motion (respects reduced-motion)
- `scripts/`: Playwright screenshot and layout checks (`section.mjs`, `shots.mjs`)

All benchmark numbers come from held-out test sets measured in the Halfly product repository.

© 2026 Rithin Menezes. All rights reserved.
