/**
 * carousel.js — Snap-scroll station carousel with drag, swipe, active sync.
 */

let track = null;
let tiles = [];
let stations = [];
let activeIndex = 0;
let onSelect = null; /* callback(station, index) */

/* ── Hue generation from station name ────────────────── */
function hueFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

export function getHue(station) {
    return hueFromName(station.name);
}

/* ── Init ─────────────────────────────────────────────── */
export function init(trackEl, stationList, selectCallback) {
    track = trackEl;
    stations = stationList;
    onSelect = selectCallback;

    render();
    setupDrag();
    setupScrollEnd();
}

function render() {
    track.innerHTML = '';
    stations.forEach((s, i) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (i === activeIndex) tile.classList.add('active');
        tile.setAttribute('role', 'option');
        tile.setAttribute('aria-label', s.name);
        tile.dataset.index = i;

        const hue = hueFromName(s.name);

        let logoHtml = '';
        if (s.logo) {
            logoHtml = `<div class="tile__logo" style="background: linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${hue} 50% 20%))">
                            <span>${s.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}</span>
                            <img src="${s.logo}" alt="${s.name}" loading="lazy" />
                        </div>`;
        } else {
            const initials = s.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
            logoHtml = `<div class="tile__logo" style="background: linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${hue} 50% 20%))">
                            ${initials}
                        </div>`;
        }

        const freq = s.freq ? `${s.freq} MHz` : 'Web';
        const freqHtml = `<div class="tile__freq">${freq}</div>`;

        tile.innerHTML = logoHtml + freqHtml;

        const image = tile.querySelector('img');
        image?.addEventListener('error', () => image.remove(), { once: true });

        tile.addEventListener('click', () => selectByIndex(i));
        track.appendChild(tile);
        tiles.push(tile);
    });
}

/* ── Desktop mouse drag ───────────────────────────────── */
function setupDrag() {
    let isDragging = false;
    let startX = 0;
    let scrollL = 0;

    track.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.pageX - track.offsetLeft;
        scrollL = track.scrollLeft;
        track.style.scrollBehavior = 'auto';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        track.scrollLeft = scrollL - (x - startX);
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        track.style.scrollBehavior = '';
        detectActive();
    });
}

/* ── Scroll-end detection ─────────────────────────────── */
function setupScrollEnd() {
    let scrollTimer = null;
    track.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(detectActive, 120);
    }, { passive: true });
}

function detectActive() {
    const center = track.scrollLeft + track.offsetWidth / 2;
    let closest = 0;
    let minDist = Infinity;

    tiles.forEach((t, i) => {
        const tileCenter = t.offsetLeft + t.offsetWidth / 2;
        const dist = Math.abs(center - tileCenter);
        if (dist < minDist) {
            minDist = dist;
            closest = i;
        }
    });

    if (closest !== activeIndex) {
        setActive(closest, false);
        if (onSelect) onSelect(stations[closest], closest);
    }
}

/* ── Public API ───────────────────────────────────────── */
export function selectByIndex(index, shouldScroll = true) {
    if (index < 0 || index >= stations.length) return;
    setActive(index, shouldScroll);
    if (onSelect) onSelect(stations[index], index);
}

export function next() {
    selectByIndex((activeIndex + 1) % stations.length);
}

export function prev() {
    selectByIndex((activeIndex - 1 + stations.length) % stations.length);
}

export function setActiveByStationId(id) {
    const idx = stations.findIndex(s => s.id === id);
    if (idx >= 0) setActive(idx, true);
}

export function getActiveIndex() {
    return activeIndex;
}

/* ── Internal ─────────────────────────────────────────── */
function setActive(index, shouldScroll) {
    tiles[activeIndex]?.classList.remove('active');
    activeIndex = index;
    tiles[activeIndex]?.classList.add('active');

    /* update page glow */
    const glow = document.querySelector('.page-glow');
    if (glow) {
        const hue = hueFromName(stations[index].name);
        glow.style.background = `radial-gradient(circle, hsla(${hue} 70% 50% / .12), transparent 70%)`;
        glow.classList.add('visible');
    }

    if (shouldScroll && tiles[index]) {
        tiles[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}
