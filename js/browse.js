/**
 * browse.js — Search, language filters, station grid.
 */

import { getHue } from './carousel.js';

let grid = null;
let emptyState = null;
let countEl = null;
let searchInput = null;
let filterBtns = [];
let stations = [];
let activeFilter = 'all';
let searchQuery = '';
let onCardSelect = null; /* callback(station) */
let activeStationId = null;
let favouriteIds = new Set();
let recentIds = [];

/* ── Init ─────────────────────────────────────────────── */
export function init(elements, stationList, selectCallback) {
    grid = elements.grid;
    emptyState = elements.emptyState;
    countEl = elements.countEl;
    searchInput = elements.searchInput;
    stations = stationList;
    onCardSelect = selectCallback;

    /* filters */
    filterBtns = [...document.querySelectorAll('.filter')];
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.dataset.filter;
            filterBtns.forEach(b => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-pressed', b === btn);
            });
            applyFilters();
        });
    });

    /* search */
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        applyFilters();
    });

    /* show-all button */
    elements.btnShowAll.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        activeFilter = 'all';
        filterBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.filter === 'all');
            b.setAttribute('aria-pressed', b.dataset.filter === 'all');
        });
        applyFilters();
    });

    renderGrid(stations);
}

/* ── Filtering ────────────────────────────────────────── */
function applyFilters() {
    let source = stations;
    if (activeFilter === 'recent') {
        source = recentIds.map(id => stations.find(s => s.id === id)).filter(Boolean);
    }

    const filtered = source.filter(s => {
        const matchLang = activeFilter === 'all' || activeFilter === 'recent' ||
            (activeFilter === 'favourites' && favouriteIds.has(s.id)) ||
            s.lang.toLowerCase() === activeFilter.toLowerCase();
        const matchSearch = !searchQuery ||
            s.name.toLowerCase().includes(searchQuery) ||
            s.lang.toLowerCase().includes(searchQuery) ||
            (s.freq && s.freq.includes(searchQuery));
        return matchLang && matchSearch;
    });

    renderGrid(filtered);
}

/* ── Render ────────────────────────────────────────────── */
function renderGrid(list) {
    grid.innerHTML = '';

    if (list.length === 0) {
        grid.style.display = 'none';
        emptyState.hidden = false;
        const message = emptyState.querySelector('p');
        if (message) {
            message.textContent = activeFilter === 'favourites'
                ? 'No favourite stations yet.'
                : activeFilter === 'recent'
                    ? 'Your recently played stations will appear here.'
                    : 'No stations match that search.';
        }
        countEl.textContent = '0 stations';
        return;
    }

    grid.style.display = '';
    emptyState.hidden = true;
    countEl.textContent = list.length === 1 ? '1 station' : `${list.length} stations`;

    list.forEach(s => {
        const card = document.createElement('button');
        card.className = 'card' + (s.id === activeStationId ? ' active' : '');
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `Play ${s.name}`);
        if (favouriteIds.has(s.id)) card.setAttribute('aria-label', `Play favourite station ${s.name}`);
        card.dataset.id = s.id;

        const hue = getHue(s);

        /* logo or initials */
        const logo = document.createElement('div');
        logo.className = 'card__logo';
        logo.style.background = `linear-gradient(135deg, hsl(${hue} 60% 35%), hsl(${hue} 50% 20%))`;
        const initials = s.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
        logo.textContent = initials;
        if (s.logo) {
            const img = document.createElement('img');
            img.src = s.logo;
            img.alt = '';
            img.loading = 'lazy';
            img.addEventListener('error', () => img.remove(), { once: true });
            logo.appendChild(img);
        }

        /* body */
        const body = document.createElement('div');
        body.className = 'card__body';
        const nameEl = document.createElement('div');
        nameEl.className = 'card__name';
        nameEl.textContent = s.name;
        const detail = document.createElement('div');
        detail.className = 'card__detail';
        detail.textContent = [s.lang, s.freq ? `${s.freq} MHz` : ''].filter(Boolean).join(' • ');
        body.appendChild(nameEl);
        body.appendChild(detail);
        if (favouriteIds.has(s.id)) {
            const favouriteMark = document.createElement('span');
            favouriteMark.className = 'card__favourite';
            favouriteMark.textContent = 'Favourite';
            body.appendChild(favouriteMark);
        }

        /* play icon */
        const playBtn = document.createElement('div');
        playBtn.className = 'card__play';
        playBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

        card.appendChild(logo);
        card.appendChild(body);
        card.appendChild(playBtn);

        card.addEventListener('click', () => {
            if (onCardSelect) onCardSelect(s);
        });

        grid.appendChild(card);
    });
}

/* ── Highlight active card ────────────────────────────── */
export function setActiveCard(stationId) {
    activeStationId = stationId;
    grid.querySelectorAll('.card').forEach(c => {
        c.classList.toggle('active', c.dataset.id === stationId);
    });
}

export function setCollections(favourites, recent) {
    favouriteIds = new Set(favourites);
    recentIds = recent;
    const count = document.getElementById('favouriteCount');
    if (count) count.textContent = String(favouriteIds.size);
    applyFilters();
}

/* ── Focus search ─────────────────────────────────────── */
export function focusSearch() {
    searchInput.focus();
    searchInput.select();
}
