### [TD-001] 🔴 CSRF protection desabilitada por hardcode
Labels: `critical`,`seguranca`,`tech-debt`

**Resumo:** CSRF protection desabilitada por hardcode

**Dimensão:** seguranca · **Severidade:** 🔴 Crítico

**Localizações:**
- `packages/api/src/server.ts:152`

**Problema:** `const csrfEnabled = false;` ignora REVERSO_CSRF_ENABLED anunciado no .env.example. Rotas mutantes autenticadas por cookie ficam sem proteção CSRF em produção.

**Impacto:** Qualquer site malicioso pode disparar PATCH/PUT/POST autenticados em nome de um editor logado.

---

### [TD-002] 🔴 syncSchema e bulkUpdateContent sem transaction
Labels: `critical`,`arquitetura`,`tech-debt`

**Resumo:** syncSchema e bulkUpdateContent sem transaction

**Dimensão:** arquitetura · **Severidade:** 🔴 Crítico

**Localizações:**
- `packages/db/src/services/schema-sync.ts:41-129`
- `packages/db/src/queries/content.ts:206-236`

**Problema:** Loops de upsert/delete sequenciais sem db.transaction(). Falha no meio deixa schema/conteúdo parcialmente gravados, sem rollback.

**Impacto:** Corrupção de schema em sync interrompido; bulk save parcial sem indicação ao cliente.

---

### [TD-003] 🔴 N+1 queries em GET /schema e /schema/stats
Labels: `critical`,`escalabilidade`,`tech-debt`

**Resumo:** N+1 queries em GET /schema e /schema/stats

**Dimensão:** escalabilidade · **Severidade:** 🔴 Crítico

**Localizações:**
- `packages/api/src/routes/schema.ts:25-97`
- `packages/api/src/routes/schema.ts:140-174`

**Problema:** Reconstrução do schema consulta seções por página e campos por seção em loops aninhados (1+N+N*M queries).

**Impacto:** 10 páginas × 5 seções = 61 queries por request; admin degrada com schema real.

---

### [TD-004] 🟠 Cast `(request as any).user` em rotas
Labels: `high`,`tipagem`,`tech-debt`

**Resumo:** Cast `(request as any).user` em rotas

**Dimensão:** tipagem · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/api/src/routes/content.ts:189,240,354`
- `packages/api/src/routes/forms.ts:798`

**Problema:** request.user já é tipado pelo plugin de auth; cast `as any` desliga o type checking no caminho crítico de escrita.

**Impacto:** Erros de runtime invisíveis ao compilador; refatorações inseguras.

---

### [TD-005] 🟠 CLI scan.ts lê config via regex
Labels: `high`,`cleancode`,`tech-debt`

**Resumo:** CLI scan.ts lê config via regex

**Dimensão:** cleancode · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/cli/src/commands/scan.ts:36-76`

**Problema:** readApiPortFromConfig/readSrcDirFromConfig fazem regex sobre o fonte do reverso.config; comentários e strings produzem matches falsos; falha cai em default silencioso. Duplica CONFIG_FILE_NAMES do core.

**Impacto:** Porta/srcDir errados sem aviso; sync silenciosamente aponta pra servidor errado.

---

### [TD-006] 🔴 create-reverso gera projeto inválido
Labels: `critical`,`dependencias`,`tech-debt`

**Resumo:** create-reverso gera projeto inválido

**Dimensão:** dependencias · **Severidade:** 🔴 Crítico

**Localizações:**
- `packages/create-reverso/src/index.ts:244`
- `packages/create-reverso/src/index.ts:340`

**Problema:** Template gera dependência '@reverso/cli': '^0.0.0' (versão inexistente) e config com chave `type:` em vez de `provider:` (falha na validação zod do core).

**Impacto:** Todo projeto criado via npx create-reverso nasce quebrado (install falha ou config inválida).

---

### [TD-007] 🟠 API ambígua createDatabase vs createDatabaseSchema
Labels: `high`,`estrutura`,`tech-debt`

**Resumo:** API ambígua createDatabase vs createDatabaseSchema

