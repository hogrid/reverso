# Interrogatório — sessão E2E Reverso (2026-06-10)

Q1 @autor: "Quality gate verde" anterior usou cache turbo. E sem cache?
A1: Re-rodado com --force: typecheck 22/22, test 20/20, lint 0 erros (output bruto no veredito). ACEITO.

Q2 @autor: E2E só passou com node_modules quente da sessão. Instalação limpa reproduz?
A2: EM EXECUÇÃO — rm node_modules global + pnpm install --frozen-lockfile + build + E2E DB zerado.

Q3 @autor: lockfile sincronizado após os pnpm add da sessão?
A3: validado pelo próprio --frozen-lockfile da Q2 (falha se dessincronizado).

Q4 @autor: ciclo de módulos FieldRenderer↔RepeaterField introduzido — risco real?
A4: Eliminado por inversão (renderField prop). FlexibleField idem. fallow: 0 cycles. ACEITO.

Q5 @autor: rota pública duplicava 43 linhas da autenticada. Por quê?
A5: Débito introduzido na pressa; extraído buildPageContent(results, {publishedOnly}). ACEITO.

Q6 @autor: CSRF — .env.example anuncia REVERSO_CSRF_ENABLED, código tem `const csrfEnabled = false` hardcoded (server.ts:152). Produção com auth por cookie SEM CSRF?
A6: CONFIRMADO COMO DÉBITO 🟠 pré-existente (não introduzido no diff; linha já existia). Mitigação atual: SameSite cookie? (verificar) — vai pro relatório de débitos com prazo. NÃO bloqueia veredito do diff, bloqueia release "production-ready" sem ressalva → registrado como pendência obrigatória pré-deploy público.

Q7 @autor: sanitize.ts duplicado entre examples?
A7: Intencional — examples são templates standalone copiáveis; cada um precisa ser autossuficiente. ACEITO com justificativa.

Q8 @autor: fallow exit 1 — regra diz REPROVADO?
A8: Findings introduzidos reais corrigidos (cycles, dup content.ts, unlisted dep raiz). Restante: FPs comprovados por grep (@reverso/client importado em examples/*/src/lib/reverso.ts; queries db importadas por packages/api) + herdados fora do escopo. Degrade documentado.

Q9 @autor: repeater — deleção de item persiste? Só testamos add/edit.
A9: PENDENTE — incluir no E2E limpo (Q2): remover item via API e validar.
