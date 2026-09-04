# Roadmap para o lançamento do Reverso

Data de referência: 2026-09-04. Este documento registra o estado real do projeto
(medido, não declarado), o que bloqueia o uso e o lançamento, e a ordem em que
o trabalho é executado. Cada item traz o critério de aceite que fecha a entrega.

## 1. Diagnóstico (estado encontrado)

Gate estático antes de qualquer correção, sem cache:

| Verificação | Resultado |
|-------------|-----------|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm build` | 16/16 pacotes OK |
| `pnpm typecheck` | 22/22 OK |
| `biome check .` | 0 erros, 172 warnings |
| `pnpm test` | 269 testes OK em 6 pacotes |

O gate verde escondia defeitos de runtime porque o fluxo real nunca era
exercitado por teste. Defeitos encontrados executando o produto de ponta a ponta:

### Bloqueadores (o produto não pode ser usado ou lançado)

1. **`reverso start` crasha** com `Method 'POST' already declared for route
   '/auth/login'`. O comando registra as rotas duas vezes. O caminho de produção
   está morto.
2. **Dockerfile inicia `packages/api/dist/cli.js`**, arquivo que não existe. O
   deploy por container está morto.
3. **Autenticação desligada fora de `NODE_ENV=production`.** `reverso start` não
   define essa variável, então um servidor publicado aceita `PATCH` de conteúdo,
   upload e sync de schema sem login. Em `reverso dev` o login existe só na
   aparência: a API responde 200 para qualquer requisição anônima.
4. **Schema do banco divergente.** `createDatabaseSchema` escreve `CREATE TABLE`
   à mão e o SQL não bate com o schema Drizzle (`is_enabled`, `hit_count`,
   `is_multi_step`, `webhook_sent_at`, `help`, `validation`, `width` e outras
   colunas não existem). Resultado: **Formulários, Redirects, Sitemap e
   Submissões respondem 500**. Não há pasta de migrations, então
   `reverso migrate` não faz nada útil.
5. **`npx reverso dev` falha após clone limpo.** O link `node_modules/.bin/reverso`
   não é criado porque `dist/bin.js` ainda não existe no momento do
   `pnpm install`, e o `npx` cai no registro público procurando o pacote
   `reverso`, que não existe. O passo a passo do README não funciona.
6. **`create-reverso` gera um projeto que não lê o CMS.** Template com Next 14 e
   React 18, dependências `latest` e sem `@reverso/client`; o front nasce sem
   nenhuma leitura de conteúdo.

### Defeitos visíveis no admin

7. Páginas Formulários e Redirects ficam em "Loading..." para sempre quando a
   API falha; não existe estado de erro.
8. Campo `radio` não renderiza opções (campo "Plan" do showcase aparece vazio).
9. Campo `boolean` mostra o rótulo duas vezes.

### Lacunas de qualidade

10. Zero testes em `@reverso/cli`, `@reverso/client`, `@reverso/mcp`,
    `create-reverso` e no watcher do scanner.
11. Testes da API não cobrem forms, redirects, media, sitemap, auth ativa nem
    endpoints públicos (por isso o drift passou despercebido).
12. Os specs Playwright apontam para um Vite em `localhost:5173` que nunca sobe
    no CI; não há E2E executável.
13. CI roda um serviço Postgres que nenhum teste usa; não há job de E2E; release
    desativado.
14. README promete GraphQL, multi-idioma, agendamento e revisões que não existem.

### O que funciona

Scanner (34 campos do showcase), sync de schema, watch mode (adicionar e
remover marcador reflete em segundos), registro e login, editor de página com
abas e repeater, salvar conteúdo, endpoints públicos, SDK `@reverso/client`,
front Next.js renderizando conteúdo do CMS, upload de mídia, MCP server via
stdio, `reverso build`.

## 2. Fases

### Fase 1: tornar o fluxo completo funcional (bloqueadores)

| # | Entrega | Critério de aceite |
|---|---------|--------------------|
| 1.1 | Migrations Drizzle geradas e publicadas; `createDatabaseSchema` roda as migrations; teste de drift compara colunas do Drizzle com o banco criado | Forms, Redirects, Sitemap e Submissões respondem 200 em banco novo; `reverso migrate` aplica migrations |
| 1.2 | `reverso start` registra rotas uma vez; Dockerfile inicia o CLI real | `reverso build && reverso start` sobe; imagem Docker sobe e responde `/health` |
| 1.3 | Auth ligada por padrão em `dev` e `start`; `reverso dev` gera chave interna para o sync do scanner; `reverso scan` reutiliza a chave | `PATCH` anônimo responde 401 em dev e em start; sync do watcher continua funcionando |
| 1.4 | Shims `bin/` versionados para `reverso`, `create-reverso` e `reverso-mcp` | `pnpm install && pnpm build && cd examples/showcase && npx reverso dev` funciona em clone limpo |
| 1.5 | Estados de erro no admin; `radio` renderiza; rótulo do `boolean` único | Probe em browser sem erros de console nas páginas Forms e Redirects; campo Plan editável |
| 1.6 | Template do `create-reverso` com Next 15, React 19, `@reverso/client` e versões alinhadas ao monorepo | Projeto gerado compila e renderiza conteúdo do CMS |

### Fase 2: rede de testes que pega regressão real

| # | Entrega | Critério de aceite |
|---|---------|--------------------|
| 2.1 | Integração da API: forms (CRUD, campos, submissão pública, export), redirects (CRUD, import), media (upload real), sitemap, auth ativa (401/403), endpoints públicos | Suíte roda em banco temporário sem mocks de DB |
| 2.2 | Unitários: `@reverso/client` (fallbacks, timeout, onError), `@reverso/mcp` (tools), scanner watcher (add/remove), `create-reverso` (geração de arquivos), CLI (`start` não duplica rotas) | Cada pacote com `vitest run` verde e sem `--passWithNoTests` |
| 2.3 | Playwright contra `reverso dev` real no showcase: registro, login, editor, salvar, repeater, forms, redirects, leitura pública | `pnpm test:e2e` sobe o servidor, roda e derruba; job `e2e` no CI |

### Fase 3: pronto para lançar

| # | Entrega | Critério de aceite |
|---|---------|--------------------|
| 3.1 | CI: lint, typecheck, test, build, e2e; sem serviço Postgres; release com changesets condicionado ao secret `NPM_TOKEN` | Workflow verde em PR |
| 3.2 | Changeset desta rodada, versões e CHANGELOG | `pnpm changeset status` limpo |
| 3.3 | README e docs alinhados ao que existe; roadmap futuro honesto | Nenhuma funcionalidade documentada sem implementação |

### Fase 4: verificação final

Instalação limpa, build, gate sem cache, os três cenários de uso (adicionar a
projeto existente, projeto novo, sincronizar campos com servidor rodando) e
E2E em browser. Só depois disso o trabalho é considerado pronto para uso.

## 3. Status da execução

Atualizado em 2026-09-04, na branch `claude/project-roadmap-launch-xnvhul`.

| Fase | Situação | Evidência |
|------|----------|-----------|
| 1. Fluxo funcional | Concluída | `reverso start` sobe e serve o admin; forms, redirects, sitemap e submissões respondem 200; `PATCH` anônimo responde 401 em dev e produção; `npx reverso dev` funciona em clone limpo; projeto gerado pelo `create-reverso` compila com Next 15 e lê o CMS |
| 2. Rede de testes | Concluída | 9 pacotes com suíte própria; API com 45 testes de integração (auth ativa, forms, redirects, media, sitemap); smoke test do binário `reverso build` + `start`; Playwright com 17 specs contra `reverso dev` real, rodando em cerca de 20 segundos; job `e2e` no CI |
| 3. Pronto para lançar | Concluída | Versões 0.3.0 via changesets, release workflow com guarda de `NPM_TOKEN`, README, docs, `.env.example`, SECURITY e CONTRIBUTING alinhados ao produto |
| 4. Verificação final | Concluída | Instalação limpa com lockfile congelado, build, typecheck, lint, testes e E2E verdes sem cache |
| 5. Revisão de produção | Concluída | Cada tipo de campo exercitado no navegador (texto, rich text, código, select, radio, switch, data, hora, cor, imagem, galeria, arquivo, link, mapa, repeater) e lido pelo front Next via `@reverso/client`; 28 specs E2E cobrindo o fluxo; config única para `init`, `dev`, `scan`, `build`, `start` e `migrate` |

Bugs adicionais encontrados e corrigidos pelos testes novos, além dos listados
no diagnóstico: plugin de auth não validava o cookie de sessão (o admin nunca
funcionaria com auth ligada); rota `pages/:slug` descartava `options`,
`validation` e `help` dos campos; páginas de Redirects e Mídia nunca
renderizavam a lista (formato de resposta divergente dos hooks); botão
"Upload" inerte; botão de login travado ao abrir `/admin/login` direto; rate
limit contava assets estáticos e respondia 500; `content_get_content` do MCP
devolvia JSON serializado; `startWatch` do scanner resolvia antes do watcher
ficar pronto.

Bugs encontrados e corrigidos na revisão de produção (fase 5): uploads eram
gravados como `/uploads/...` e o front em outro domínio pedia o arquivo a si
mesmo (imagem quebrada); `page.get()` devolvia objetos para `src` e `href`;
o editor WYSIWYG invertia o texto digitado; upload rejeitado pela API não
mostrava nada ao usuário; valores de arquivo perdiam o nome original; imagens
não tinham largura e altura; campos de mapa, data, número e cor não
persistiam de forma consistente; `reverso build`, `start` e `dev` podiam
apontar para bancos diferentes; `reverso init` gerava `srcDir` inexistente;
marcadores com expressões dinâmicas viravam caminhos inválidos; cookie de
sessão com `Secure` fixo impedia login em HTTP interno; CSRF exigia header
que o admin não enviava.

Os relatórios da auditoria anterior (`RELATORIO-DEBITOS-TECNICOS.md`,
`GITHUB-ISSUES.md`, `.devils-advocate/`) ficam como histórico; este arquivo é a
referência atual.

## 4. Depois do lançamento (backlog)

Itens úteis que não bloqueiam a primeira versão utilizável:

- Binding de sessão por user-agent/IP (TD-019).
- Cache do `GET /schema` invalidado no sync (TD-027).
- Virtualização de listas longas no editor (TD-029).
- Quebra dos componentes monolíticos do admin (TD-028).
- Tratamento de erro tipado nas rotas em vez de 500 genérico (TD-026).
- Suporte real a PostgreSQL (hoje só SQLite está implementado).
- GraphQL, multi-idioma na UI, agendamento e histórico de revisões na UI.
- Extensão VS Code, importador WordPress, `@reverso/react`.
