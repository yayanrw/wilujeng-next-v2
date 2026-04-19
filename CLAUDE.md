@AGENTS.md
@DESIGN_SYSTEM.md

## Context Navigation

1. **ALWAYS query the knowledge graph first** — use `/graphify` to analyze codebase changes
2. **PRD is the source of truth** — read the relevant PRD file for the feature you're working on
3. **Only read raw files if explicitly requested**
4. Use graphify-out/graph.json for codebase analysis

## PRD Structure

PRD dipecah menjadi file-file kecil di `docs/prd/`. Gunakan tabel di bawah untuk menavigasi ke topik yang relevan.

| Topik | File PRD |
|---|---|
| Overview & Tech Stack | @docs/prd/01-overview.md |
| User Roles & Permissions | @docs/prd/02-roles.md |
| Authentication | @docs/prd/03-auth.md |
| Dashboard | @docs/prd/04-dashboard.md |
| POS / Kasir | @docs/prd/05-pos.md |
| Products & Inventory | @docs/prd/06-products.md |
| Stock Management | @docs/prd/07-stock.md |
| Customers | @docs/prd/08-customers.md |
| Reports | @docs/prd/09-reports.md |
| Settings | @docs/prd/10-settings.md |
| Business Logic | @docs/prd/11-business-logic.md |
| Database Schema | @docs/prd/12-database-schema.md |
| Non-Functional Requirements | @docs/prd/13-non-functional.md |
| BXGY Promotions | @docs/prd/14-bxgy-promotions.md |

Full index: @docs/prd/README.md

## Codebase Knowledge Graph

Run `/graphify` to generate an up-to-date knowledge graph of the codebase.

Output is written to `graphify-out/`:
- `graph.json` — machine-readable graph (nodes, edges, clusters) for codebase analysis
- `graph.html` — visual cluster map, open in browser to explore

**When to regenerate:**
- After adding new files or major refactors
- Before analyzing cross-module dependencies
- When the existing `graph.json` feels stale

**How to use `graph.json`:**
- Find which files implement a feature (search by cluster/label)
- Trace dependencies between modules before editing
- Identify entry points for API routes, components, and stores

---

## Documentation & Change Flow

### Every App Change Must Update the PRD

**Workflow:**
1. When implementing features or changes, **first update the relevant PRD file(s)** in `docs/prd/`:
   - Database schema changes → `12-database-schema.md`
   - New API endpoints or changes → relevant feature file (e.g. `06-products.md`)
   - New UI/UX features → relevant feature file
   - Business logic rules → `11-business-logic.md`
   - User roles/permissions → `02-roles.md`
   - Cache strategies → `13-non-functional.md`

2. **Then implement the changes** in code following the PRD as specification

3. **Keep PRD files current** — at end of each session, verify the relevant file is up to date

### How to Read This App

1. **Find the relevant PRD file** from the table above
2. **Check database schema** — `docs/prd/12-database-schema.md`
3. **Review API contracts** — in the feature-specific PRD file
4. **Understand business rules** — `docs/prd/11-business-logic.md`
5. **Use the knowledge graph** — `/graphify` to find implementation details in code
