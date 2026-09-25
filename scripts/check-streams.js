/**
 * check-streams.js — Node.js script to test station stream URLs.
 *
 * Usage: node scripts/check-streams.js
 *
 * Reads data/stations.json, requests each URL, and prints a result table.
 * Never modifies the data file.
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '..', 'data', 'stations.json');

async function checkStream(station) {
    if (!station.url) {
        return { name: station.name, status: '—', type: '—', time: '—', note: 'No URL' };
    }

    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(station.url, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Range': 'bytes=0-1023' }, /* only fetch first KB */
        });

        clearTimeout(timeout);
        const elapsed = Date.now() - start;
        const contentType = res.headers.get('content-type') || '?';

        return {
            name: station.name,
            status: res.status,
            type: contentType.split(';')[0],
            time: `${elapsed}ms`,
            note: res.ok ? '✓' : res.statusText,
        };
    } catch (err) {
        return {
            name: station.name,
            status: 'ERR',
            type: '—',
            time: `${Date.now() - start}ms`,
            note: err.name === 'AbortError' ? 'Timeout' : err.message.slice(0, 40),
        };
    }
}

async function main() {
    const raw = await readFile(DATA_PATH, 'utf-8');
    const stations = JSON.parse(raw);

    console.log(`\nChecking ${stations.length} stations...\n`);

    const results = [];
    for (const s of stations) {
        process.stdout.write(`  ${s.name}... `);
        const result = await checkStream(s);
        console.log(result.note);
        results.push(result);
    }

    console.log('\n' + '─'.repeat(80));
    console.log(
        'Station'.padEnd(35) +
        'Status'.padEnd(8) +
        'Type'.padEnd(22) +
        'Time'.padEnd(10) +
        'Note'
    );
    console.log('─'.repeat(80));

    for (const r of results) {
        console.log(
            r.name.padEnd(35) +
            String(r.status).padEnd(8) +
            r.type.padEnd(22) +
            r.time.padEnd(10) +
            r.note
        );
    }
    console.log('─'.repeat(80) + '\n');
}

main().catch(console.error);
