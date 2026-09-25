/**
 * main.js — Boot, wiring, keyboard, Media Session.
 */

import * as player from './player.js';
import * as carousel from './carousel.js';
import * as browse from './browse.js';
import * as store from './store.js';

let stations = [];

/* ── Theme ─────────────────────────────────────────────── */
function initTheme() {
    const saved = store.get('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);

    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    store.set('theme', theme);

    const btn = document.getElementById('themeToggle');
    const sunIcon = btn.querySelector('.theme-icon--dark');
    const moonIcon = btn.querySelector('.theme-icon--light');

    if (theme === 'light') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = '';
        btn.setAttribute('aria-label', 'Switch to dark mode');
    } else {
        sunIcon.style.display = '';
        moonIcon.style.display = 'none';
        btn.setAttribute('aria-label', 'Switch to light mode');
    }
}

/* ── Boot ──────────────────────────────────────────────── */
async function boot() {
    initTheme();
    try {
        const res = await fetch('data/stations.json');
        stations = await res.json();
    } catch (e) {
        console.error('Failed to load stations:', e);
        return;
    }

    const audioEl = document.getElementById('audioEl');
    player.init(audioEl);

    /* Restore volume */
    const savedVol = store.get('volume');
    if (savedVol !== null) {
        player.setVolume(savedVol);
        document.getElementById('volumeSlider').value = savedVol;
    }

    /* Init carousel */
    carousel.init(
        document.getElementById('carouselTrack'),
        stations,
        handleCarouselSelect
    );

    /* Init browse grid */
    browse.init(
        {
            grid: document.getElementById('stationGrid'),
            emptyState: document.getElementById('emptyState'),
            countEl: document.getElementById('stationCount'),
            searchInput: document.getElementById('searchInput'),
            btnShowAll: document.getElementById('btnShowAll'),
        },
        stations,
        handleCardSelect
    );

    /* Restore favourite or last station */
    const favId = store.get('favourite');
    const loadId = favId || store.get('lastStation');
    if (loadId) {
        const idx = stations.findIndex(s => s.id === loadId);
        if (idx >= 0) {
            carousel.selectByIndex(idx, true);
            /* setStation updates UI without playing */
            player.setStation(stations[idx]);
            browse.setActiveCard(stations[idx].id);
            updateUI(stations[idx]);
        }
    } else if (stations.length) {
        player.setStation(stations[0]);
        browse.setActiveCard(stations[0].id);
        updateUI(stations[0]);
    }

    /* Popup Player Scroll Reveal */
    const popPlayer = document.getElementById('popupPlayer');
    const playerSection = document.querySelector('.player');
    window.addEventListener('scroll', () => {
        if (!playerSection || !popPlayer) return;
        const threshold = playerSection.offsetTop + playerSection.offsetHeight - 50;
        const isVisible = window.scrollY > threshold;
        popPlayer.classList.toggle('visible', isVisible);
        popPlayer.setAttribute('aria-hidden', String(!isVisible));
        popPlayer.inert = !isVisible;
    }, { passive: true });

    /* Popup Player Actions */
    document.getElementById('popPlay').addEventListener('click', () => player.toggle());
    document.getElementById('popPrev').addEventListener('click', () => carousel.prev());
    document.getElementById('popNext').addEventListener('click', () => carousel.next());
    document.getElementById('popPrevEdge').addEventListener('click', () => carousel.prev());
    document.getElementById('popNextEdge').addEventListener('click', () => carousel.next());
    document.getElementById('popVolume').addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        player.setVolume(v);
        store.set('volume', v);
        document.getElementById('volumeSlider').value = v; // sync main
    });
    document.getElementById('popInfo').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* Listen for state changes */
    document.addEventListener('player:statechange', (e) => {
        const { state, station, statusText } = e.detail;
        updatePlayerStatus(state, statusText);
        updateMediaSession(station);
    });

    /* Controls */
    document.getElementById('btnFav').addEventListener('click', () => {
        const current = player.getStation();
        if (!current) return;
        const favId = store.get('favourite');
        const btnFav = document.getElementById('btnFav');

        if (favId === current.id) {
            store.remove('favourite');
            btnFav.classList.remove('active');
        } else {
            store.set('favourite', current.id);
            btnFav.classList.add('active');
        }
    });

    document.getElementById('btnPlay').addEventListener('click', () => player.toggle());
    document.getElementById('btnPrev').addEventListener('click', () => carousel.prev());
    document.getElementById('btnNext').addEventListener('click', () => carousel.next());

    /* Carousel specific arrows -> auto play on click */
    document.getElementById('btnCarouselPrev').addEventListener('click', () => { carousel.prev(); player.play(); });
    document.getElementById('btnCarouselNext').addEventListener('click', () => { carousel.next(); player.play(); });

    /* Volume */
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        player.setVolume(v);
        store.set('volume', v);
    });

    /* Keyboard */
    document.addEventListener('keydown', handleKeydown);
}

