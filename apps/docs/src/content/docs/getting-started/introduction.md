---
title: Introduction
description: Learn what Reverso CMS is and how it works
---

# What is Reverso?

**Reverso** is a headless CMS that works backwards from traditional systems. Instead of creating fields in the backend and then connecting them to your frontend, you simply add `data-reverso` attributes to your existing React/Next.js code, and Reverso automatically generates:

- Admin panel with all your fields
- Database schema
- REST & GraphQL APIs
- TypeScript types

## Philosophy

> "From front to back, not the other way around."

The developer works on the frontend code normally, adding `data-reverso` markers to elements that should be editable. Reverso scans the code, detects the markers, and creates the entire CMS structure automatically.

## Why Reverso?

| Traditional CMS | Reverso |
|-----------------|---------|
| Create fields manually in the backend | Fields are auto-detected from your code |
| Keep frontend and backend in sync manually | Single source of truth |
| WordPress + ACF + plugins = slow | Node.js + Fastify = 10x faster |
| No TypeScript support | Full type safety out of the box |
| Hours of setup | Ready in 5 minutes |
