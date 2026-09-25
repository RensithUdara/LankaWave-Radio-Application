# 📻 LankaWave Product Specification

## 🎯 Product Goal

LankaWave is a fast, mobile-first web player for live Sri Lankan radio. A listener should be able to find and start a station with one tap while retaining full keyboard and desktop support.

## ✅ Core Principles

- **Instant listening:** no account, onboarding, or autoplay.
- **Mobile first:** support 320px phones through wide desktop screens.
- **Lightweight:** plain HTML, CSS, and JavaScript ES modules.
- **Data driven:** station details live in `data/stations.json`.
- **Private by default:** no cookies, analytics, advertising, or tracking.
- **Direct streaming:** the browser connects to station providers directly.

## 🧰 Technology

| Area | Choice |
|---|---|
| Markup | Semantic HTML5 |
| Styling | CSS custom properties, Grid, and Flexbox |
| Logic | Vanilla JavaScript ES modules |
| Audio | Native `<audio>` element |
| Data | Static JSON loaded with `fetch` |
| Persistence | Defensive `localStorage` wrapper |
| Hosting | Static Vercel deployment |

No framework, package dependency, bundler, downloadable client, or server runtime is required.

## 🗂️ Source Layout

```text
index.html
css/
  base.css
  player.css
  browse.css
js/
  main.js
  player.js
  carousel.js
  browse.js
  store.js
data/
  stations.json
images/
pages/
  privacy.html
scripts/
  check-streams.js
  add-stations.js
  update-logos.js
```

## 📡 Station Data

Each station uses this shape:

```json
{
  "id": "example-fm",
  "name": "Example FM",
  "lang": "Sinhala",
  "freq": "00.0",
  "url": "https://example.com/stream",
  "logo": null
}
```

### Data Rules

- `id` is unique, lowercase, and contains no spaces.
- `lang` is `Sinhala`, `Tamil`, or `English`.
- `freq` stays empty when unknown; never guess it.
- `url` uses HTTPS whenever available; never scrape streams.
- `logo` may be a trusted remote URL, local path, or `null`.
- Missing or failed artwork falls back to generated station initials.

## 🎨 Experience

### Header

- LankaWave identity
- Live-state indicator
- System, dark, and light theme control

### Main Player

- Current-station artwork and metadata
- Idle, connecting, playing, buffering, error, and no-stream states
- Previous, play/pause, next, multiple-favourite, mute, and volume controls
- Shareable links that open directly on the selected station
- 15, 30, 60, and 90 minute sleep timer options
- Animated visualizer only while playing
- Quick-tune station carousel with drag and touch swipe

### Station Browser

- Search by station name, language, or frequency
- Combined language, favourites, and recently played filters
- Responsive one-, two-, or three-column station layout
- Clear active, hover, focus, and empty states

### Sticky Player

- Appears after the main player leaves view
- Provides current station and playback controls
- Uses safe-area spacing on supported mobile devices
- Remains inert and hidden from keyboard navigation when not visible

## 🔊 Player State Machine

| State | Status | Interface |
|---|---|---|
| `idle` | Ready to play | Play icon |
| `connecting` | Connecting... | Play icon |
| `playing` | Now playing | Pause icon and active live state |
| `buffering` | Buffering... | Pause icon |
| `error` | Stream unavailable right now | Error state and play icon |
| `no-stream` | No stream URL set for this station yet | Error state and play icon |

- Pausing releases the stream connection.
- Stream errors retry once after two seconds.
- Changing station while active switches streams immediately.
- Changing station while paused updates the interface without autoplay.

## ♿ Accessibility

- Every action uses a native button or link with an accessible name.
- Focus indicators remain visible.
- Player status uses `aria-live="polite"`.
- Hidden sticky controls use `inert` and `aria-hidden`.
- Keyboard behavior is disabled while typing in form fields.
- Motion respects `prefers-reduced-motion`.
- Text and controls target WCAG AA contrast and touch sizing.

## 📱 Responsive Targets

- **320-580px:** compact player, one-column stations, scrollable filters.
- **581-900px:** stacked hero/player and two-column stations.
- **901-1100px:** compact desktop composition.
- **1101px and above:** full two-column player and three-column stations.

Text does not scale directly with viewport width. Breakpoints define stable type and component sizes.

## ⚡ Performance

- Module script loading does not block HTML parsing.
- Audio uses `preload="none"`.
- Station artwork uses lazy loading.
- The project has no production JavaScript dependencies.
- Third-party audio and artwork failures must not break navigation.

## 🧪 Acceptance Checklist

- [ ] No horizontal page overflow at 320px, 375px, 768px, and 1280px.
- [ ] Station selection synchronizes player, carousel, and station card.
- [ ] Search, combined filters, empty state, and reset work.
- [ ] Playback states and retry behavior match the state table.
- [ ] Keyboard shortcuts work outside inputs.
- [ ] Last station, favourites, recent history, theme, and volume persist safely.
- [ ] Shared station links restore the selected station.
- [ ] Mute restores the previous audible volume.
- [ ] Sleep timer pauses playback at the selected interval.
- [ ] The app still loads when `localStorage` is blocked.
- [ ] Missing station images show initials.
- [ ] Privacy page is responsive and reachable.
- [ ] JavaScript syntax checks pass before deployment.

## 🚢 Release Process

1. Run syntax and responsive browser checks.
2. Run `node scripts/check-streams.js` when stream status matters.
3. Review the final diff for accidental station-data changes.
4. Push to GitHub.
5. Deploy the production branch to Vercel.

