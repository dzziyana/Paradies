# Paradies

A casting (roommate selection) management system for student shared flats (WG). Designed for [WOKO](https://www.woko.ch/) housing in Zurich, but adaptable to any shared flat that wants a structured roommate selection process.

Residents manage castings and evaluate applicants collaboratively. Applicants apply via a public link and track their status via a magic link.

## Features

**For residents**
- Dashboard with cleaning duties, active castings, upcoming birthdays, and a shared WG calendar
- Create and manage castings (move-in/out dates, application deadlines, viewing times)
- Evaluate applicants with six verdict options: YES / MAYBE / NO / VETO / FRIEND / NOT_WOKO
- All votes are visible as a log — designed for transparent group discussion
- Cleaning duty planner with auto-assignment algorithm and completion tracking
- Resident management, Ämtli (permanent household responsibilities) assignment, and semester cleaning dates
- Room catalogue with photos, sizes, and floor info

**For applicants**
- WOKO eligibility questionnaire before the application form
- Application form with motivation letter; NLP keyword extraction surfaces standout phrases for residents
- Magic link to check application status and withdraw at any time

## Architecture

| Component | Stack |
|---|---|
| `casting-svc/` | Quarkus 3, Java 21, Hibernate Panache ORM, PostgreSQL |
| `casting-frontend/` | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| `nlp-svc/` | FastAPI + YAKE (keyword extraction microservice) |
| Dev environment | Nix flake (optional) |

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 20+
- Docker (used by Quarkus Dev Services to provision PostgreSQL automatically)
- Python 3.11+ (optional — only needed if you want keyword extraction)

Or use the Nix flake to get all of the above: `nix develop`

### 1. Backend

```sh
cd casting-svc
./mvnw quarkus:dev
```

The API starts on `http://localhost:8080`. Quarkus Dev Services automatically provisions a PostgreSQL container. On first start, a dev seed account is created — credentials are printed to the console.

### 2. NLP service (optional)

```sh
cd nlp-svc
pip install -r requirements.txt
uvicorn main:app --port 8090
```

If the NLP service is not running, keyword extraction is skipped gracefully.

### 3. Frontend

```sh
cd casting-frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and proxies API requests to the backend.

## Configuration

All runtime configuration is passed via environment variables. The backend reads:

| Variable | Default | Description |
|---|---|---|
| `APP_BASE_URL` | `http://localhost:5173` | Base URL used in outgoing emails (magic links, invites) |
| `MAIL_MOCK` | `true` | If `true`, emails are logged to console instead of sent |
| `MAIL_HOST` | `localhost` | SMTP host (production) |
| `MAIL_PORT` | `1025` | SMTP port (production) |
| `MAIL_USER` | — | SMTP username (production) |
| `MAIL_PASSWORD` | — | SMTP password (production) |

Database credentials are managed by Quarkus (`quarkus.datasource.*`). In production, set `QUARKUS_DATASOURCE_URL`, `QUARKUS_DATASOURCE_USERNAME`, and `QUARKUS_DATASOURCE_PASSWORD`.

## API Overview

Full API reference is in [`paradies-requirements.md`](paradies-requirements.md) section 10.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/castings` | Create a casting |
| `GET` | `/castings` | List all castings |
| `GET` | `/castings/active/applications` | Active castings with application stats |
| `PUT` | `/castings/:id/close-applications` | Close application period |
| `POST` | `/castings/:id/application` | Submit an application |
| `PUT` | `/castings/:id/application/:appId/evaluation` | Evaluate an application |
| `GET` | `/residents` | List residents |
| `GET` | `/cleaning-duties/generate` | Generate proposed cleaning plan for a month |
| `GET` | `/calendar-entries` | List WG calendar entries |
| `GET` | `/aemtli` | List Ämtli with current assignees |

## License

MIT
