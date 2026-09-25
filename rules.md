# 🧭 LankaWave Workspace Rules

These rules apply to every change in this repository.

## 📌 Source of Truth

- Read `SPEC.md` before planning implementation work.
- Follow the current application and design tokens when older references disagree.
- Keep documentation synchronized with the shipped web experience.

## 🧰 Stack Boundaries

- Use plain HTML, CSS, and JavaScript ES modules.
- Do not add a framework, bundler, backend, or package dependency without explicit approval.
- Prefer browser-native APIs over libraries.
- Keep LankaWave web-only; do not add downloadable desktop or mobile clients.

## 📡 Data Integrity

- Never invent or guess station URLs, frequencies, languages, or metadata.
- Never scrape stream URLs.
- Change `data/stations.json` only for an explicitly requested station update.
- Preserve working local artwork and use initials when remote artwork fails.

## 🧹 Code Quality

- Keep modules focused on one responsibility.
- Wrap every `localStorage` read and write in `try/catch`.
- Avoid global variables outside the application entry module.
- Do not add inline event handlers.
- Comment only when the reason is not clear from the code.
- Preserve unrelated user changes in a dirty worktree.

## 📱 Interface Quality

- Design mobile first and verify 320px and 375px widths.
- Also verify tablet and desktop layouts at 768px and 1280px.
- Use stable responsive dimensions; do not scale font size directly with viewport width.
- Keep touch targets at least 44px where practical.
- Prevent text, controls, and sticky UI from overlapping incoherently.
- Respect `prefers-reduced-motion`.

## ♿ Accessibility

- Use native interactive elements with clear accessible names.
- Keep visible focus styles for keyboard users.
- Make hidden controls non-focusable.
- Maintain useful status announcements for playback changes.
- Preserve readable contrast in light and dark themes.

## 🔊 Audio Safety

- Never autoplay audio.
- Start playback only after a user gesture.
- Release the live stream when playback is paused.
- Do not claim a stream works unless it was tested.

## 🔐 Privacy and Security

- Do not add analytics, trackers, cookies, or advertising without explicit approval.
- Never commit tokens, credentials, private endpoints, or local environment files.
- Keep deployment configuration free of secrets.

## ✅ Completion Checks

- Run JavaScript syntax checks for changed modules.
- Verify the main page and privacy page return successfully.
- Check responsive layouts in a real browser.
- Report tests that could not be completed.
- Keep each change scoped to the user's request.