**Dimensão:** estrutura · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/db/src/index.ts:30,278`
- `packages/mcp/src/server.ts:198`

**Problema:** Dois exports com semântica próxima; consumidor (mcp) precisa adivinhar qual cria arquivo+schema vs qual só abre conexão.

**Impacto:** Integradores quebram em runtime ao escolher o export errado.

---

### [TD-008] 🔴 CI/CD inteiro desativado
Labels: `critical`,`testabilidade`,`tech-debt`

**Resumo:** CI/CD inteiro desativado

**Dimensão:** testabilidade · **Severidade:** 🔴 Crítico

**Localizações:**
- `.github/workflows/ci.yml.disabled`
- `.github/workflows/release.yml.disabled`
- `.github/workflows/canary.yml.disabled`
- `.github/workflows/docs.yml.disabled`

**Problema:** Todos os workflows estão com extensão .disabled; nenhum check roda em push/PR.

**Impacto:** Zero garantia de qualidade em commits; regressões entram sem detecção.

---

### [TD-009] 🔴 Sanitização XSS ad-hoc no admin (Wysiwyg/Markdown)
Labels: `critical`,`seguranca`,`tech-debt`

**Resumo:** Sanitização XSS ad-hoc no admin (Wysiwyg/Markdown)

**Dimensão:** seguranca · **Severidade:** 🔴 Crítico

**Localizações:**
- `packages/admin/src/components/fields/WysiwygField.tsx:92`
- `packages/admin/src/components/fields/MarkdownField.tsx:228`
- `packages/admin/src/lib/utils.ts:118-138`

**Problema:** dangerouslySetInnerHTML usa sanitizeHtml() caseiro por regex; não cobre SVG, event handlers exóticos, mutation XSS.

**Impacto:** Editor com payload sofisticado executa script no admin (roubo de sessão de outros editores).

---

### [TD-010] 🟡 execSync com strings no CLI dev
Labels: `medium`,`seguranca`,`tech-debt`

**Resumo:** execSync com strings no CLI dev

**Dimensão:** seguranca · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/cli/src/commands/dev.ts:72-115`

**Problema:** Comandos shell montados por string (find/install). Inputs são internos (package manager fixo), mas o padrão é frágil a futuras interpolações.

**Impacto:** Vetor de injection latente se argumentos passarem a vir do usuário.

---

### [TD-011] 🟠 Token de sessão persistido em localStorage
Labels: `high`,`seguranca`,`tech-debt`

**Resumo:** Token de sessão persistido em localStorage

**Dimensão:** seguranca · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/admin/src/stores/auth.ts:18,75,117,210`

**Problema:** Sessão é cookie httpOnly; o token duplicado no zustand persist (localStorage) só amplia superfície de XSS, sem uso real.

**Impacto:** Qualquer XSS no admin exfiltra token válido de sessão.

---

### [TD-012] 🟠 fetch sem timeout/guards no admin (client + auth store)
Labels: `high`,`cleancode`,`tech-debt`

**Resumo:** fetch sem timeout/guards no admin (client + auth store)

**Dimensão:** cleancode · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/admin/src/api/client.ts:26-97`
- `packages/admin/src/stores/auth.ts:54-189`

**Problema:** 5 fetches do auth store e o api client não têm timeout nem guard de content-type; response.json() em página de erro HTML lança exceção não tratada. Padrão de fetch duplicado 5×.

**Impacto:** UI trava em rede ruim; crash em 502/504 de proxy.

---

### [TD-013] 🟠 loadConfig depende de import() de .ts (Node >=22.6)
Labels: `high`,`arquitetura`,`tech-debt`

**Resumo:** loadConfig depende de import() de .ts (Node >=22.6)

**Dimensão:** arquitetura · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/core/src/config/loader.ts:77`

**Problema:** Import dinâmico de reverso.config.ts exige type-stripping nativo; em Node 20 (engines mínimos declarados) falha com erro críptico.

**Impacto:** Usuários em Node 20/21 não conseguem carregar config TS; mensagem não orienta.

---

### [TD-014] 🟠 Scanner: memória do ts-morph Project e timers do watcher
Labels: `high`,`escalabilidade`,`tech-debt`

**Resumo:** Scanner: memória do ts-morph Project e timers do watcher

**Dimensão:** escalabilidade · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/scanner/src/parser/ast-parser.ts:62`
- `packages/scanner/src/watch/watcher.ts:58,117-153`

**Problema:** Project acumula SourceFiles entre rescans (watch) sem remoção; debounceTimers Map não é limpo em unwatch/close.

**Impacto:** Memory leak em watch mode prolongado em projetos grandes.

---

### [TD-015] 🟡 SDK client engole erros silenciosamente
Labels: `medium`,`cleancode`,`tech-debt`

**Resumo:** SDK client engole erros silenciosamente

**Dimensão:** cleancode · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/client/src/index.ts:133`

**Problema:** catch {} retorna undefined para qualquer falha (DNS, CORS, timeout); doc não descreve failure mode.

**Impacto:** Impossível distinguir 'conteúdo não publicado' de 'API fora do ar' sem observabilidade.

---

### [TD-016] 🟠 content_history sem retenção
Labels: `high`,`escalabilidade`,`tech-debt`

**Resumo:** content_history sem retenção

**Dimensão:** escalabilidade · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/db/src/queries/content.ts:266-294`

**Problema:** createContentHistory cresce sem limite; nenhuma poda/arquivamento.

