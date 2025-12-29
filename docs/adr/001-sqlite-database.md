# ADR 001: Choice of SQLite for Database

## Status

Accepted

## Context

The POS system needs a reliable database that:

- Works offline for retail environments with intermittent connectivity
- Is easy to deploy and maintain
- Has low resource requirements
- Supports ACID transactions for financial data integrity
- Is compatible with Prisma ORM

## Decision

We will use SQLite as the primary database for the POS system.

## Consequences

### Positive

- Zero-configuration deployment
- Single file database simplifies backups
- Excellent performance for read-heavy workloads
- No separate database server to manage
- Works perfectly offline
- Low memory footprint

### Negative

- Limited concurrent write access (suitable for single-user POS)
- No built-in clustering or replication
- File-based storage requires careful backup strategies

## Alternatives Considered

### PostgreSQL

- Pros: Advanced features, better concurrency, enterprise-grade
- Cons: Higher complexity, resource requirements, not ideal for offline scenarios

### MySQL

- Pros: Widely used, good performance
- Cons: Similar complexity issues as PostgreSQL

### MongoDB

- Pros: Flexible schema, good for rapid development
- Cons: Not ideal for financial transactions requiring ACID compliance

## Related Documents

- Database schema in `database/prisma/schema.prisma`
- Backup scripts in `scripts/`

## Date

2025-12-29
