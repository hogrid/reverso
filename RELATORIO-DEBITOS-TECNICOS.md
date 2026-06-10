# Relatório de Débitos Técnicos — Reverso CMS
Data: 2026-06-10 · Stack: Node 20+/TypeScript 6/pnpm/turbo · 442 arquivos de código
Fallow health score (baseline): 58/C · detect_secrets: 1 finding (falso positivo, TD-031)
Fontes: 3 varreduras completas (api+db+cli / admin+blocks+forms / core+scanner+client+mcp+infra), fallow audit, detect_secrets, auditoria devils-advocate da sessão.

Sumário: 6 críticos · 11 altos · 13 médios · 2 baixos · Total 32

## TD-001 — 🔴 Crítico — CSRF protection desabilitada por hardcode
**Dimensão:** seguranca · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/api/src/server.ts:152`
**Problema:** `const csrfEnabled = false;` ignora REVERSO_CSRF_ENABLED anunciado no .env.example. Rotas mutantes autenticadas por cookie ficam sem proteção CSRF em produção.
**Impacto:** Qualquer site malicioso pode disparar PATCH/PUT/POST autenticados em nome de um editor logado.

## TD-002 — 🔴 Crítico — syncSchema e bulkUpdateContent sem transaction
**Dimensão:** arquitetura · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/db/src/services/schema-sync.ts:41-129`
- `packages/db/src/queries/content.ts:206-236`
**Problema:** Loops de upsert/delete sequenciais sem db.transaction(). Falha no meio deixa schema/conteúdo parcialmente gravados, sem rollback.
**Impacto:** Corrupção de schema em sync interrompido; bulk save parcial sem indicação ao cliente.

## TD-003 — 🔴 Crítico — N+1 queries em GET /schema e /schema/stats
**Dimensão:** escalabilidade · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/api/src/routes/schema.ts:25-97`
- `packages/api/src/routes/schema.ts:140-174`
**Problema:** Reconstrução do schema consulta seções por página e campos por seção em loops aninhados (1+N+N*M queries).
**Impacto:** 10 páginas × 5 seções = 61 queries por request; admin degrada com schema real.

## TD-004 — 🟠 Alto — Cast `(request as any).user` em rotas
**Dimensão:** tipagem · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/api/src/routes/content.ts:189,240,354`
- `packages/api/src/routes/forms.ts:798`
**Problema:** request.user já é tipado pelo plugin de auth; cast `as any` desliga o type checking no caminho crítico de escrita.
**Impacto:** Erros de runtime invisíveis ao compilador; refatorações inseguras.

## TD-005 — 🟠 Alto — CLI scan.ts lê config via regex
**Dimensão:** cleancode · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/cli/src/commands/scan.ts:36-76`
**Problema:** readApiPortFromConfig/readSrcDirFromConfig fazem regex sobre o fonte do reverso.config; comentários e strings produzem matches falsos; falha cai em default silencioso. Duplica CONFIG_FILE_NAMES do core.
**Impacto:** Porta/srcDir errados sem aviso; sync silenciosamente aponta pra servidor errado.

## TD-006 — 🔴 Crítico — create-reverso gera projeto inválido
**Dimensão:** dependencias · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/create-reverso/src/index.ts:244`
- `packages/create-reverso/src/index.ts:340`
**Problema:** Template gera dependência '@reverso/cli': '^0.0.0' (versão inexistente) e config com chave `type:` em vez de `provider:` (falha na validação zod do core).
**Impacto:** Todo projeto criado via npx create-reverso nasce quebrado (install falha ou config inválida).

## TD-007 — 🟠 Alto — API ambígua createDatabase vs createDatabaseSchema
**Dimensão:** estrutura · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/db/src/index.ts:30,278`
- `packages/mcp/src/server.ts:198`
**Problema:** Dois exports com semântica próxima; consumidor (mcp) precisa adivinhar qual cria arquivo+schema vs qual só abre conexão.
**Impacto:** Integradores quebram em runtime ao escolher o export errado.

## TD-008 — 🔴 Crítico — CI/CD inteiro desativado
**Dimensão:** testabilidade · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `.github/workflows/ci.yml.disabled`
- `.github/workflows/release.yml.disabled`
- `.github/workflows/canary.yml.disabled`
- `.github/workflows/docs.yml.disabled`
**Problema:** Todos os workflows estão com extensão .disabled; nenhum check roda em push/PR.
**Impacto:** Zero garantia de qualidade em commits; regressões entram sem detecção.

## TD-009 — 🔴 Crítico — Sanitização XSS ad-hoc no admin (Wysiwyg/Markdown)
**Dimensão:** seguranca · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/admin/src/components/fields/WysiwygField.tsx:92`
- `packages/admin/src/components/fields/MarkdownField.tsx:228`
- `packages/admin/src/lib/utils.ts:118-138`
**Problema:** dangerouslySetInnerHTML usa sanitizeHtml() caseiro por regex; não cobre SVG, event handlers exóticos, mutation XSS.
**Impacto:** Editor com payload sofisticado executa script no admin (roubo de sessão de outros editores).

