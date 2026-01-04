# PocketBank

Økonomisk ro. Klarhed uden støj.

En rolig, Kindle-inspireret budget-app på dansk.

## Om appen

PocketBank er en Progressive Web App (PWA) designet til at give dig økonomisk overblik uden stress. Appen er inspireret af Kindle's rolige læseoplevelse og fokuserer på klarhed og enkelhed.

### Funktioner

- **Månedligt budget**: Hold styr på indtægter og udgifter
- **Rådighedsbeløb**: Se tydeligt hvad du har tilbage
- **Opsparingsmål**: Planlæg og følg din opsparing
- **Offline-venlig**: Fungerer uden internetforbindelse
- **Installerbar**: Kan installeres som en app på din mobil

## Live Demo

Appen er deployed via GitHub Pages og kan tilgås her:

**https://mikkelreuter-cloud.github.io/PocketBank/**

Du kan installere appen direkte fra dette link på din mobil eller computer.

## Opsætning

### Krav

- En moderne webbrowser (Chrome, Safari, Firefox, Edge)
- En lokal webserver til udvikling

### GitHub Pages Deployment

Appen deployes automatisk til GitHub Pages når der pushes til `main` eller `claude/danish-budget-pwa-ZaAoX` branches.

For at aktivere GitHub Pages første gang:
1. Gå til repository Settings
2. Vælg "Pages" i venstre menu
3. Under "Source", vælg "GitHub Actions"
4. Næste push vil automatisk deploye appen

### Udvikling

1. Start en lokal webserver i projektmappen:

```bash
# Med Python
python3 -m http.server 8000

# Med Node.js
npx http-server

# Med PHP
php -S localhost:8000
```

2. Åbn `http://localhost:8000` i din browser

### Generering af app-ikoner

App-ikonerne skal genereres før appen kan installeres korrekt. Du har tre muligheder:

**Option 1: Browser-baseret** (nemmest)
1. Åbn `generate-icons.html` i din browser
2. Klik på knapperne for at downloade ikonerne
3. Placer de downloadede filer i projektets rodmappe

**Option 2: Node.js** (hvis canvas er installeret)
```bash
npm install canvas
node generate-icons.js
```

**Option 3: Manuel SVG konvertering**
Konverter `icon.svg` til PNG-filer med størrelse 192x192 og 512x512 pixels

## Teknisk

### Struktur

```
PocketBank/
├── index.html          # Hovedfil
├── styles.css          # Styling (Kindle-inspireret)
├── app.js             # Applikationslogik
├── manifest.json      # PWA manifest
├── service-worker.js  # Service worker til offline-funktionalitet
├── icon.svg           # SVG-ikon
└── README.md          # Denne fil
```

### Data

Al data gemmes lokalt i browserens localStorage. Ingen data sendes til eksterne servere.

### PWA funktioner

- **Offline-first**: Virker uden internet
- **Installerbar**: Kan tilføjes til hjemmeskærmen
- **Mobile-first**: Optimeret til mobiltelefoner

## Design-principper

### Visuel stil

- **Farver**: Off-white baggrund (#F5F3EF) med afdæmpede kontraster
- **Typografi**: Store, letlæselige fonte
- **Layout**: Enkelt kolonnelayout med meget luft
- **Minimalistisk**: Få visuelle elementer, ingen støj

### UX-principper

- Ingen pres eller deadlines
- Ingen gamification
- Neutral og rolig tone
- Kortfattede, venlige formuleringer på dansk

## Browser-kompatibilitet

- Chrome/Edge: Fuld support
- Safari: Fuld support (iOS 11.3+)
- Firefox: Fuld support

## Licens

Dette er et eksempel-projekt.
