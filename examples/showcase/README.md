# Reverso Showcase Example

A reference Next.js app that exercises **every Reverso CMS field type** in a
single `showcase` page. Use it to validate the full flow: scan -> admin ->
edit -> frontend render.

Each section of the home page maps to one section of the `showcase` page and
demonstrates a family of field types:

| Section        | Field types                                                  |
| -------------- | ------------------------------------------------------------ |
| `TextSection`  | text, textarea, email, phone, url, number, range             |
| `RichSection`  | wysiwyg, markdown, code                                       |
| `ChoiceSection`| select, multiselect, boolean, radio, checkboxgroup           |
| `MediaSection` | image, gallery, file, video, color                           |
| `DateSection`  | date, datetime, time                                         |
| `TeamSection`  | repeater (`showcase.team.$.{name,role,avatar,bio}`)          |
| `FaqSection`   | repeater (`showcase.faq.$.{question,answer}`)                |
| `LinkSection`  | link, relation                                               |
| `MapSection`   | map                                                          |

Every editable element carries `data-reverso` + `data-reverso-type` (plus
`data-reverso-label`, `data-reverso-options`, `data-reverso-required`,
`data-reverso-help` and `data-reverso-placeholder` where useful). The JSX text
is the fallback shown until content is published from the admin.

## Path grammar

Marker paths follow `page.section.field` (3+ parts). Repeater item fields use
`$` only in the 3rd position: `page.section.$.subfield`. The repeater container
element is never marked directly — the scanner infers it from the `$` markers
inside the `.map()`.

## Getting started

1. Install dependencies (from the repo root):
   ```bash
   pnpm install
   ```

2. Scan for markers (generates `.reverso/schema.json` offline):
   ```bash
   pnpm reverso:scan
   ```

3. Start the Reverso admin / API:
   ```bash
   pnpm reverso:dev
   ```

4. In another terminal, run the Next.js app:
   ```bash
   pnpm dev
   ```

The frontend reads published content from the Reverso API
(`NEXT_PUBLIC_REVERSO_URL`, default `http://localhost:3001`).