/* ── Selection handlers ───────────────────────────────── */
function handleCarouselSelect(station, index) {
    player.setStation(station);
    browse.setActiveCard(station.id);
    updateUI(station);
    store.set('lastStation', station.id);
}

function handleCardSelect(station) {
    const idx = stations.findIndex(s => s.id === station.id);
    if (idx >= 0) carousel.selectByIndex(idx, true);
    player.setStation(station);
    browse.setActiveCard(station.id);
    updateUI(station);
    store.set('lastStation', station.id);

    /* start playback if URL available */
    if (station.url) {
        player.play();
    }

    /* scroll to player */
    document.querySelector('.player').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── UI updates ───────────────────────────────────────── */
function updateUI(station) {
    const favId = store.get('favourite');
    const btnFav = document.getElementById('btnFav');
    if (favId === station.id) {
        btnFav.classList.add('active');
    } else {
        btnFav.classList.remove('active');
    }

    document.getElementById('playerName').textContent = station.name;
    document.getElementById('playerLang').textContent = station.lang;
    document.getElementById('playerFreq').textContent = station.freq ? `${station.freq} MHz` : '';

    /* Popup player updates */
    document.getElementById('popName').textContent = station.name;
    document.getElementById('popFreq').textContent = station.freq ? `${station.freq} MHz` : 'Web';

    const popLogo = document.getElementById('popLogo');
    const mainLogo = document.getElementById('mainLogo');

    if (station.logo) {
        const initials = station.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
        [popLogo, mainLogo].forEach(logo => {
            logo.textContent = initials;
            logo.style.background = '';
            const image = document.createElement('img');
            image.src = station.logo;
            image.alt = '';
            image.addEventListener('error', () => image.remove(), { once: true });
            logo.appendChild(image);
        });
    } else {
        const initials = station.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
        popLogo.innerHTML = initials;
        mainLogo.innerHTML = initials;

        const hue = carousel.getHue(station);
        const grad = `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${hue} 50% 20%))`;
        popLogo.style.background = grad;
        mainLogo.style.background = grad;
    }

}

function updatePlayerStatus(state, text) {
    const statusEl = document.getElementById('playerStatus');
    const badge = document.getElementById('liveBadge');

    statusEl.textContent = text;
    statusEl.className = 'player__status' + (state === 'error' || state === 'no-stream' ? ' error' : '');

    const isActive = state === 'playing' || state === 'buffering';
    badge.classList.toggle('active', isActive);

    const viz = document.getElementById('playerVisualizer');
    if (viz) viz.classList.toggle('active', state === 'playing');

    const popViz = document.getElementById('popViz');
    if (popViz) popViz.classList.toggle('active', state === 'playing');

    const playIcons = document.querySelectorAll('.icon-play');
    const pauseIcons = document.querySelectorAll('.icon-pause');

    if (state === 'playing' || state === 'buffering') {
        playIcons.forEach(i => i.style.display = 'none');
        pauseIcons.forEach(i => i.style.display = '');
    } else {
        playIcons.forEach(i => i.style.display = '');
        pauseIcons.forEach(i => i.style.display = 'none');
    }
}

/* ── Keyboard ─────────────────────────────────────────── */
function handleKeydown(e) {
    /* don't trigger while typing in search */
    const isTyping = document.activeElement?.matches('input, textarea, select');

    /* Ctrl/Cmd + K → focus search */
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        browse.focusSearch();
        return;
    }

    if (isTyping) return;

    switch (e.key) {
        case ' ':
            e.preventDefault();
            player.toggle();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            carousel.prev();
            break;
        case 'ArrowRight':
            e.preventDefault();
            carousel.next();
            break;
    }
}

/* ── Media Session ────────────────────────────────────── */
function updateMediaSession(station) {
    if (!('mediaSession' in navigator) || !station) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: 'Live radio',
        album: 'LankaWave',
    });

    navigator.mediaSession.setActionHandler('play', () => player.play());
    navigator.mediaSession.setActionHandler('pause', () => player.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => carousel.prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => carousel.next());
}

/* ── Go ───────────────────────────────────────────────── */
boot();