## TD-010 — 🟡 Médio — execSync com strings no CLI dev
**Dimensão:** seguranca · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/cli/src/commands/dev.ts:72-115`
**Problema:** Comandos shell montados por string (find/install). Inputs são internos (package manager fixo), mas o padrão é frágil a futuras interpolações.
**Impacto:** Vetor de injection latente se argumentos passarem a vir do usuário.

## TD-011 — 🟠 Alto — Token de sessão persistido em localStorage
**Dimensão:** seguranca · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/admin/src/stores/auth.ts:18,75,117,210`
**Problema:** Sessão é cookie httpOnly; o token duplicado no zustand persist (localStorage) só amplia superfície de XSS, sem uso real.
**Impacto:** Qualquer XSS no admin exfiltra token válido de sessão.

## TD-012 — 🟠 Alto — fetch sem timeout/guards no admin (client + auth store)
**Dimensão:** cleancode · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/admin/src/api/client.ts:26-97`
- `packages/admin/src/stores/auth.ts:54-189`
**Problema:** 5 fetches do auth store e o api client não têm timeout nem guard de content-type; response.json() em página de erro HTML lança exceção não tratada. Padrão de fetch duplicado 5×.
**Impacto:** UI trava em rede ruim; crash em 502/504 de proxy.

## TD-013 — 🟠 Alto — loadConfig depende de import() de .ts (Node >=22.6)
**Dimensão:** arquitetura · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/core/src/config/loader.ts:77`
**Problema:** Import dinâmico de reverso.config.ts exige type-stripping nativo; em Node 20 (engines mínimos declarados) falha com erro críptico.
**Impacto:** Usuários em Node 20/21 não conseguem carregar config TS; mensagem não orienta.

## TD-014 — 🟠 Alto — Scanner: memória do ts-morph Project e timers do watcher
**Dimensão:** escalabilidade · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/scanner/src/parser/ast-parser.ts:62`
- `packages/scanner/src/watch/watcher.ts:58,117-153`
**Problema:** Project acumula SourceFiles entre rescans (watch) sem remoção; debounceTimers Map não é limpo em unwatch/close.
**Impacto:** Memory leak em watch mode prolongado em projetos grandes.

## TD-015 — 🟡 Médio — SDK client engole erros silenciosamente
**Dimensão:** cleancode · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/client/src/index.ts:133`
**Problema:** catch {} retorna undefined para qualquer falha (DNS, CORS, timeout); doc não descreve failure mode.
**Impacto:** Impossível distinguir 'conteúdo não publicado' de 'API fora do ar' sem observabilidade.

## TD-016 — 🟠 Alto — content_history sem retenção
**Dimensão:** escalabilidade · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/db/src/queries/content.ts:266-294`
**Problema:** createContentHistory cresce sem limite; nenhuma poda/arquivamento.
**Impacto:** Bloat de DB e degradação de queries com o tempo.

## TD-017 — 🟡 Médio — Upload: validação de mimetype após início do stream + export sem paginação
**Dimensão:** seguranca · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/api/src/routes/media.ts:217-340`
- `packages/api/src/routes/forms.ts:900`
**Problema:** Mimetype checado depois do stream iniciar; export CSV carrega até 10000 submissions em memória de uma vez.
**Impacto:** Banda desperdiçada em uploads inválidos; OOM/timeout em exports grandes.

## TD-018 — 🟠 Alto — SSRF: webhook de formulário sem validação na criação
**Dimensão:** seguranca · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/api/src/routes/forms.ts:94`
- `packages/api/src/routes/forms.ts:1012-1020`
**Problema:** isUrlSafeForSSRF roda só no submit público; POST/PUT /forms aceita webhook arbitrário (rede interna).
**Impacto:** Admin malicioso/comprometido aponta webhook para serviços internos.

## TD-019 — 🟡 Médio — Sessão sem binding de contexto (UA/IP)
**Dimensão:** seguranca · **Plano desta sessão:** ISSUE-ONLY
**Localizações:**
- `packages/api/src/plugins/auth.ts:99-117`
**Problema:** Validação de sessão checa apenas token+expiração; token roubado funciona de qualquer origem.
**Impacto:** Session hijacking sem fricção.

## TD-020 — 🟠 Alto — Upload/galeria duplicado em 3 fields do admin
**Dimensão:** dry · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/admin/src/components/fields/FileField.tsx`
- `packages/admin/src/components/fields/ImageField.tsx`
- `packages/admin/src/components/fields/GalleryField.tsx:113-149`
**Problema:** Lógica de drag-drop/upload/biblioteca repetida (~90% entre FileField e ImageField).
**Impacto:** Correções não propagam; limites divergentes entre campos.

