/**
 * main.js - Application boot, state wiring, keyboard controls, and media session.
 */

import * as player from './player.js';
import * as carousel from './carousel.js';
import * as browse from './browse.js';
import * as store from './store.js';

const THEME_MODES = ['system', 'dark', 'light'];
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

let stations = [];
let favourites = [];
let recentStations = [];
let sleepTimeout = null;
let toastTimeout = null;
let lastAudibleVolume = 0.8;

function initTheme() {
    const saved = store.get('themeMode') || store.get('theme');
    const mode = THEME_MODES.includes(saved) ? saved : 'system';
    applyTheme(mode);

    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.documentElement.dataset.themeMode || 'system';
        const next = THEME_MODES[(THEME_MODES.indexOf(current) + 1) % THEME_MODES.length];
        applyTheme(next);
        showToast(`Theme: ${capitalize(next)}`);
    });

    systemTheme.addEventListener('change', () => {
        if (document.documentElement.dataset.themeMode === 'system') applyTheme('system', false);
    });
}

function applyTheme(mode, persist = true) {
    const resolved = mode === 'system' ? (systemTheme.matches ? 'dark' : 'light') : mode;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themeMode = mode;
    if (persist) store.set('themeMode', mode);

    const button = document.getElementById('themeToggle');
    button.querySelectorAll('.theme-icon').forEach(icon => { icon.style.display = 'none'; });
    const iconClass = mode === 'system' ? '.theme-icon--system' :
        mode === 'dark' ? '.theme-icon--light' : '.theme-icon--dark';
    button.querySelector(iconClass).style.display = '';
    button.setAttribute('aria-label', `Theme: ${capitalize(mode)}. Activate to change.`);
    button.title = `Theme: ${capitalize(mode)}`;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = resolved === 'dark' ? '#0b0f0d' : '#f5f3ed';
}

async function boot() {
    initTheme();

    try {
        const response = await fetch('data/stations.json');
        if (!response.ok) throw new Error(`Station request failed: ${response.status}`);
        stations = await response.json();
    } catch (error) {
        console.error('Failed to load stations:', error);
        showToast('Could not load stations. Please refresh.');
        return;
    }

    player.init(document.getElementById('audioEl'));
    restoreCollections();
    restoreVolume();

    carousel.init(document.getElementById('carouselTrack'), stations, handleCarouselSelect);
    browse.init({
        grid: document.getElementById('stationGrid'),
        emptyState: document.getElementById('emptyState'),
        countEl: document.getElementById('stationCount'),
        searchInput: document.getElementById('searchInput'),
        btnShowAll: document.getElementById('btnShowAll'),
    }, stations, handleCardSelect);
    syncCollections();

    const requestedId = new URLSearchParams(location.search).get('station');
    const loadId = requestedId || store.get('lastStation');
    const initialIndex = Math.max(0, stations.findIndex(station => station.id === loadId));
    if (stations[initialIndex]) carousel.selectByIndex(initialIndex, true);

    wirePopupPlayer();
    wirePlayerControls();
    wireFeatureControls();

    document.addEventListener('player:statechange', event => {
        const { state, station, statusText } = event.detail;
        updatePlayerStatus(state, statusText);
        updateMediaSession(station);
        if (state === 'playing' && station) recordRecent(station.id);
    });
    document.addEventListener('keydown', handleKeydown);
}

function restoreCollections() {
    const savedFavourites = store.get('favourites');
    const legacyFavourite = store.get('favourite');
    favourites = Array.isArray(savedFavourites) ? savedFavourites : legacyFavourite ? [legacyFavourite] : [];
    favourites = favourites.filter(id => stations.some(station => station.id === id));
    recentStations = Array.isArray(store.get('recentStations')) ? store.get('recentStations') : [];
    recentStations = recentStations.filter(id => stations.some(station => station.id === id)).slice(0, 8);
    store.set('favourites', favourites);
    store.remove('favourite');
}

