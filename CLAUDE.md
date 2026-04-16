@AGENTS.md
@DESIGN_SYSTEM.md
@prd.md

## Context Navigation

1. **ALWAYS query the knowledge graph first** — use `/graphify` to analyze codebase changes
2. **PRD is the source of truth** — understand how the app works by reading @prd.md
3. **Only read raw files if explicitly requested**
4. Use graphify-out/graph.json for codebase analysis

## Documentation & Change Flow

### Every App Change Must Update the PRD

**Workflow:**
1. When implementing features or changes, **first update @prd.md** with:
   - Database schema changes (new tables, new columns)
   - New API endpoints or changes to existing ones
   - New UI/UX features or changes
   - New business logic rules
   - Changes to user roles/permissions
   - Cache invalidation strategies
   - i18n keys needed

2. **Then implement the changes** in code following the PRD as specification

3. **Keep @prd.md current** — at end of each session, verify:
   - Database changes are documented in Section 5/10
   - API contracts are documented in Section 7.7
   - UI changes are documented in relevant sections (3.x)
   - Business logic changes are documented in Section 4

### How to Read This App

1. **Start with @prd.md** — read the relevant section for feature
2. **Check database schema** — Section 5 (Conceptual) or 7.6 (Detailed) or 10 (Updates)
3. **Review API contracts** — Section 7.7 for endpoint specs
4. **Understand business rules** — Section 4 for logic/calculations
5. **Use the knowledge graph** — `/graphify` to find implementation details in code