## TD-021 — 🟠 Alto — Stubs com dados falsos em campos do admin
**Dimensão:** cleancode · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/admin/src/components/fields/RelationField.tsx:27-36`
- `packages/admin/src/components/fields/MapField.tsx:59-93`
**Problema:** RelationField usa mockItems hardcoded; MapField simula geocoding com setTimeout. Nenhum sinaliza ao usuário que é stub.
**Impacto:** Editor publica conteúdo baseado em dados falsos; comportamento enganoso.

## TD-022 — 🟡 Médio — `as any` espalhado no admin
**Dimensão:** tipagem · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/admin/src/components/fields/FlexibleField.tsx:157`
- `packages/admin/src/components/fields/MapField.tsx:37-39`
- `packages/admin/src/components/fields/RelationField.tsx:44`
- `packages/admin/src/pages/FormSubmissionsPage.tsx`
**Problema:** Configs específicas de campo lidas via (field as any).X em vez de FieldSchema tipado (config).
**Impacto:** Type safety desligada nos pontos de extensão de campo.

## TD-023 — 🟡 Médio — Divergência types/config.ts vs validation.ts (ssl) e defaults triplicados
**Dimensão:** solid · **Plano desta sessão:** FIX-NOW
**Localizações:**
- `packages/core/src/types/config.ts:8-19`
- `packages/core/src/config/validation.ts:15-22`
- `packages/core/src/config/defaults.ts:26-31`
- `packages/core/src/config/loader.ts:64-68`
**Problema:** Schema zod aceita ssl que o tipo não expõe; defaults de database hardcoded em 3 lugares.
**Impacto:** Config válida no zod não compila no TS; mudanças de default não propagam.