function restoreVolume() {
    const saved = store.get('volume');
    const savedVolume = Number(saved);
    const volume = saved !== null && Number.isFinite(savedVolume)
        ? Math.max(0, Math.min(1, savedVolume))
        : 0.8;
    if (volume > 0) lastAudibleVolume = volume;
    setVolume(volume, false);
}

function wirePopupPlayer() {
    const popup = document.getElementById('popupPlayer');
    const playerSection = document.querySelector('.player');
    const updateVisibility = () => {
        const threshold = playerSection.offsetTop + playerSection.offsetHeight - 50;
        const visible = window.scrollY > threshold;
        popup.classList.toggle('visible', visible);
        popup.setAttribute('aria-hidden', String(!visible));
        popup.inert = !visible;
    };

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();

    document.getElementById('popPlay').addEventListener('click', () => player.toggle());
    document.getElementById('popPrev').addEventListener('click', () => carousel.prev());
    document.getElementById('popNext').addEventListener('click', () => carousel.next());
    document.getElementById('popPrevEdge').addEventListener('click', () => carousel.prev());
    document.getElementById('popNextEdge').addEventListener('click', () => carousel.next());
    document.getElementById('popVolume').addEventListener('input', event => setVolume(Number(event.target.value)));
    document.getElementById('popInfo').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function wirePlayerControls() {
    document.getElementById('btnPlay').addEventListener('click', () => player.toggle());
    document.getElementById('btnPrev').addEventListener('click', () => carousel.prev());
    document.getElementById('btnNext').addEventListener('click', () => carousel.next());
    document.getElementById('btnCarouselPrev').addEventListener('click', () => {
        carousel.prev();
        player.play();
    });
    document.getElementById('btnCarouselNext').addEventListener('click', () => {
        carousel.next();
        player.play();
    });
    document.getElementById('volumeSlider').addEventListener('input', event => setVolume(Number(event.target.value)));
    document.getElementById('btnMute').addEventListener('click', toggleMute);
}

function wireFeatureControls() {
    document.getElementById('btnFav').addEventListener('click', toggleFavourite);
    document.getElementById('btnShare').addEventListener('click', shareCurrentStation);
    document.getElementById('sleepTimer').addEventListener('change', event => {
        scheduleSleepTimer(Number(event.target.value));
    });
}

function handleCarouselSelect(station) {
    selectStation(station);
}

function handleCardSelect(station) {
    const index = stations.findIndex(item => item.id === station.id);
    if (index >= 0) carousel.selectByIndex(index, true);
    selectStation(station);
    if (station.url) player.play();
    document.querySelector('.player').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectStation(station) {
    player.setStation(station);
    browse.setActiveCard(station.id);
    updateUI(station);
    store.set('lastStation', station.id);
    const url = new URL(location.href);
    url.searchParams.set('station', station.id);
    history.replaceState(null, '', url);
}

function toggleFavourite() {
    const station = player.getStation();
    if (!station) return;

    if (favourites.includes(station.id)) {
        favourites = favourites.filter(id => id !== station.id);
        showToast(`${station.name} removed from favourites`);
    } else {
        favourites = [station.id, ...favourites];
        showToast(`${station.name} added to favourites`);
    }

    store.set('favourites', favourites);
    syncCollections();
    updateFavouriteButton(station.id);
}

function recordRecent(stationId) {
    recentStations = [stationId, ...recentStations.filter(id => id !== stationId)].slice(0, 8);
    store.set('recentStations', recentStations);
    syncCollections();
}

function syncCollections() {
    browse.setCollections(favourites, recentStations);
}

async function shareCurrentStation() {
    const station = player.getStation();
    if (!station) return;
    const url = new URL(location.href);
    url.searchParams.set('station', station.id);
    const shareData = { title: `${station.name} on LankaWave`, text: `Listen to ${station.name} live on LankaWave.`, url: url.href };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(url.href);
            showToast('Station link copied');
        }
    } catch (error) {
        if (error.name !== 'AbortError') showToast('Could not share this station');
    }
}

