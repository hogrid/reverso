# System Patterns - Reverso CMS

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                │
│   <h1 data-reverso="home.hero.title">Welcome</h1>          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     @reverso/scanner                         │
│   AST Parser → Schema Generator → JSON/Types Output         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      .reverso/schema.json                    │
│   { pages: [{ slug: 'home', sections: [...] }] }           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        @reverso/db     @reverso/api    @reverso/admin
         (Drizzle)       (Fastify)        (React)
```

## Core Patterns

### 1. Field Path Convention
```
{page}.{section}.{field}

Examples:
- home.hero.title          → Simple field
- home.hero.cta.text       → Nested field
- home.features.$.title    → Repeater item field
- home.features.$          → Repeater root
```

### 2. Marker Attributes
```tsx
// Primary marker (required)
data-reverso="page.section.field"

// Type modifier (optional, inferred if omitted)
data-reverso-type="text|textarea|image|..."

// Configuration modifiers
data-reverso-label="Field Label"
data-reverso-placeholder="Enter value..."
data-reverso-required
data-reverso-validation="min:5|max:100"
data-reverso-options="red,green,blue"
data-reverso-condition="other_field=value"
data-reverso-min="0"
data-reverso-max="100"
data-reverso-accept="image/*"
data-reverso-multiple
data-reverso-rows="5"
data-reverso-width="6"  // 1-12 grid columns
data-reverso-readonly
data-reverso-hidden
data-reverso-default="Default value"
data-reverso-help="Help text for editors"
```

### 3. Schema Structure
```typescript
interface ProjectSchema {
  version: string;
  generatedAt: string;
  pages: PageSchema[];
  pageCount: number;
  totalFields: number;
  meta: {
    srcDir: string;
    filesScanned: number;
    filesWithMarkers: number;
    scanDuration: number;
  };
}

interface PageSchema {
  slug: string;      // e.g., "home"
  name: string;      // e.g., "Home"
  sections: SectionSchema[];
  fieldCount: number;
  sourceFiles: string[];
}

interface SectionSchema {
  slug: string;      // e.g., "hero"
  name: string;      // e.g., "Hero"
  fields: FieldSchema[];
  isRepeater: boolean;
  order: number;
}

interface FieldSchema {
  path: string;      // e.g., "home.hero.title"
  type: FieldType;
  label?: string;
  // ... all attributes
  file: string;
  line: number;
  column: number;
}
```

## Design Decisions

### 1. ts-morph for AST Parsing
- **Why:** Full TypeScript/JSX support, easy node traversal
- **Trade-off:** Heavier than babel parser, but more maintainable

### 2. Hierarchical Schema
- **Why:** Maps naturally to admin UI organization
- **Pattern:** page → section → field (3-level hierarchy)

### 3. Watch Mode with Full Rescan
- **Current:** Rescans all files on any change
- **Future:** Incremental updates per file (optimization)

### 4. Type Inference
- **Pattern:** If `data-reverso-type` is omitted, infer from element:
  - `<img>` → image
  - `<textarea>` → textarea
  - `<input type="email">` → email
  - Default → text

### 5. Path Validation
- Minimum 3 parts: `page.section.field`
- Single `$` placeholder for repeaters
- `$` must be at position 3: `page.section.$`
- No empty segments

## Error Handling Patterns

```typescript
// Validation with Zod
const result = fieldPathSchema.safeParse(path);
if (!result.success) {
  return { errors: result.error.errors };
}

// Typed errors
interface ScanError {
  file: string;
  line: number;
  message: string;
  code: 'INVALID_PATH' | 'MISSING_TYPE' | ...;
}
```

## Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Vitest | 85-90% |
| Integration | Vitest | Key flows |
| E2E | Playwright | Critical paths |

## Performance Considerations
- Cache parsed AST per file
- Debounce watch events
- Parallel file processing
- JSON output only when changed
