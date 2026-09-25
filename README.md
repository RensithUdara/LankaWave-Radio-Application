# 📻 LankaWave

<p align="center">
  <img src="images/icon.svg" width="112" height="112" alt="LankaWave logo">
</p>

<p align="center">
  <strong>Sri Lanka, always in tune.</strong><br>
  A fast, responsive web player for live Sinhala, Tamil, and English radio.
</p>

<p align="center">
  <a href="https://lankawave-radio.vercel.app"><img alt="Live on Vercel" src="https://img.shields.io/badge/Live_on-Vercel-000000?style=for-the-badge&logo=vercel"></a>
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
</p>

## ✨ Highlights

- 🎧 Listen to live Sri Lankan stations in one tap
- 📱 Responsive layouts for phones, tablets, and desktops
- 🎛️ Swipeable quick-tune dial with previous and next controls
- 🔎 Instant search and Sinhala, Tamil, or English filters
- ❤️ Favourite-station and volume persistence
- 🌓 Light and dark themes
- ⌨️ Keyboard and Media Session controls
- ♿ Accessible controls, focus states, and reduced-motion support
- ⚡ No framework, bundler, account, analytics, or autoplay

## 🚀 Live Website

Visit **[lankawave-radio.vercel.app](https://lankawave-radio.vercel.app)**.

> Audio availability is controlled by each station's stream provider. LankaWave does not host or proxy station audio.

## 🛠️ Run Locally

No dependency installation or build command is required.

```bash
git clone https://github.com/RensithUdara/LankaWave-Radio-Application.git
cd LankaWave-Radio-Application
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## ⌨️ Keyboard Controls

| Shortcut | Action |
|---|---|
| `Space` | Play or pause |
| `←` / `→` | Previous or next station |
| `Ctrl/Cmd + K` | Focus station search |

## 🗂️ Project Structure

```text
LankaWave-Radio-Application/
├── index.html             # Main listening experience
├── css/                   # Theme, player, and station-list styles
├── js/                    # Audio, carousel, browse, and storage modules
├── data/stations.json     # Station metadata and stream URLs
├── images/                # Brand icon and local station artwork
├── pages/privacy.html     # Privacy policy
├── scripts/               # Station maintenance and stream checks
├── SPEC.md                # Product and engineering specification
└── vercel.json            # Static hosting configuration
```

## 🧪 Useful Checks

Validate JavaScript syntax:

```bash
node --check js/main.js
node --check js/player.js
node --check js/carousel.js
node --check js/browse.js
node --check js/store.js
```

Check configured station streams without changing the data file:

```bash
node scripts/check-streams.js
```

## 🌐 Deployment

The repository is configured for zero-build static deployment on Vercel.

```bash
vercel
vercel --prod
```

Pushes to the connected production branch can also deploy automatically through Vercel's Git integration.

## 🤝 Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. Please report security concerns privately using [SECURITY.md](SECURITY.md).

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE).

