/**
 * player.js — Audio state machine.
 *
 * States: idle → connecting → playing ↔ buffering, error from any.
 * Emits 'player:statechange' on document with { state, station }.
 */

const STATES = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    PLAYING: 'playing',
    BUFFERING: 'buffering',
    ERROR: 'error',
    NO_STREAM: 'no-stream',
};

const STATUS_TEXT = {
    [STATES.IDLE]: 'Ready to play',
    [STATES.CONNECTING]: 'Connecting…',
    [STATES.PLAYING]: 'Now playing',
    [STATES.BUFFERING]: 'Buffering…',
    [STATES.ERROR]: 'Stream unavailable right now',
    [STATES.NO_STREAM]: 'No stream URL set for this station yet',
};

let audio = null;
let state = STATES.IDLE;
let currentStation = null;
let retryTimeout = null;
let hasRetried = false;

export function init(audioEl) {
    audio = audioEl;

    audio.addEventListener('playing', () => setState(STATES.PLAYING));
    audio.addEventListener('waiting', () => {
        if (state === STATES.PLAYING) setState(STATES.BUFFERING);
    });
    audio.addEventListener('pause', () => {
        /* only go idle if we explicitly paused (cleared src) */
    });
    audio.addEventListener('error', () => {
        if (!audio.src || audio.src === location.href) return;
        handleError();
    });
}

function setState(newState) {
    if (state === newState) return;
    state = newState;
    document.dispatchEvent(new CustomEvent('player:statechange', {
        detail: { state, station: currentStation, statusText: STATUS_TEXT[state] },
    }));
}

function handleError() {
    if (!hasRetried) {
        hasRetried = true;
        retryTimeout = setTimeout(() => {
            if (currentStation?.url) {
                audio.src = currentStation.url;
                audio.play().catch(() => setState(STATES.ERROR));
            } else {
                setState(STATES.ERROR);
            }
        }, 2000);
        setState(STATES.CONNECTING);
    } else {
        setState(STATES.ERROR);
    }
}

export function setStation(station) {
    clearTimeout(retryTimeout);
    hasRetried = false;
    currentStation = station;

    if (!station.url) {
        releaseStream();
        setState(STATES.NO_STREAM);
        return;
    }

    if (state === STATES.PLAYING || state === STATES.BUFFERING || state === STATES.CONNECTING) {
        /* switch stream immediately */
        audio.src = station.url;
        setState(STATES.CONNECTING);
        audio.play().catch(() => handleError());
    } else {
        /* just update UI, don't start playback */
        releaseStream();
        setState(STATES.IDLE);
    }
}

export function play() {
    if (!currentStation) return;
    if (!currentStation.url) {
        setState(STATES.NO_STREAM);
        return;
    }
    hasRetried = false;
    audio.src = currentStation.url;
    setState(STATES.CONNECTING);
    audio.play().catch(() => handleError());
}

export function pause() {
    releaseStream();
    setState(STATES.IDLE);
}

export function toggle() {
    if (state === STATES.PLAYING || state === STATES.BUFFERING || state === STATES.CONNECTING) {
        pause();
    } else {
        play();
    }
}

function releaseStream() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load(); /* release network connection */
}

export function setVolume(v) {
    if (audio) audio.volume = Math.max(0, Math.min(1, v));
}

export function getVolume() {
    return audio ? audio.volume : 0.8;
}

export function getState() {
    return state;
}

export function getStation() {
    return currentStation;
}

export function isPlaying() {
    return state === STATES.PLAYING || state === STATES.BUFFERING || state === STATES.CONNECTING;
}

export { STATES, STATUS_TEXT };
