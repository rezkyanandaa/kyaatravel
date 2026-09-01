# KYAA'S TRAVEL PLANNER

Modern Gen Z travel companion — aesthetic, playful, premium, and highly interactive.

A single-page web app that combines a personal travel dashboard, interactive itinerary planner, places collection, budget tracker, packing list, and scrapbook-style journal.

## Features

- **Dashboard** — Personal greeting, upcoming trip with countdown, weather preview, packing progress, quick actions, recent trips
- **Trip Planner** — Create trips with name, destination, dates, cover image, companions, description
- **Interactive Itinerary** — Timeline view, add/edit/delete activities, drag-and-drop reorder, time, location, notes, categories
- **Places** — Collection of spots with photo, category, rating, notes, favorite
- **Budget** — Expense tracker with categories, progress bar, simple chart, multi-currency
- **Packing List** — Interactive checklist with progress percentage
- **Travel Journal** — Scrapbook-style entries with photo, date, location, story, mood
- **Explore** — Immersive destination cards (Tokyo, Seoul, Paris, Bali, etc.)
- **Extras** — Dark mode, search, favorites, notifications UI, localStorage persistence, import/export JSON, print-friendly itinerary, empty states, toasts, smooth transitions, responsive mobile nav

## Design

- Palette: warm ivory, cream, soft beige, broken white, mahogany, peach
- Style: minimalist editorial + soft glassmorphism
- Typography: Inter + Playfair Display
- Rounded cards, subtle shadows, soft gradients, micro-interactions

## How to run

1. Unzip the folder
2. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
3. Or serve with any static server:

```bash
npx serve .
# or
python -m http.server 8080
```

No build step required. All data is stored in `localStorage`.

## File structure

```
kyaas-travel-planner/
├── index.html
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── storage.js
    ├── data.js
    ├── ui.js
    └── app.js
```

## Import / Export

- Export trips as JSON from My Trips or Dashboard quick actions
- Import a previously exported JSON file to restore or merge trips

## Print

Open a trip → Overview → “Print itinerary” (or use browser print). Styles hide navigation and keep the timeline clean.

---

Made with ✈️ for the next adventure.
