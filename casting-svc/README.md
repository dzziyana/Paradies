# casting-svc

Quarkus 3 REST backend for the Paradies casting system.

## Running

```sh
./mvnw quarkus:dev
```

Requires Docker for automatic PostgreSQL provisioning via [Quarkus Dev Services](https://quarkus.io/guides/databases-dev-services).

The API is available at `http://localhost:8080`. The Dev UI is at `http://localhost:8080/q/dev/`.

## Tech stack

- Java 21, Quarkus 3, Hibernate ORM with Panache
- PostgreSQL (auto-provisioned in dev mode)
- SmallRye OpenAPI (spec available at `/q/openapi`)