## TD-024 — 🟡 Médio — Zero testes em pacotes críticos
**Dimensão:** testabilidade · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/mcp/src`
- `packages/cli/src`
- `packages/client/src`
- `packages/admin/src/components/fields`
**Problema:** mcp/cli/client sem nenhum teste; admin com 2 suites para 117 arquivos; schema-sync sem teste de integração com rotas.
**Impacto:** Regressões no fluxo central (scan→sync→content) só aparecem manualmente.

## TD-025 — 🟡 Médio — Dockerfile sem otimização de cache e healthcheck frágil
**Dimensão:** escalabilidade · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `Dockerfile:1-94`
**Problema:** COPY de fontes antes do install invalida cache de dependências a cada mudança.
**Impacto:** Builds de CI 5-10min mais lentos que o necessário.

## TD-026 — 🟡 Médio — Tratamento de erro genérico nas rotas (catch→500 uniforme)
**Dimensão:** cleancode · **Plano desta sessão:** ISSUE-ONLY
**Localizações:**
- `packages/api/src/routes/content.ts`
- `packages/api/src/routes/forms.ts`
- `packages/api/src/routes/media.ts`
**Problema:** Catches idênticos logam e devolvem 500 sem distinguir classe de erro.
**Impacto:** Debug difícil; clientes recebem 500 para erros recuperáveis.

## TD-027 — 🟡 Médio — GET /schema sem cache
**Dimensão:** escalabilidade · **Plano desta sessão:** ISSUE-ONLY
**Localizações:**
- `packages/api/src/routes/schema.ts:25-97`
**Problema:** Schema só muda em POST /schema/sync, mas é reconstruído do DB a cada GET.
**Impacto:** Carga desnecessária no caminho mais acessado do admin.

## TD-028 — 🟡 Médio — Componentes monolíticos no admin
**Dimensão:** estrutura · **Plano desta sessão:** ISSUE-ONLY
**Localizações:**
- `packages/admin/src/pages/FormBuilderPage.tsx (778 linhas)`
- `packages/admin/src/components/fields/FlexibleField.tsx (304 linhas)`
- `packages/admin/src/pages/PageEditorPage.tsx (5 responsabilidades)`
**Problema:** Páginas concentram fetch, estado, atalhos, autosave e UI num único arquivo.
**Impacto:** Refatoração arriscada; testes unitários inviáveis.

## TD-029 — 🟡 Médio — Listas sem virtualização (Repeater/Flexible/Gallery)
**Dimensão:** escalabilidade · **Plano desta sessão:** ISSUE-ONLY
**Localizações:**
- `packages/admin/src/components/fields/RepeaterField.tsx`
- `packages/admin/src/components/fields/FlexibleField.tsx`
- `packages/admin/src/components/fields/GalleryField.tsx`
**Problema:** Render de todos os itens; uploads múltiplos sem chunking; invalidation de media invalida lista inteira.
**Impacto:** Editor degrada com dezenas/centenas de itens.

## TD-030 — 🟢 Baixo — Lacunas de documentação e divergências menores
**Dimensão:** documentacao · **Plano desta sessão:** ISSUE-ONLY
**Localizações:**
- `packages/client/src/index.ts:7-10`
- `packages/db/src/services/schema-sync.ts:41`
- `apps/docs (coleção vazia)`
**Problema:** Failure modes não documentados no SDK; JSDoc ausente em lógica complexa; site de docs vazio.
**Impacto:** Onboarding lento; suposições erradas de integradores.

## TD-031 — 🟢 Baixo — detect_secrets: placeholder em .env.example
**Dimensão:** seguranca · **Plano desta sessão:** ISSUE-ONLY
**Localizações:**
- `.env.example:30`
**Problema:** DATABASE_URL com senha placeholder 'your-secure-password-here' — não é segredo real (falso positivo registrado por completude).
**Impacto:** Nenhum (placeholder intencional).

## TD-032 — 🟡 Médio — MCP: databasePath sem validação e handlers `any`
**Dimensão:** seguranca · **Plano desta sessão:** FIX-AGENT
**Localizações:**
- `packages/mcp/src/server.ts:82,92,198`
**Problema:** Path do SQLite aceito sem resolve/checagem; handlers tipados como any apesar de schema zod disponível.
**Impacto:** Cliente MCP pode abrir arquivo arbitrário; erros de tool só em runtime.



---

## STATUS DE RESOLUÇÃO (sessão 2026-06-10)

24/32 RESOLVIDOS · restantes médios/baixos não bloqueantes ou falso positivo.

- **TD-001**: RESOLVIDO — gate REVERSO_CSRF_ENABLED; cookie já httpOnly+SameSite=lax
- **TD-002**: RESOLVIDO — withTransaction() atômico (BEGIN/COMMIT/ROLLBACK via $client); teste de rollback
- **TD-003**: RESOLVIDO — GET /schema 3 queries+agrupamento; /schema/stats 3 COUNT
- **TD-004**: RESOLVIDO — casts (request as any).user removidos
- **TD-005**: RESOLVIDO — scan.ts usa loadConfig (AST) em vez de regex
- **TD-006**: RESOLVIDO — template via defineConfig, provider correto, deps 'latest'
- **TD-007**: RESOLVIDO — createDatabaseSchema desambiguado, alias removido, consumidores atualizados
- **TD-008**: RESOLVIDO — ci.yml reativado (release/canary/docs ficam .disabled: precisam secrets do usuário)
- **TD-009**: RESOLVIDO — DOMPurify com allowlist; testes de segurança atualizados
- **TD-010**: RESOLVIDO — execFileSync (sem shell)
- **TD-011**: RESOLVIDO — token fora do localStorage (partialize vazio)
- **TD-012**: RESOLVIDO — AbortSignal.timeout + parse JSON seguro (admin store + client + SDK)
- **TD-013**: RESOLVIDO — jiti carrega .ts em Node 20+
- **TD-014**: RESOLVIDO — Project.clear() por scan; clearDebounceTimers no stop/close
- **TD-015**: RESOLVIDO — onError hook no @reverso/client
- **TD-016**: RESOLVIDO — MAX_CONTENT_HISTORY=50 + pruneContentHistory transacional
- **TD-017**: RESOLVIDO — validação de extensão antes do stream
- **TD-018**: RESOLVIDO — isUrlSafeForSSRF na criação/update de form
- **TD-019**: PENDENTE (médio) — binding de sessão por UA/IP; não bloqueante (cookie httpOnly+SameSite mitiga)
- **TD-020**: RESOLVIDO — hook useFileDropZone compartilhado (FileField+GalleryField)
- **TD-021**: RESOLVIDO — RelationField usa páginas reais; MapField geocoding Nominatim real
- **TD-022**: RESOLVIDO — casts as any tipados (Map/Relation/Flexible/FormSubmissions)
- **TD-023**: RESOLVIDO — defaults unificados no loader
- **TD-024**: PARCIAL — +rollback/history/sanitize tests; cobertura ampla de mcp/cli ainda baixa (não bloqueante)
- **TD-025**: RESOLVIDO — Dockerfile cache layers + toolchain native
- **TD-026**: PENDENTE (médio) — error handling genérico; não bloqueante
- **TD-027**: PENDENTE (médio) — cache do GET /schema; não bloqueante
- **TD-028**: PENDENTE (médio) — componentes monolíticos; refactor estrutural, não bloqueante
- **TD-029**: PENDENTE (médio) — virtualização de listas; otimização, não bloqueante
- **TD-030**: PENDENTE (baixo) — docs
- **TD-031**: N/A — falso positivo (placeholder .env.example)
- **TD-032**: RESOLVIDO — resolveDatabasePath + handlers tipados (sem any)
