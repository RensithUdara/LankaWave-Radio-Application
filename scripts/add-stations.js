const fs = require('fs');
const https = require('https');
const path = require('path');

const API_BASE = 'https://de1.api.radio-browser.info/json/stations/search';

const stationsToFind = [
    'Lite',
    'SLBC Tamil',
    'Kothmale',
    'Real Radio Sri Lanka',
    'Hadawatha FM',
    'Laksara',
    'Gee FM',
    'DreamzLanka',
    'Radiolanka',
    'freefm.lk',
    'Jothi FM',
    'Wallan Radio Cafe'
];

const stationsFile = path.join(__dirname, '../data/stations.json');
let existingStations = JSON.parse(fs.readFileSync(stationsFile, 'utf8'));

const makeRequest = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'LankaWaveCrawler/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
};

async function run() {
    const newStations = [];
    for (const query of stationsToFind) {
        console.log(`Searching for: ${query}`);
        const url = `${API_BASE}?name=${encodeURIComponent(query)}&limit=5&hidebroken=true`;
        try {
            const results = await makeRequest(url);
            const valid = results.find(r => r.url_resolved.startsWith('https://'));
            if (valid) {
                const station = {
                    id: query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    name: valid.name.trim(),
                    lang: valid.language ? valid.language.split(',')[0].trim() : 'Sinhala',
                    freq: '',
                    url: valid.url_resolved,
                    logo: valid.favicon ? valid.favicon : null
                };
                // Avoid duplicates
                if (!existingStations.find(s => s.id === station.id)) {
                    newStations.push(station);
                    existingStations.push(station);
                    console.log(`  Added: ${station.name}`);
                } else {
                    console.log(`  Skipped: Already exists.`);
                }
            } else {
                console.log(`  No HTTPS stream found.`);
            }
        } catch (err) {
            console.log(`  Error: ${err.message}`);
        }
    }

    if (newStations.length > 0) {
        fs.writeFileSync(stationsFile, JSON.stringify(existingStations, null, 2));
        console.log(`Successfully added ${newStations.length} stations!`);
    } else {
        console.log('No new stations to add.');
    }
}

run();