**Impacto:** Bloat de DB e degradação de queries com o tempo.

---

### [TD-017] 🟡 Upload: validação de mimetype após início do stream + export sem paginação
Labels: `medium`,`seguranca`,`tech-debt`

**Resumo:** Upload: validação de mimetype após início do stream + export sem paginação

**Dimensão:** seguranca · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/api/src/routes/media.ts:217-340`
- `packages/api/src/routes/forms.ts:900`

**Problema:** Mimetype checado depois do stream iniciar; export CSV carrega até 10000 submissions em memória de uma vez.

**Impacto:** Banda desperdiçada em uploads inválidos; OOM/timeout em exports grandes.

---

### [TD-018] 🟠 SSRF: webhook de formulário sem validação na criação
Labels: `high`,`seguranca`,`tech-debt`

**Resumo:** SSRF: webhook de formulário sem validação na criação

**Dimensão:** seguranca · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/api/src/routes/forms.ts:94`
- `packages/api/src/routes/forms.ts:1012-1020`

**Problema:** isUrlSafeForSSRF roda só no submit público; POST/PUT /forms aceita webhook arbitrário (rede interna).

**Impacto:** Admin malicioso/comprometido aponta webhook para serviços internos.

---

### [TD-019] 🟡 Sessão sem binding de contexto (UA/IP)
Labels: `medium`,`seguranca`,`tech-debt`

**Resumo:** Sessão sem binding de contexto (UA/IP)

**Dimensão:** seguranca · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/api/src/plugins/auth.ts:99-117`

**Problema:** Validação de sessão checa apenas token+expiração; token roubado funciona de qualquer origem.

**Impacto:** Session hijacking sem fricção.

---

### [TD-020] 🟠 Upload/galeria duplicado em 3 fields do admin
Labels: `high`,`dry`,`tech-debt`

**Resumo:** Upload/galeria duplicado em 3 fields do admin

**Dimensão:** dry · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/admin/src/components/fields/FileField.tsx`
- `packages/admin/src/components/fields/ImageField.tsx`
- `packages/admin/src/components/fields/GalleryField.tsx:113-149`

**Problema:** Lógica de drag-drop/upload/biblioteca repetida (~90% entre FileField e ImageField).

**Impacto:** Correções não propagam; limites divergentes entre campos.

---

### [TD-021] 🟠 Stubs com dados falsos em campos do admin
Labels: `high`,`cleancode`,`tech-debt`

**Resumo:** Stubs com dados falsos em campos do admin

**Dimensão:** cleancode · **Severidade:** 🟠 Alto

**Localizações:**
- `packages/admin/src/components/fields/RelationField.tsx:27-36`
- `packages/admin/src/components/fields/MapField.tsx:59-93`

**Problema:** RelationField usa mockItems hardcoded; MapField simula geocoding com setTimeout. Nenhum sinaliza ao usuário que é stub.

**Impacto:** Editor publica conteúdo baseado em dados falsos; comportamento enganoso.

---

### [TD-022] 🟡 `as any` espalhado no admin
Labels: `medium`,`tipagem`,`tech-debt`

**Resumo:** `as any` espalhado no admin

**Dimensão:** tipagem · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/admin/src/components/fields/FlexibleField.tsx:157`
- `packages/admin/src/components/fields/MapField.tsx:37-39`
- `packages/admin/src/components/fields/RelationField.tsx:44`
- `packages/admin/src/pages/FormSubmissionsPage.tsx`

**Problema:** Configs específicas de campo lidas via (field as any).X em vez de FieldSchema tipado (config).

**Impacto:** Type safety desligada nos pontos de extensão de campo.

---

### [TD-023] 🟡 Divergência types/config.ts vs validation.ts (ssl) e defaults triplicados
Labels: `medium`,`solid`,`tech-debt`

**Resumo:** Divergência types/config.ts vs validation.ts (ssl) e defaults triplicados

**Dimensão:** solid · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/core/src/types/config.ts:8-19`
- `packages/core/src/config/validation.ts:15-22`
- `packages/core/src/config/defaults.ts:26-31`
- `packages/core/src/config/loader.ts:64-68`

**Problema:** Schema zod aceita ssl que o tipo não expõe; defaults de database hardcoded em 3 lugares.

**Impacto:** Config válida no zod não compila no TS; mudanças de default não propagam.

---

### [TD-024] 🟡 Zero testes em pacotes críticos
Labels: `medium`,`testabilidade`,`tech-debt`

**Resumo:** Zero testes em pacotes críticos

