# Paradies

A casting management system for student housing (WG) applications. Residents can create castings for vacant rooms, applicants submit applications via a public link, and residents evaluate candidates collaboratively.

> **Status:** Proof of Concept

## Architecture

| Component | Stack |
|---|---|
| **Backend** (`casting-svc/`) | Quarkus 3, Java 21, Hibernate Panache, PostgreSQL |
| **Frontend** (`casting-frontend/`) | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Dev environment** | Nix flake (optional) |

## Features

- **Create castings** — set move-in/out dates, application deadlines, and viewing times
- **Public application form** — eligibility check + application letter submission via shareable link
- **Evaluate applications** — residents rate applicants (Yes / Maybe / No / Veto / Friend / Not WOKO)
- **Admin dashboard** — manage castings, view and browse applications

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 20+
- Docker (for PostgreSQL via Quarkus Dev Services)

Or use the Nix flake: `nix develop`

### Backend

```sh
cd casting-svc
./mvnw quarkus:dev
```

The API starts on `http://localhost:8080`. Quarkus Dev Services automatically provisions a PostgreSQL database.

### Frontend

```sh
cd casting-frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and proxies API requests to the backend.

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/castings/{id}` | Create a casting |
| `GET` | `/castings` | List all castings |
| `GET` | `/castings/active/applications` | Get castings with open application periods |
| `PUT` | `/castings/{id}/time` | Set viewing time |
| `PUT` | `/castings/{id}/application-until` | Set application deadline |
| `PUT` | `/castings/{id}/close-applications` | Close applications |
| `POST` | `/castings/{id}/application` | Submit an application |
| `GET` | `/castings/{id}/application?id={appId}` | Get an application |
| `PUT` | `/castings/{id}/application/{appId}/evaluation` | Evaluate an application |

## License

MIT