# Paradies — Frontend

React 19 + TypeScript frontend for the Paradies casting management system.

## Tech Stack

| | |
|---|---|
| Framework | React 19 + Vite 7 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Fonts | Outfit Variable + Playfair Display Variable |
| Icons | Lucide React + Phosphor Icons |

## Getting Started

```sh
npm install
npm run dev
```

The dev server starts on `http://localhost:5173`. API requests are proxied to the backend at `http://localhost:8080` — the backend must be running for data to load (the app falls back to mock data if the API is unreachable).

## Project Structure

```
src/
├── components/       # Shared UI components and dashboard cards
├── lib/              # API client, auth context, utilities
└── pages/            # One file per route
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## API Proxy

The Vite dev server proxies these prefixes to `http://localhost:8080`:

`/castings`, `/residents`, `/cleaning-duties`, `/rooms`, `/auth`, `/magic-link`, `/calendar-entries`, `/aemtli`

In production, configure your reverse proxy (nginx, Caddy, etc.) to forward the same paths to the backend.