**Dimensão:** testabilidade · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/mcp/src`
- `packages/cli/src`
- `packages/client/src`
- `packages/admin/src/components/fields`

**Problema:** mcp/cli/client sem nenhum teste; admin com 2 suites para 117 arquivos; schema-sync sem teste de integração com rotas.

**Impacto:** Regressões no fluxo central (scan→sync→content) só aparecem manualmente.

---

### [TD-025] 🟡 Dockerfile sem otimização de cache e healthcheck frágil
Labels: `medium`,`escalabilidade`,`tech-debt`

**Resumo:** Dockerfile sem otimização de cache e healthcheck frágil

**Dimensão:** escalabilidade · **Severidade:** 🟡 Médio

**Localizações:**
- `Dockerfile:1-94`

**Problema:** COPY de fontes antes do install invalida cache de dependências a cada mudança.

**Impacto:** Builds de CI 5-10min mais lentos que o necessário.

---

### [TD-026] 🟡 Tratamento de erro genérico nas rotas (catch→500 uniforme)
Labels: `medium`,`cleancode`,`tech-debt`

**Resumo:** Tratamento de erro genérico nas rotas (catch→500 uniforme)

**Dimensão:** cleancode · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/api/src/routes/content.ts`
- `packages/api/src/routes/forms.ts`
- `packages/api/src/routes/media.ts`

**Problema:** Catches idênticos logam e devolvem 500 sem distinguir classe de erro.

**Impacto:** Debug difícil; clientes recebem 500 para erros recuperáveis.

---

### [TD-027] 🟡 GET /schema sem cache
Labels: `medium`,`escalabilidade`,`tech-debt`

**Resumo:** GET /schema sem cache

**Dimensão:** escalabilidade · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/api/src/routes/schema.ts:25-97`

**Problema:** Schema só muda em POST /schema/sync, mas é reconstruído do DB a cada GET.

**Impacto:** Carga desnecessária no caminho mais acessado do admin.

---

### [TD-028] 🟡 Componentes monolíticos no admin
Labels: `medium`,`estrutura`,`tech-debt`

**Resumo:** Componentes monolíticos no admin

**Dimensão:** estrutura · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/admin/src/pages/FormBuilderPage.tsx (778 linhas)`
- `packages/admin/src/components/fields/FlexibleField.tsx (304 linhas)`
- `packages/admin/src/pages/PageEditorPage.tsx (5 responsabilidades)`

**Problema:** Páginas concentram fetch, estado, atalhos, autosave e UI num único arquivo.

**Impacto:** Refatoração arriscada; testes unitários inviáveis.

---

### [TD-029] 🟡 Listas sem virtualização (Repeater/Flexible/Gallery)
Labels: `medium`,`escalabilidade`,`tech-debt`

**Resumo:** Listas sem virtualização (Repeater/Flexible/Gallery)

**Dimensão:** escalabilidade · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/admin/src/components/fields/RepeaterField.tsx`
- `packages/admin/src/components/fields/FlexibleField.tsx`
- `packages/admin/src/components/fields/GalleryField.tsx`

**Problema:** Render de todos os itens; uploads múltiplos sem chunking; invalidation de media invalida lista inteira.

**Impacto:** Editor degrada com dezenas/centenas de itens.

---

### [TD-030] 🟢 Lacunas de documentação e divergências menores
Labels: `low`,`documentacao`,`tech-debt`

**Resumo:** Lacunas de documentação e divergências menores

**Dimensão:** documentacao · **Severidade:** 🟢 Baixo

**Localizações:**
- `packages/client/src/index.ts:7-10`
- `packages/db/src/services/schema-sync.ts:41`
- `apps/docs (coleção vazia)`

**Problema:** Failure modes não documentados no SDK; JSDoc ausente em lógica complexa; site de docs vazio.

**Impacto:** Onboarding lento; suposições erradas de integradores.

---

### [TD-031] 🟢 detect_secrets: placeholder em .env.example
Labels: `low`,`seguranca`,`tech-debt`

**Resumo:** detect_secrets: placeholder em .env.example

**Dimensão:** seguranca · **Severidade:** 🟢 Baixo

**Localizações:**
- `.env.example:30`

**Problema:** DATABASE_URL com senha placeholder 'your-secure-password-here' — não é segredo real (falso positivo registrado por completude).

**Impacto:** Nenhum (placeholder intencional).

---

### [TD-032] 🟡 MCP: databasePath sem validação e handlers `any`
Labels: `medium`,`seguranca`,`tech-debt`

**Resumo:** MCP: databasePath sem validação e handlers `any`

**Dimensão:** seguranca · **Severidade:** 🟡 Médio

**Localizações:**
- `packages/mcp/src/server.ts:82,92,198`

**Problema:** Path do SQLite aceito sem resolve/checagem; handlers tipados como any apesar de schema zod disponível.

**Impacto:** Cliente MCP pode abrir arquivo arbitrário; erros de tool só em runtime.

---