function scheduleSleepTimer(minutes) {
    clearTimeout(sleepTimeout);
    sleepTimeout = null;
    const status = document.getElementById('sleepStatus');

    if (!minutes) {
        status.textContent = '';
        showToast('Sleep timer off');
        return;
    }

    status.textContent = `Stops in ${minutes} min`;
    sleepTimeout = setTimeout(() => {
        player.pause();
        document.getElementById('sleepTimer').value = '0';
        status.textContent = '';
        showToast('Sleep timer finished');
    }, minutes * 60 * 1000);
    showToast(`Sleep timer set for ${minutes} minutes`);
}

function toggleMute() {
    const current = player.getVolume();
    if (current > 0) {
        lastAudibleVolume = current;
        setVolume(0);
    } else {
        setVolume(lastAudibleVolume || 0.8);
    }
}

function setVolume(volume, persist = true) {
    const normalized = Math.max(0, Math.min(1, volume));
    player.setVolume(normalized);
    document.getElementById('volumeSlider').value = normalized;
    document.getElementById('popVolume').value = normalized;
    if (normalized > 0) lastAudibleVolume = normalized;
    if (persist) store.set('volume', normalized);

    const muteButton = document.getElementById('btnMute');
    muteButton.classList.toggle('muted', normalized === 0);
    muteButton.setAttribute('aria-label', normalized === 0 ? 'Unmute' : 'Mute');
    muteButton.title = normalized === 0 ? 'Unmute' : 'Mute';
}

function updateUI(station) {
    updateFavouriteButton(station.id);
    document.getElementById('playerName').textContent = station.name;
    document.getElementById('playerLang').textContent = capitalize(station.lang);
    document.getElementById('playerFreq').textContent = station.freq ? `${station.freq} MHz` : 'Online';
    document.getElementById('popName').textContent = station.name;
    document.getElementById('popFreq').textContent = station.freq ? `${station.freq} MHz` : 'Online';

    const initials = station.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
    const logos = [document.getElementById('popLogo'), document.getElementById('mainLogo')];
    logos.forEach(logo => {
        logo.textContent = initials;
        const hue = carousel.getHue(station);
        logo.style.background = `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${hue} 50% 20%))`;
        if (station.logo) {
            const image = document.createElement('img');
            image.src = station.logo;
            image.alt = '';
            image.addEventListener('error', () => image.remove(), { once: true });
            logo.appendChild(image);
        }
    });
}

function updateFavouriteButton(stationId) {
    const button = document.getElementById('btnFav');
    const active = favourites.includes(stationId);
    button.classList.toggle('active', active);
    button.setAttribute('aria-label', active ? 'Remove from favourites' : 'Add to favourites');
    button.title = active ? 'Remove from favourites' : 'Add to favourites';
}

function updatePlayerStatus(state, text) {
    const status = document.getElementById('playerStatus');
    status.textContent = text;
    status.className = 'player__status' + (state === 'error' || state === 'no-stream' ? ' error' : '');

    const active = state === 'playing' || state === 'buffering';
    document.getElementById('liveBadge').classList.toggle('active', active);
    document.getElementById('playerVisualizer').classList.toggle('active', state === 'playing');
    document.getElementById('popViz').classList.toggle('active', state === 'playing');

    document.querySelectorAll('.icon-play').forEach(icon => { icon.style.display = active ? 'none' : ''; });
    document.querySelectorAll('.icon-pause').forEach(icon => { icon.style.display = active ? '' : 'none'; });
}

function handleKeydown(event) {
    const typing = document.activeElement?.matches('input, textarea, select');
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        browse.focusSearch();
        return;
    }
    if (typing) return;

    if (event.key === ' ') {
        event.preventDefault();
        player.toggle();
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        carousel.prev();
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        carousel.next();
    } else if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        toggleMute();
    }
}

function updateMediaSession(station) {
    if (!('mediaSession' in navigator) || !station) return;
    const artwork = station.logo ? [{ src: station.logo }] : [];
    navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: 'Live radio',
        album: 'LankaWave',
        artwork,
    });
    navigator.mediaSession.setActionHandler('play', () => player.play());
    navigator.mediaSession.setActionHandler('pause', () => player.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => carousel.prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => carousel.next());
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2600);
}

function capitalize(value = '') {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

boot();
