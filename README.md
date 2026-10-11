# BrandShield AI — React hackathon prototype

A glossy glassmorphism React/Vite website with:
- Public landing page and demo sign-in
- Signed-in home workspace replacing the old dashboard
- Brand profile with official social accounts, app names, and identifiers
- Social profile and mobile app assessment forms
- Basic look-alike name checks, keyword signals, and publisher hints
- Official asset exclusion checks
- Threat queue with filters, status updates, delete, and CSV export
- Reports page and browser-local persistence

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

For a production build:

```bash
npm run build
npm run preview
```

## Demo sign-in

Click **Open workspace**, enter any valid email and any non-empty password. This is only a demo gate; it is not secure authentication.

## Important prototype limitations

- No live social media or app-store scanning is performed.
- Assessment scores are transparent, rule-based demonstration indicators, not an AI model or a finding of malicious intent.
- Findings and brand profile are saved in the browser's `localStorage`; they are not shared between devices or team members.
- The official asset match is a simple normalized-name check. It is useful for a demo, but production use needs careful matching, verification, audit trails, backend storage, and human review.
- Do not use this prototype as the basis for real security decisions without validation.

## Project structure

```text
brandshield-react/
├── index.html
├── package.json
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    └── index.css
```

## Suggested hackathon demo flow

1. Show the public landing page and explain the two monitored surfaces: social profiles and mobile apps.
2. Open the workspace and save a brand profile with official handles and app names.
3. Assess a suspicious-looking social handle such as `@YourBrand_support_help`.
4. Assess an app with a similar name and an unfamiliar publisher.
5. Open Threat Intelligence, change a status, filter the list, and export CSV.
6. Explain that the current build is a working UI/rule-based prototype and that production monitoring would require authorized APIs or a compliant data collection pipeline.
