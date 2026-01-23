# Product Context - Reverso CMS

## Problem Statement

### Traditional CMS Pain Points
1. **Schema-first workflow** - Define content structure before building UI
2. **Disconnect** - Frontend developers must learn CMS-specific concepts
3. **Type safety gaps** - Manual type definitions that drift from schema
4. **Complex setup** - Multiple tools and configurations required
5. **Lock-in** - Difficult to migrate between CMS platforms

### Developer Experience Issues
- Switching context between code and CMS admin
- Manually syncing field definitions
- Boilerplate for API integrations
- No single source of truth

## Solution: Front-to-Back CMS

Reverso inverts the workflow:

```
Traditional: Schema → Admin → API → Frontend
Reverso:     Frontend → Scanner → Schema → Admin + API + DB
```

### How It Works
1. Developer adds `data-reverso` markers to existing JSX
2. Scanner detects markers and extracts field definitions
3. Schema is generated automatically
4. Admin panel, API, and database are created from schema
5. Content edits flow back to frontend via API

## User Experience Goals

### For Developers
- **Zero friction** - Add markers, run scan, done
- **Type safety** - Generated types match actual content
- **Hot reload** - Watch mode updates schema on file change
- **Familiar tools** - React, TypeScript, existing workflow

### For Content Editors
- **Intuitive UI** - Visual field types (image pickers, rich text, etc.)
- **Context-aware** - Fields organized by page/section
- **Preview** - See changes before publishing
- **Validation** - Real-time feedback on required fields

## Competitive Landscape

| Feature | Reverso | Sanity | Strapi | Payload |
|---------|---------|--------|--------|---------|
| Front-to-back | ✅ | ❌ | ❌ | ❌ |
| Zero config | ✅ | ❌ | ❌ | ❌ |
| Marker-based | ✅ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ | ❌ | ✅ | ✅ |
| TypeScript native | ✅ | ✅ | ⚠️ | ✅ |

## Success Metrics
- Time from install to first content edit < 5 minutes
- Zero manual type definitions required
- 100% type coverage for content access
- Watch mode latency < 500ms
