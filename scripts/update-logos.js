import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '..', 'data', 'stations.json');

async function main() {
    const raw = await readFile(DATA_PATH, 'utf-8');
    let stations = JSON.parse(raw);

    // Fetch from the API
    const res = await fetch('https://de1.api.radio-browser.info/json/stations/search?country=Sri%20Lanka&limit=100&order=clickcount&reverse=true');
    const apiStations = await res.json();

    stations = stations.map(s => {
        let apiStation = apiStations.find(as => as.name.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(as.name.toLowerCase()));

        // some manual matching if needed
        if (!apiStation) {
            if (s.id === 'lakhanda') apiStation = apiStations.find(as => as.name.toLowerCase().includes('lakhanda'));
            if (s.id === 'radio-plus') apiStation = apiStations.find(as => as.name.toLowerCase().includes('radio plus'));
        }

        if (apiStation && apiStation.favicon) {
            s.logo = apiStation.favicon;
        }
        return s;
    });

    await writeFile(DATA_PATH, JSON.stringify(stations, null, 2));
    console.log('Updated stations.json with logos.');
}

main().catch(console.error);
