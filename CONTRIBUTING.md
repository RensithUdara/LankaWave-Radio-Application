# 🤝 Contributing to LankaWave

Thank you for helping improve LankaWave.

## 🌱 Before You Start

1. Read [SPEC.md](SPEC.md) and [rules.md](rules.md).
2. Search existing issues before creating a new one.
3. Keep proposals focused and small enough to review.
4. Do not submit scraped or unverified stream URLs.

## 🛠️ Local Development

```bash
git clone https://github.com/RensithUdara/LankaWave-Radio-Application.git
cd LankaWave-Radio-Application
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

## 📡 Station Changes

A station contribution must include:

- Official station name
- Confirmed language
- Known frequency, or an empty value when unknown
- Direct HTTPS audio stream from an authorized or public source
- Logo source when available

Never guess metadata or scrape another radio directory.

## ✅ Pull Request Checklist

- [ ] The change follows the existing HTML, CSS, and JavaScript architecture.
- [ ] No framework or dependency was added.
- [ ] JavaScript syntax checks pass.
- [ ] Mobile layouts work at 320px and 375px.
- [ ] Tablet and desktop layouts work at 768px and 1280px.
- [ ] Keyboard and focus behavior remain usable.
- [ ] Documentation reflects user-visible changes.
- [ ] No credentials, logs, generated builds, or temporary files are included.

## 💬 Commit Style

Use short, action-oriented commit messages, for example:

```text
Improve mobile station filters
Fix failed logo fallback
Add verified station stream
```

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

